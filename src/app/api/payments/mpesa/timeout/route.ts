import { NextResponse } from 'next/server';
import { addAdminNotification, dispatchMessage } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientEmail, clientName, amount, orderRef } = body;

    if (!clientEmail) {
      return NextResponse.json({ error: 'clientEmail é obrigatório.' }, { status: 400 });
    }

    // 🔴 Notificar Administrador sobre tempo limite de pagamento M-Pesa
    addAdminNotification({
      title: `⏳ M-Pesa: Tempo Expirado / PIN Não Digitado`,
      message: `O cliente ${clientName || clientEmail} não introduziu o PIN a tempo ou cancelou no telemóvel. Ref: ${orderRef || 'N/A'}.`,
      type: 'payment_failed',
      userEmail: clientEmail,
      userName: clientName || 'Cliente',
      link: '/admin?tab=orders'
    });

    // ✉️ Enviar e-mail automático ao cliente sobre o tempo expirado / falha no PIN
    const result = await dispatchMessage({
      recipientEmail: clientEmail,
      recipientName: clientName || 'Cliente',
      templateId: 'payment-failed',
      variables: {
        numero_pedido: orderRef || 'N/A',
        valor: typeof amount === 'number' ? `${amount.toLocaleString('pt-MZ')} MT` : (amount || 'N/A')
      },
      isAutomatic: true,
      eventType: 'mpesa_payment_timeout'
    });

    return NextResponse.json({ success: true, emailSent: result.success });
  } catch (error) {
    console.error('Erro no endpoint de timeout M-Pesa:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
