import { NextResponse } from 'next/server';
import { addAdminNotification, dispatchMessage } from '@/lib/notifications';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';
import SiteModel from '@/lib/models/Site';
import { generateInvoicePdf } from '@/lib/invoiceGenerator';
import { generateHostingCredentials } from '@/lib/provisioning';
import CourseModel from '@/lib/models/CourseModel';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[M-PESA CALLBACK RECEBIDO]:', body);

    // Extrair dados do callback M-Pesa (formato Vodacom)
    const transactionStatus = String(body.output_ResponseCode || body.TransactionStatus || 'unknown');
    const transactionId = body.output_TransactionID || body.TransactionID || 'N/A';
    const amount = body.output_Amount || body.Amount || 0;
    const msisdn = body.output_MSISDN || body.MSISDN || 'N/A';
    const thirdPartyRef = body.input_ThirdPartyReference || body.ThirdPartyReference || body.reference || 'N/A';
    const userEmail = body.userEmail || body.email || '';
    const userName = body.userName || msisdn;

    const isSuccess = transactionStatus === '0' || transactionStatus === 'INS-0' || transactionStatus.toUpperCase() === 'SUCCESS';

    // Atualização automática na Base de Dados (Se disponível)
    try {
      await connectDB();
      if (thirdPartyRef && thirdPartyRef !== 'N/A') {
        const orderIdClean = thirdPartyRef.replace('ORDER_', '');
        await OrderModel.findOneAndUpdate(
          { id: { $regex: new RegExp(orderIdClean, 'i') } },
          { 
            status: isSuccess ? 'completed' : 'pending',
            ...(isSuccess ? { valorFaturado: amount } : {})
          }
        );

        if (isSuccess && userEmail) {
          await SiteModel.updateMany(
            { userEmail: userEmail.toLowerCase() },
            { status: 'active' }
          );
        }
      }
    } catch (dbErr) {
      console.warn('Alerta no DB durante callback M-Pesa:', dbErr);
    }

    if (isSuccess) {
      // 🟢 CASO DE SUCESSO: Notificar Administrador
      addAdminNotification({
        title: `💳 Pagamento M-Pesa Confirmado`,
        message: `Pagamento de ${Number(amount).toLocaleString('pt-MZ')} MT recebido via M-Pesa (${msisdn}). TxID: ${transactionId}. Ref: ${thirdPartyRef}.`,
        type: 'payment_success',
        userEmail: userEmail || msisdn,
        userName: userName,
        link: '/admin?tab=orders'
      });

      // ✉️ Enviar recibo ao cliente por e-mail
      if (userEmail) {
        let pdfBase64 = '';
        try {
          pdfBase64 = await generateInvoicePdf({
            invoiceRef: thirdPartyRef,
            userName: userName || 'Cliente',
            planName: 'Serviços WEHOSTHERE',
            amount: Number(amount).toLocaleString('pt-MZ'),
            date: new Date().toLocaleDateString('pt-MZ')
          });
        } catch (err) {
          console.error('Erro ao gerar PDF da fatura:', err);
        }

        await dispatchMessage({
          recipientEmail: userEmail,
          recipientName: userName || 'Cliente',
          templateId: 'payment-confirmed',
          variables: {
            numero_pedido: thirdPartyRef,
            valor: `${Number(amount).toLocaleString('pt-MZ')} MT`
          },
          isAutomatic: true,
          eventType: 'mpesa_payment_success',
          attachments: pdfBase64 ? [{ filename: `Fatura_${thirdPartyRef}.pdf`, content: pdfBase64 }] : []
        });

        // 🔑 AUTO-PROVISIONAMENTO: Enviar credenciais de acesso ao serviço por e-mail
        try {
          const creds = generateHostingCredentials(thirdPartyRef, userEmail);
          await dispatchMessage({
            recipientEmail: userEmail,
            recipientName: userName || 'Cliente',
            templateId: 'service-credentials',
            variables: {
              numero_pedido: thirdPartyRef,
              utilizador: creds.username,
              palavra_passe: creds.password,
              link_painel: creds.cpanelUrl,
              link_webmail: creds.webmailUrl,
              servidor_dns1: creds.nameserver1,
              servidor_dns2: creds.nameserver2
            },
            isAutomatic: true,
            eventType: 'service_auto_provisioned'
          });
        } catch (credErr) {
          console.error('Erro ao gerar/enviar credenciais de acesso:', credErr);
        }

        // 🎓 Inscrição automática para cursos
        try {
          const order = await OrderModel.findOne({ 
            id: { $regex: new RegExp(orderIdClean, 'i') } 
          });
          
          if (order && order.serviceName?.toLowerCase().includes('curso') && userEmail) {
            // Buscar cursos para encontrar o curso correspondente
            const courses = await CourseModel.find({});
            
            // Tentar encontrar o curso pelo nome ou pela correspondência parcial
            const matchingCourse = courses.find((course: any) => 
              course.title.toLowerCase().includes(order.serviceName.toLowerCase()) ||
              order.serviceName.toLowerCase().includes(course.title.toLowerCase())
            );

            if (matchingCourse) {
              // Criar inscrição via API
              const enrollmentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'create',
                  enrollment: {
                    userId: userEmail,
                    courseId: matchingCourse.id,
                    status: 'active',
                    enrolledAt: new Date().toISOString(),
                    paymentId: order.id
                  }
                })
              });

              if (enrollmentResponse.ok) {
                console.log('[M-PESA Callback] Inscrição automática criada para:', userEmail, 'no curso:', matchingCourse.title);
                
                // Enviar email de boas-vindas ao curso
                await dispatchMessage({
                  recipientEmail: userEmail,
                  recipientName: userName || 'Cliente',
                  templateId: 'course_enrollment',
                  variables: {
                    courseTitle: matchingCourse.title
                  },
                  isAutomatic: true,
                  eventType: 'course_auto_enrollment'
                });
              }
            }
          }
        } catch (enrollErr) {
          console.error('Erro ao criar inscrição automática no callback M-Pesa:', enrollErr);
          // Não falhar o pagamento se a inscrição falhar
        }
      }
    } else {
      // 🔴 CASO DE ERRO / FALHA: Notificar Administrador
      addAdminNotification({
        title: `⚠️ Pagamento M-Pesa Falhado`,
        message: `Falha no pagamento via M-Pesa de ${msisdn}. Código: ${transactionStatus}. TxID: ${transactionId}. Ref: ${thirdPartyRef}.`,
        type: 'payment_failed',
        userEmail: userEmail || msisdn,
        userName: userName,
        link: '/admin?tab=orders'
      });

      // ✉️ Notificar o cliente sobre a falha no pagamento
      if (userEmail) {
        await dispatchMessage({
          recipientEmail: userEmail,
          recipientName: userName || 'Cliente',
          templateId: 'payment-failed',
          variables: {
            numero_pedido: thirdPartyRef,
            valor: `${Number(amount).toLocaleString('pt-MZ')} MT`
          },
          isAutomatic: true,
          eventType: 'mpesa_payment_failed'
        });
      }
    }

    return NextResponse.json({ status: 'SUCCESS', message: 'Callback processado' });
  } catch (error) {
    console.error('Erro no Callback M-Pesa:', error);
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}
