import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import InvoiceModel from '@/lib/models/Invoice';
import { generateInvoicePdf } from '@/lib/invoiceGenerator';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const invoiceId = params.id;
    const invoice = await InvoiceModel.findOne({ id: invoiceId }).lean();
    
    if (!invoice || Array.isArray(invoice)) {
      return NextResponse.json({ success: false, error: 'Fatura não encontrada' }, { status: 404 });
    }

    // Verificar permissão: admin ou cliente dono da fatura
    const userEmail = (session.user as any)?.email?.toLowerCase();
    const isAdmin = (session.user as any)?.role === 'admin' || (session.user as any)?.role === 'super_admin';
    
    if (!isAdmin && invoice.customerEmail?.toLowerCase() !== userEmail) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
    }

    // Gerar PDF
    const pdfBase64 = await generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      invoiceRef: invoice.id,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      issuedAt: invoice.issuedAt,
      servicePeriodStart: invoice.servicePeriodStart,
      servicePeriodEnd: invoice.servicePeriodEnd,
      dueDate: invoice.dueDate,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      items: invoice.items as any,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      total: invoice.total,
      currency: invoice.currency,
      notes: invoice.notes
    });

    // Converter base64 para buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Fatura-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (e) {
    console.error('[API/invoices/pdf] Erro ao gerar PDF:', e);
    return NextResponse.json({ success: false, error: 'Erro ao gerar PDF' }, { status: 500 });
  }
}
