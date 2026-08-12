import { NextResponse } from 'next/server';
import { addAdminNotification, dispatchMessage } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('M-Pesa Callback recebido:', body);

    // Extrair dados do callback M-Pesa (formato Vodacom)
    const transactionStatus = body.output_ResponseCode || body.TransactionStatus || 'unknown';
    const transactionId = body.output_TransactionID || body.TransactionID || 'N/A';
    const amount = body.output_Amount || body.Amount || 0;
    const msisdn = body.output_MSISDN || body.MSISDN || 'N/A';
    const thirdPartyRef = body.input_ThirdPartyReference || body.ThirdPartyReference || 'N/A';
    const userEmail = body.userEmail || '';
    const userName = body.userName || msisdn;

    const isSuccess = transactionStatus === '0' || transactionStatus === 'SUCCESS' || String(transactionStatus) === '0';

    if (isSuccess) {
      // Notificar Administrador de pagamento M-Pesa recebido
      addAdminNotification({
        title: `💳 Pagamento M-Pesa Confirmado`,
        message: `Pagamento de ${Number(amount).toLocaleString('pt-MZ')} MT recebido via M-Pesa (${msisdn}). TxID: ${transactionId}. Ref: ${thirdPartyRef}.`,
        type: 'payment_success',
        userEmail: userEmail || msisdn,
        userName: userName,
        link: '/admin?tab=orders'
      });

      // Notificar o cliente por e-mail (se tiver e-mail disponível no callback)
      if (userEmail) {
        await dispatchMessage({
          recipientEmail: userEmail,
          recipientName: userName || 'Cliente',
          templateId: 'payment-confirmed',
          variables: {
            numero_pedido: thirdPartyRef,
            valor: `${Number(amount).toLocaleString('pt-MZ')} MT`
          },
          isAutomatic: true,
          eventType: 'mpesa_payment_success'
        });
      }
    } else {
      // Notificar Admin de pagamento falhado / pendente
      addAdminNotification({
        title: `⚠️ Pagamento M-Pesa Falhado`,
        message: `Falha no pagamento via M-Pesa de ${msisdn}. Código: ${transactionStatus}. TxID: ${transactionId}. Ref: ${thirdPartyRef}.`,
        type: 'payment_failed',
        userEmail: userEmail || msisdn,
        userName: userName,
        link: '/admin?tab=orders'
      });
    }

    return NextResponse.json({ status: 'SUCCESS', message: 'Callback processado' });
  } catch (error) {
    console.error('Erro no Callback M-Pesa:', error);
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}
