import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface InvoiceData {
  invoiceRef: string;
  userName: string;
  planName: string;
  amount: number | string;
  date: string;
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

  // Header Background
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
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

  // Title "FATURA / RECIBO"
  page.drawText('FATURA / RECIBO', {
    x: width - 250,
    y: height - 60,
    size: 20,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Nº: ${data.invoiceRef}`, {
    x: width - 250,
    y: height - 85,
    size: 12,
    font,
    color: rgb(1, 1, 1),
  });

  // Customer Details
  page.drawText('Faturado a:', { x: 50, y: height - 160, size: 12, font: boldFont, color: textColor });
  page.drawText(data.userName, { x: 50, y: height - 180, size: 14, font, color: textColor });
  
  // Invoice Details
  page.drawText('Detalhes:', { x: width - 250, y: height - 160, size: 12, font: boldFont, color: textColor });
  page.drawText(`Data: ${data.date}`, { x: width - 250, y: height - 180, size: 12, font, color: textColor });
  page.drawText('Estado: PAGO', { x: width - 250, y: height - 200, size: 12, font, color: rgb(0.1, 0.6, 0.3) });

  // Line Separator
  page.drawLine({
    start: { x: 50, y: height - 240 },
    end: { x: width - 50, y: height - 240 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Table Headers
  const tableY = height - 280;
  page.drawText('Descrição do Serviço', { x: 50, y: tableY, size: 12, font: boldFont, color: textColor });
  page.drawText('Valor', { x: width - 150, y: tableY, size: 12, font: boldFont, color: textColor });

  page.drawLine({
    start: { x: 50, y: tableY - 10 },
    end: { x: width - 50, y: tableY - 10 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Table Content
  page.drawText(`Plano de Hospedagem - ${data.planName}`, { x: 50, y: tableY - 35, size: 12, font, color: textColor });
  page.drawText(`${data.amount} MT`, { x: width - 150, y: tableY - 35, size: 12, font, color: textColor });

  page.drawLine({
    start: { x: 50, y: tableY - 60 },
    end: { x: width - 50, y: tableY - 60 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Total
  page.drawText('TOTAL PAGO:', { x: width - 250, y: tableY - 100, size: 14, font: boldFont, color: textColor });
  page.drawText(`${data.amount} MT`, { x: width - 150, y: tableY - 100, size: 14, font: boldFont, color: primaryColor });

  // Footer
  const footerY = 80;
  page.drawText('Obrigado pela sua preferência!', { x: 50, y: footerY + 20, size: 14, font: boldFont, color: primaryColor });
  page.drawText('WEHOSTHERE - Maputo, Moçambique', { x: 50, y: footerY, size: 10, font, color: lightColor });
  page.drawText('Email: info@wehosthere.com | Web: wehosthere.com', { x: 50, y: footerY - 15, size: 10, font, color: lightColor });

  const pdfBytes = await pdfDoc.saveAsBase64();
  return pdfBytes;
}
