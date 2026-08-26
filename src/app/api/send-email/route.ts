import { NextResponse } from 'next/server';
import { 
  sendEmail, 
  sendWebmailMessage, 
  sendCourseEnrollmentEmail, 
  sendCoursePurchaseEmail, 
  sendCourseCompletionEmail, 
  sendRoleChangeEmail 
} from '@/lib/sendgrid';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, from, to, subject, body: msgBody, text, html, userName, courseTitle, amount, certificateNumber, verificationUrl, role } = body;

    // Validação básica para tipos específicos ou genéricos
    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Campo obrigatório: to' },
        { status: 400 }
      );
    }

    let result;

    if (type === 'course_enrollment') {
      result = await sendCourseEnrollmentEmail(to, userName || 'Aluno', courseTitle || 'Curso');
    } else if (type === 'course_purchase') {
      result = await sendCoursePurchaseEmail(to, userName || 'Aluno', courseTitle || 'Curso', amount || 500);
    } else if (type === 'course_completion') {
      result = await sendCourseCompletionEmail(to, userName || 'Aluno', courseTitle || 'Curso', certificateNumber || 'WH-CERT', verificationUrl || '');
    } else if (type === 'role_change') {
      result = await sendRoleChangeEmail(to, userName || 'Utilizador', role || 'user');
    } else if (type === 'webmail') {
      if (!from) {
        return NextResponse.json(
          { success: false, error: 'Remetente (from) é obrigatório para Webmail.' },
          { status: 400 }
        );
      }
      result = await sendWebmailMessage(from, to, subject || '(Sem assunto)', msgBody || text || '');
    } else {
      // Tipo: e-mail transacional genérico
      result = await sendEmail({
        to,
        fromEmail: from,
        subject: subject || '(Sem assunto)',
        text: typeof msgBody === 'string' ? msgBody : text,
        html: html,
      });
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: 'E-mail enviado com sucesso via Resend.' });
    } else {
      // Fallback gracioso — regista o erro mas não quebra a UI
      console.warn('[API/send-email] Resend falhou:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Erro desconhecido no Resend.',
        fallback: true,
        message: 'E-mail registado localmente. Verifica as variáveis RESEND_API_KEY e EMAIL_USER no .env.local.',
      }, { status: 200 });
    }
  } catch (err) {
    console.error('[API/send-email] Erro interno:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
