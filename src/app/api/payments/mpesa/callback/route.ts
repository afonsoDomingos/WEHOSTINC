import { NextResponse } from 'next/server';
import { addAdminNotification, dispatchMessage } from '@/lib/notifications';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';
import SiteModel from '@/lib/models/Site';
import { generateInvoicePdf } from '@/lib/invoiceGenerator';

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
