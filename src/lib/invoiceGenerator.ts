import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { InvoiceItem } from '@/lib/models/Invoice';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  issuedAt: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  dueDate?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  notes?: string;
}

export async function generateInvoicePdf(data: InvoiceData): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const primaryColor = rgb(0.114, 0.227, 0.541); // #1d3a8a
  const textColor = rgb(0.2, 0.2, 0.2);
  const lightColor = rgb(0.5, 0.5, 0.5);
  const successColor = rgb(0.1, 0.6, 0.3);
  const warningColor = rgb(0.8, 0.4, 0);

  // Formatar datas
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-MZ') + ' ' + data.currency;
  };

  // Header Background
  page.drawRectangle({
    x: 0,
    y: height - 140,
    width: width,
    height: 140,
    color: primaryColor,
  });

  // Company Name
  page.drawText('WEHOSTHERE', {
    x: 50,
    y: height - 60,
    size: 28,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('Hospedagem de Sites & Email Profissional', {
    x: 50,
    y: height - 85,
    size: 10,
    font,
    color: rgb(0.8, 0.9, 1),
  });

  // Title "FATURA"
  page.drawText('FATURA', {
    x: width - 250,
    y: height - 60,
    size: 20,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Nº: ${data.invoiceNumber}`, {
    x: width - 250,
    y: height - 85,
    size: 12,
    font,
    color: rgb(1, 1, 1),
  });

  // Customer Details
  page.drawText('Faturado a:', { x: 50, y: height - 180, size: 12, font: boldFont, color: textColor });
  page.drawText(data.customerName, { x: 50, y: height - 200, size: 14, font, color: textColor });
  page.drawText(data.customerEmail, { x: 50, y: height - 220, size: 11, font, color: lightColor });
  if (data.customerPhone) {
    page.drawText(data.customerPhone, { x: 50, y: height - 240, size: 11, font, color: lightColor });
  }
  
  // Invoice Details
  page.drawText('Detalhes da Fatura:', { x: width - 250, y: height - 180, size: 12, font: boldFont, color: textColor });
  page.drawText(`Data de Emissão: ${formatDate(data.issuedAt)}`, { x: width - 250, y: height - 200, size: 11, font, color: textColor });
  
  if (data.servicePeriodStart && data.servicePeriodEnd) {
    page.drawText(`Período: ${formatDate(data.servicePeriodStart)} - ${formatDate(data.servicePeriodEnd)}`, { x: width - 250, y: height - 220, size: 11, font, color: textColor });
  }
  
  if (data.dueDate) {
    page.drawText(`Vencimento: ${formatDate(data.dueDate)}`, { x: width - 250, y: height - 240, size: 11, font, color: textColor });
  }

  // Status
  const statusLabels = {
    draft: 'RASCUNHO',
    pending: 'PENDENTE',
    paid: 'PAGO',
    overdue: 'VENCIDO',
    cancelled: 'CANCELADO'
  };
  const statusColor = data.status === 'paid' ? successColor : (data.status === 'overdue' ? warningColor : textColor);
  page.drawText(`Estado: ${statusLabels[data.status]}`, { x: width - 250, y: height - 260, size: 12, font: boldFont, color: statusColor });

  if (data.paymentMethod) {
    const paymentMethodLabels = {
      mpesa: 'M-Pesa',
      emola: 'eMola',
      card: 'Cartão',
      bank_transfer: 'Transferência Bancária',
      manual: 'Pagamento Manual'
    };
    const label = paymentMethodLabels[data.paymentMethod as keyof typeof paymentMethodLabels] || data.paymentMethod;
    page.drawText(`Método: ${label}`, { x: width - 250, y: height - 280, size: 11, font, color: lightColor });
  }

  // Line Separator
  page.drawLine({
    start: { x: 50, y: height - 320 },
    end: { x: width - 50, y: height - 320 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Table Headers
  const tableY = height - 360;
  page.drawText('Descrição', { x: 50, y: tableY, size: 11, font: boldFont, color: textColor });
  page.drawText('Qtd', { x: 350, y: tableY, size: 11, font: boldFont, color: textColor });
  page.drawText('Preço Unit.', { x: 400, y: tableY, size: 11, font: boldFont, color: textColor });
  page.drawText('Subtotal', { x: width - 150, y: tableY, size: 11, font: boldFont, color: textColor });

  page.drawLine({
    start: { x: 50, y: tableY - 10 },
    end: { x: width - 50, y: tableY - 10 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Table Content
  let currentY = tableY - 35;
  data.items.forEach((item, index) => {
    // Descrição (quebra linha se necessário)
    const description = `${item.service} - ${item.description}`;
    page.drawText(description, { x: 50, y: currentY, size: 10, font, color: textColor });
    
    // Quantidade
    page.drawText(item.quantity.toString(), { x: 350, y: currentY, size: 10, font, color: textColor });
    
    // Preço unitário
    page.drawText(formatCurrency(item.unitPrice), { x: 400, y: currentY, size: 10, font, color: textColor });
    
    // Subtotal
    page.drawText(formatCurrency(item.subtotal), { x: width - 150, y: currentY, size: 10, font, color: textColor });

    currentY -= 25;

    // Linha separadora entre itens
    if (index < data.items.length - 1) {
      page.drawLine({
        start: { x: 50, y: currentY - 5 },
        end: { x: width - 50, y: currentY - 5 },
        thickness: 0.5,
        color: rgb(0.95, 0.95, 0.95),
      });
      currentY -= 10;
    }
  });

  // Linha separadora antes dos totais
  page.drawLine({
    start: { x: 50, y: currentY - 5 },
    end: { x: width - 50, y: currentY - 5 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  currentY -= 25;

  // Subtotal
  page.drawText('Subtotal:', { x: width - 250, y: currentY, size: 12, font, color: textColor });
  page.drawText(formatCurrency(data.subtotal), { x: width - 150, y: currentY, size: 12, font, color: textColor });
  currentY -= 20;

  // Desconto
  if (data.discount > 0) {
    page.drawText('Desconto:', { x: width - 250, y: currentY, size: 12, font, color: warningColor });
    page.drawText(`-${formatCurrency(data.discount)}`, { x: width - 150, y: currentY, size: 12, font, color: warningColor });
    currentY -= 20;
  }

  // Total
  page.drawText('TOTAL:', { x: width - 250, y: currentY, size: 16, font: boldFont, color: textColor });
  page.drawText(formatCurrency(data.total), { x: width - 150, y: currentY, size: 16, font: boldFont, color: primaryColor });

  // Observações
  if (data.notes) {
    currentY -= 40;
    page.drawText('Observações:', { x: 50, y: currentY, size: 11, font: boldFont, color: textColor });
    currentY -= 15;
    
    // Quebrar observações em linhas
    const maxCharsPerLine = 90;
    const words = data.notes.split(' ');
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + word).length > maxCharsPerLine) {
        page.drawText(currentLine, { x: 50, y: currentY, size: 10, font, color: lightColor });
        currentY -= 15;
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    
    if (currentLine) {
      page.drawText(currentLine, { x: 50, y: currentY, size: 10, font, color: lightColor });
    }
  }

  // Footer
  const footerY = 80;
  page.drawText('Obrigado pela sua preferência!', { x: 50, y: footerY + 20, size: 14, font: boldFont, color: primaryColor });
  page.drawText('WEHOSTHERE - Maputo, Moçambique', { x: 50, y: footerY, size: 10, font, color: lightColor });
  page.drawText('Email: info@wehosthere.com | Web: wehosthere.com', { x: 50, y: footerY - 15, size: 10, font, color: lightColor });
  page.drawText('NIF: 123456789', { x: 50, y: footerY - 30, size: 10, font, color: lightColor });

  const pdfBytes = await pdfDoc.saveAsBase64();
  return pdfBytes;
}
