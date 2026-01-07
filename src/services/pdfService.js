import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from '../utils/formatter';

/**
 * Convert number to words in English
 * @param {number} num
 * @returns {string}
 */
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertHundreds = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  };

  if (num === 0) return 'Zero';
  
  const parts = [];
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;

  if (thousands > 0) {
    parts.push(convertHundreds(thousands) + ' Thousand');
  }
  if (remainder > 0) {
    parts.push(convertHundreds(remainder));
  }

  return parts.join(' ').trim();
}

/**
 * Add a watermark to the PDF for paid invoices
 * @param {any} doc - jsPDF document
 * @param {string} text - Watermark text
 * @param {Date} paidDate - Date when payment was received
 */
function addPaidWatermark(doc, text, paidDate) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Add diagonal PAID watermark with light green color
  doc.setTextColor(200, 230, 201); // Light green color
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(80);

  // Rotate and position the watermark diagonally
  doc.text(text, pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: -45,
    baseline: 'middle'
  });
}

/**
 * @param {Invoice} invoice
 * @param {Client} client
 * @param {InvoiceItem[]} items
 * @param {BusinessSettings} settings
 * @param {Receipt} [receipt] - Optional receipt for paid invoices
 * @returns {Promise<void>}
 */
export async function generateInvoicePDF(
  invoice,
  client,
  items,
  settings,
  receipt
) {
  /** @type {any} */
  const doc = new jsPDF();
  const currency = settings.currency || 'MYR';

  // Header Colors
  doc.setFillColor(63, 79, 68); // mate-forest
  doc.rect(0, 0, 210, 40, 'F');

  let textStartX = 20;
  if (settings.logo) {
    try {
      doc.addImage(settings.logo, 'PNG', 20, 5, 25, 25);
      textStartX = 50;
    } catch (e) {
      console.error("Failed to add logo to PDF", e);
    }
  }

  // Business Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.businessName, textStartX, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.ssmNo ? `SSM: ${settings.ssmNo}` : '', textStartX, 29);

  // Invoice Label
  doc.setFontSize(28);
  doc.text('INVOICE', 140, 25);

  // Business Info Details
  doc.setTextColor(44, 57, 48); // mate-dark
  doc.setFontSize(10);
  doc.text('FROM:', 20, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.businessName, 20, 60);
  doc.setFont('helvetica', 'normal');
  const addressLines = doc.splitTextToSize(settings.address, 70);
  doc.text(addressLines, 20, 65);
  const nextY = 65 + (addressLines.length * 5);
  doc.text(settings.email, 20, nextY);
  doc.text(settings.phone, 20, nextY + 5);

  // Client Info Details
  doc.text('BILL TO:', 120, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(client.name, 120, 60);
  doc.setFont('helvetica', 'normal');
  if (client.company) doc.text(client.company, 120, 65);
  const clientAddrLines = doc.splitTextToSize(client.address || '', 70);
  doc.text(clientAddrLines, 120, client.company ? 70 : 65);

  // Invoice Summary Table Info
  autoTable(doc, {
    startY: 100,
    head: [['Invoice Number', 'Issue Date', 'Due Date']],
    body: [[invoice.invoiceNo, formatDate(invoice.issueDate), formatDate(invoice.dueDate)]],
    theme: 'grid',
    headStyles: { fillColor: [162, 123, 92] }, // mate-brown
  });

  // Items Table
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: items.map(item => [
      item.description,
      item.quantity,
      formatCurrency(item.unitPrice, currency),
      formatCurrency(item.total, currency)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [44, 57, 48] }, // mate-dark
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    }
  });

  const finalY = doc.lastAutoTable.finalY;

  // Totals
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount Due:', 165, finalY + 15);
  doc.setFontSize(16);
  doc.text(formatCurrency(invoice.total, currency), 165, finalY + 25);

  let currentY = finalY + 35;

  // Add extra space before notes
  currentY += 60;

  // Add receipt date on the left with black text in brackets (for paid invoices)
  if (invoice.status === 'paid' && receipt) {
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`[Diterima pada ${formatDate(new Date(receipt.paidDate))}]`, 20, currentY);
    currentY += 5;
  }


  if (invoice.notes) {
    doc.setFont('helvetica', 'italic');
    doc.text('Notes:', 20, currentY);
    const noteLines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(noteLines, 20, currentY + 5);
  }

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for your business!', 105, 285, { align: 'center' });

  // Add watermark if invoice is paid
  if (invoice.status === 'paid' && receipt) {
    addPaidWatermark(doc, 'PAID', new Date(receipt.paidDate));
  }

  doc.save(`${invoice.invoiceNo}.pdf`);
}

/**
 * @param {Receipt} receipt
 * @param {Invoice} invoice
 * @param {Client} client
 * @param {BusinessSettings} settings
 * @returns {Promise<void>}
 */
export async function generateReceiptPDF(
  receipt,
  invoice,
  client,
  settings
) {
  /** @type {any} */
  const doc = new jsPDF();
  const currency = settings.currency || 'MYR';

  // ===== HEADER SECTION =====
  // Brown header background
  doc.setFillColor(162, 123, 92); // mate-brown
  doc.rect(0, 0, 210, 50, 'F');

  // Logo and business name in header
  let logoX = 15;
  if (settings.logo) {
    try {
      doc.addImage(settings.logo, 'PNG', 15, 5, 20, 20);
      logoX = 40;
    } catch (e) {
      console.error("Failed to add logo to receipt PDF", e);
    }
  }

  // Business details in white text in header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.businessName, logoX, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const addressLines = doc.splitTextToSize(settings.address, 100);
  doc.text(addressLines, logoX, 24);

  doc.setFontSize(8);
  doc.text(`Tel: ${settings.phone} | Email: ${settings.email}`, logoX, 40);

  // Right side - OFFICIAL RECEIPT title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL RECEIPT', 165, 25, { align: 'right' });

  // ===== RECEIPT INFO SECTION =====
  doc.setTextColor(44, 57, 48); // Dark color
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const infoY = 62;
  doc.text(`Receipt No: ${receipt.receiptNo}`, 20, infoY);
  doc.text(`Date Paid: ${formatDate(receipt.paidDate)}`, 120, infoY);

  doc.text(`Invoice Ref: ${invoice.invoiceNo}`, 20, infoY + 8);

  // ===== RECEIVED FROM SECTION =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RECEIVED FROM:', 20, infoY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let receivedFromY = infoY + 27;
  doc.text(client.name, 20, receivedFromY);

  if (client.company) {
    doc.text(client.company, 20, receivedFromY + 5);
    receivedFromY += 5;
  }

  if (client.address) {
    const clientAddrLines = doc.splitTextToSize(client.address, 90);
    doc.setFontSize(8);
    doc.text(clientAddrLines, 20, receivedFromY + 5);
  }

  // ===== AMOUNT BOX =====
  const amountBoxY = 115;
  doc.setFillColor(220, 215, 201); // mate-cream
  doc.rect(20, amountBoxY, 170, 45, 'F');

  doc.setTextColor(44, 57, 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Amount Received:', 30, amountBoxY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text(formatCurrency(receipt.amountPaid, currency), 30, amountBoxY + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const amountInWords = numberToWords(Math.floor(receipt.amountPaid));
  doc.text(`(${amountInWords} Ringgit Only)`, 30, amountBoxY + 38);

  // ===== PAYMENT DETAILS =====
  const detailsY = amountBoxY + 50;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`For Invoice: ${invoice.invoiceNo}`, 20, detailsY);
  doc.text(`Payment Method: ${receipt.paymentMethod}`, 20, detailsY + 7);

  // ===== NOTES SECTION =====
  if (receipt.notes) {
    const notesY = detailsY + 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Remarks:', 20, notesY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const noteLines = doc.splitTextToSize(receipt.notes, 170);
    doc.text(noteLines, 20, notesY + 6);
  }

  // ===== SIGNATURE SECTION =====
  const sigY = 240;
  doc.setLineWidth(0.5);
  doc.line(130, sigY, 180, sigY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Authorized Signature', 155, sigY + 8, { align: 'center' });
  doc.text(settings.businessName, 155, sigY + 15, { align: 'center' });

  // ===== FOOTER =====
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for your business. Please keep this receipt for your records.', 105, 285, { align: 'center' });

  doc.save(`${receipt.receiptNo}.pdf`);
}
