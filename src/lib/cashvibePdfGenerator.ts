import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateLoanContractPdf(loan: any, client?: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Paleta de Cores
  const primaryColor = rgb(0.06, 0.45, 0.32); // Emerald Dark
  const darkSlate = rgb(0.08, 0.12, 0.18);
  const textColor = rgb(0.15, 0.15, 0.15);
  const mutedText = rgb(0.45, 0.48, 0.52);
  const bgBox = rgb(0.96, 0.97, 0.98);
  const borderColor = rgb(0.85, 0.88, 0.92);

  // 1. Cabeçalho Superior
  page.drawRectangle({
    x: 0,
    y: height - 110,
    width,
    height: 110,
    color: primaryColor,
  });

  page.drawText('CASHVIBE MICROCRÉDITO', {
    x: 45,
    y: height - 50,
    size: 22,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Plataforma Financeira Integrada • WeHost Inc. Moçambique', {
    x: 45,
    y: height - 72,
    size: 9,
    font,
    color: rgb(0.8, 0.95, 0.88),
  });

  page.drawText('CONTRATO DE MÚTUO', {
    x: width - 200,
    y: height - 50,
    size: 13,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Nº: ${loan.id}`, {
    x: width - 200,
    y: height - 68,
    size: 10,
    font: boldFont,
    color: rgb(0.9, 0.98, 0.93),
  });

  page.drawText(`Data: ${loan.disbursementDate}`, {
    x: width - 200,
    y: height - 84,
    size: 9,
    font,
    color: rgb(0.8, 0.95, 0.88),
  });

  let currentY = height - 135;

  // 2. Caixa: Identificação das Partes
  page.drawRectangle({
    x: 45,
    y: currentY - 80,
    width: width - 90,
    height: 80,
    color: bgBox,
    borderColor,
    borderWidth: 1,
  });

  page.drawText('1. PARTES CONTRATANTES', {
    x: 55,
    y: currentY - 18,
    size: 10,
    font: boldFont,
    color: primaryColor,
  });

  page.drawText(`MUTUANTE: CASHVIBE MICROCRÉDITO (Representada pela Direção Administrativa)`, {
    x: 55,
    y: currentY - 35,
    size: 8.5,
    font,
    color: textColor,
  });

  page.drawText(`MUTUÁRIO: ${loan.clientName.toUpperCase()} | Contacto: ${loan.clientPhone}`, {
    x: 55,
    y: currentY - 50,
    size: 8.5,
    font: boldFont,
    color: textColor,
  });

  const docNumber = loan.clientDocumentNumber || client?.documentNumber || 'N/A';
  const address = client?.address?.neighborhood || client?.address?.city || 'Maputo';
  page.drawText(`Documento: ${docNumber} | Endereço/Bairro: ${address} | Ocupação: ${client?.occupation || 'Comerciante'}`, {
    x: 55,
    y: currentY - 65,
    size: 8,
    font,
    color: mutedText,
  });

  currentY -= 95;

  // 3. Caixa: Condições Financeiras
  page.drawRectangle({
    x: 45,
    y: currentY - 95,
    width: width - 90,
    height: 95,
    color: bgBox,
    borderColor,
    borderWidth: 1,
  });

  page.drawText('2. CONDIÇÕES FINANCEIRAS & OBJETO DO CRÉDITO', {
    x: 55,
    y: currentY - 18,
    size: 10,
    font: boldFont,
    color: primaryColor,
  });

  // Linha 1 de dados financeiros
  page.drawText(`Capital Concedido:`, { x: 55, y: currentY - 38, size: 8.5, font, color: mutedText });
  page.drawText(`${loan.principalAmount.toLocaleString('pt-MZ')} MT`, { x: 160, y: currentY - 38, size: 9.5, font: boldFont, color: textColor });

  page.drawText(`Taxa de Juros:`, { x: 280, y: currentY - 38, size: 8.5, font, color: mutedText });
  page.drawText(`${loan.interestRate}% (+${loan.interestAmount.toLocaleString('pt-MZ')} MT)`, { x: 380, y: currentY - 38, size: 9.5, font: boldFont, color: primaryColor });

  // Linha 2
  page.drawText(`Total a Reembolsar:`, { x: 55, y: currentY - 55, size: 8.5, font, color: mutedText });
  page.drawText(`${loan.totalAmount.toLocaleString('pt-MZ')} MT`, { x: 160, y: currentY - 55, size: 10, font: boldFont, color: primaryColor });

  page.drawText(`Modalidade:`, { x: 280, y: currentY - 55, size: 8.5, font, color: mutedText });
  page.drawText(`${loan.installmentsCount} Parcela(s) de ${Math.round(loan.totalAmount / loan.installmentsCount).toLocaleString('pt-MZ')} MT`, { x: 380, y: currentY - 55, size: 8.5, font: boldFont, color: textColor });

  // Linha 3
  page.drawText(`Data de Vencimento Final:`, { x: 55, y: currentY - 72, size: 8.5, font, color: mutedText });
  page.drawText(`${loan.finalDueDate}`, { x: 180, y: currentY - 72, size: 8.5, font: boldFont, color: textColor });

  page.drawText(`Penalidade de Mora:`, { x: 280, y: currentY - 72, size: 8.5, font, color: mutedText });
  page.drawText(`${loan.lateFeeDaily || 50} MT por cada dia de atraso`, { x: 380, y: currentY - 72, size: 8, font: boldFont, color: rgb(0.8, 0.2, 0.2) });

  page.drawText(`Garantia / Penhor Vinculado: ${loan.collateral || client?.collateralDescription || 'Declarada sob termo de compromisso'}`, {
    x: 55,
    y: currentY - 88,
    size: 7.5,
    font,
    color: mutedText,
  });

  currentY -= 110;

  // 4. Plano de Parcelas
  page.drawText('3. CRONOGRAMA DE AMORTIZAÇÕES', {
    x: 45,
    y: currentY,
    size: 9.5,
    font: boldFont,
    color: darkSlate,
  });
  currentY -= 15;

  // Cabeçalho da Tabela
  page.drawRectangle({
    x: 45,
    y: currentY - 16,
    width: width - 90,
    height: 16,
    color: rgb(0.9, 0.93, 0.95),
  });

  page.drawText('PARCELA', { x: 55, y: currentY - 12, size: 7.5, font: boldFont, color: darkSlate });
  page.drawText('DATA VENCIMENTO', { x: 150, y: currentY - 12, size: 7.5, font: boldFont, color: darkSlate });
  page.drawText('VALOR PREVISTO', { x: 290, y: currentY - 12, size: 7.5, font: boldFont, color: darkSlate });
  page.drawText('ESTADO ATUAL', { x: 420, y: currentY - 12, size: 7.5, font: boldFont, color: darkSlate });

  currentY -= 20;

  (loan.installments || []).slice(0, 6).forEach((inst: any) => {
    page.drawText(`Parcela #${inst.number}`, { x: 55, y: currentY, size: 8, font, color: textColor });
    page.drawText(`${inst.dueDate}`, { x: 150, y: currentY, size: 8, font, color: textColor });
    page.drawText(`${inst.amount.toLocaleString('pt-MZ')} MT`, { x: 290, y: currentY, size: 8, font: boldFont, color: textColor });
    const statusLabel = inst.status === 'paid' ? 'LIQUIDADA' : inst.status === 'overdue' ? 'EM ATRASO' : 'PENDENTE';
    page.drawText(statusLabel, { x: 420, y: currentY, size: 8, font: boldFont, color: inst.status === 'paid' ? primaryColor : textColor });
    currentY -= 15;
  });

  currentY -= 10;

  // 5. Cláusulas e Termo de Compromisso
  page.drawText('4. CLÁUSULAS CONTRATUAIS & DISPOSIÇÕES GERAIS', {
    x: 45,
    y: currentY,
    size: 9,
    font: boldFont,
    color: darkSlate,
  });
  currentY -= 14;

  const clauses = [
    'a) O MUTUÁRIO confirma o recebimento integral do capital solicitado e assume o compromisso irrevogável de reembolso.',
    'b) Os pagamentos deverão ser efetuados via M-Pesa, e-Mola ou transferência bancária para as contas oficiais da Cashvibe.',
    `c) Em caso de atraso injustificado, incorrerá multa de ${loan.lateFeeDaily || 50} MT/dia e execução extrajudicial da garantia declarada.`,
    'd) O presente contrato possui força executiva civil e comercial nos termos da legislação em vigor na República de Moçambique.',
  ];

  clauses.forEach((c) => {
    page.drawText(c, { x: 45, y: currentY, size: 7.2, font, color: mutedText });
    currentY -= 11;
  });

  currentY -= 40;

  // 6. Linhas de Assinatura
  page.drawLine({
    start: { x: 55, y: currentY },
    end: { x: 240, y: currentY },
    thickness: 1,
    color: darkSlate,
  });

  page.drawText('O MUTUÁRIO', { x: 110, y: currentY - 12, size: 8, font: boldFont, color: darkSlate });
  page.drawText(`${loan.clientName}`, { x: 80, y: currentY - 24, size: 7.5, font, color: mutedText });

  page.drawLine({
    start: { x: 340, y: currentY },
    end: { x: 525, y: currentY },
    thickness: 1,
    color: darkSlate,
  });

  page.drawText('PELA CASHVIBE MICROCRÉDITO', { x: 360, y: currentY - 12, size: 8, font: boldFont, color: darkSlate });
  page.drawText('Carimbo & Direção de Operações', { x: 375, y: currentY - 24, size: 7.5, font, color: mutedText });

  // 7. Rodapé
  page.drawText('Documento processado por computador via Cashvibe Cloud Platform • WeHost Inc.', {
    x: 140,
    y: 20,
    size: 7,
    font,
    color: mutedText,
  });

  return await pdfDoc.save();
}

export async function generatePaymentReceiptPdf(payment: any, loan?: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 420]); // Meio A4 (Recibo Horizontal)
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const primaryColor = rgb(0.06, 0.45, 0.32); // Emerald
  const darkSlate = rgb(0.08, 0.12, 0.18);
  const textColor = rgb(0.15, 0.15, 0.15);
  const mutedText = rgb(0.45, 0.48, 0.52);

  // Topo Verde
  page.drawRectangle({
    x: 0,
    y: height - 65,
    width,
    height: 65,
    color: primaryColor,
  });

  page.drawText('CASHVIBE MICROCRÉDITO', {
    x: 40,
    y: height - 38,
    size: 18,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('RECIBO OFICIAL DE QUITAÇÃO & AMORTIZAÇÃO', {
    x: 40,
    y: height - 52,
    size: 8,
    font,
    color: rgb(0.85, 0.98, 0.9),
  });

  page.drawText(`Nº RECIBO:`, {
    x: width - 180,
    y: height - 34,
    size: 8,
    font,
    color: rgb(0.85, 0.98, 0.9),
  });

  page.drawText(`${payment.receiptNumber}`, {
    x: width - 180,
    y: height - 48,
    size: 11,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  let currentY = height - 90;

  // Caixa de Conteúdo
  page.drawRectangle({
    x: 40,
    y: 70,
    width: width - 80,
    height: currentY - 70,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.88, 0.9, 0.93),
    borderWidth: 1,
  });

  page.drawText(`RECEBEMOS DE:`, { x: 55, y: currentY - 20, size: 8, font, color: mutedText });
  page.drawText(`${payment.clientName.toUpperCase()}`, { x: 160, y: currentY - 20, size: 10, font: boldFont, color: textColor });

  page.drawText(`EMPRÉSTIMO REF:`, { x: 55, y: currentY - 40, size: 8, font, color: mutedText });
  page.drawText(`${payment.loanId} ${payment.installmentNumber ? `(Parcela #${payment.installmentNumber})` : ''}`, { x: 160, y: currentY - 40, size: 9, font: boldFont, color: primaryColor });

  page.drawText(`VALOR LIQUIDADO:`, { x: 55, y: currentY - 65, size: 8, font, color: mutedText });
  page.drawText(`${Number(payment.amount).toLocaleString('pt-MZ')} MT`, { x: 160, y: currentY - 65, size: 16, font: boldFont, color: primaryColor });

  page.drawText(`MEIO DE PAGAMENTO:`, { x: 55, y: currentY - 90, size: 8, font, color: mutedText });
  page.drawText(`${payment.paymentMethod.toUpperCase()} ${payment.transactionReference ? `(Ref: ${payment.transactionReference})` : ''}`, { x: 160, y: currentY - 90, size: 8.5, font, color: textColor });

  page.drawText(`DATA DA OPERAÇÃO:`, { x: 55, y: currentY - 110, size: 8, font, color: mutedText });
  page.drawText(`${payment.paymentDate}`, { x: 160, y: currentY - 110, size: 8.5, font, color: textColor });

  if (loan) {
    page.drawText(`SALDO REMANESCENTE:`, { x: 55, y: currentY - 130, size: 8, font, color: mutedText });
    page.drawText(`${Number(loan.totalRemaining).toLocaleString('pt-MZ')} MT`, { x: 180, y: currentY - 130, size: 9, font: boldFont, color: darkSlate });
  }

  // Carimbo Digital
  page.drawRectangle({
    x: width - 210,
    y: 95,
    width: 140,
    height: 70,
    borderColor: primaryColor,
    borderWidth: 1.5,
    color: rgb(0.95, 0.99, 0.96),
  });

  page.drawText('CASHVIBE', { x: width - 180, y: 145, size: 10, font: boldFont, color: primaryColor });
  page.drawText('AUTENTICAÇÃO DIGITAL', { x: width - 195, y: 130, size: 6.5, font, color: primaryColor });
  page.drawText('PAGAMENTO CONFIRMADO', { x: width - 200, y: 115, size: 6.5, font: boldFont, color: primaryColor });
  page.drawText(`OP: ${payment.receivedBy || 'Admin'}`, { x: width - 185, y: 102, size: 6, font, color: mutedText });

  // Rodapé
  page.drawText('Obrigado pela preferência e pontualidade! Cashvibe Microcrédito • WeHost Inc.', {
    x: 130,
    y: 25,
    size: 7,
    font,
    color: mutedText,
  });

  return await pdfDoc.save();
}
