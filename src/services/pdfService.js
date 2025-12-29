import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from '../utils/formatter';

/**
 * @param {Invoice} invoice
 * @param {Client} client
 * @param {InvoiceItem[]} items
 * @param {BusinessSettings} settings
 * @returns {Promise<void>}
 */
export async function generateInvoicePDF(
  invoice,
  client,
  items,
  settings
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
  doc.text('Total Amount Due:', 120, finalY + 15);
  doc.setFontSize(16);
  doc.text(formatCurrency(invoice.total, currency), 120, finalY + 25);

  // Payment Instructions
  doc.setFontSize(10);
  doc.text('PAYMENT DETAILS', 20, finalY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bank: ${settings.bankName}`, 20, finalY + 22);
  doc.text(`Account Name: ${settings.bankAccountName}`, 20, finalY + 27);
  doc.text(`Account No: ${settings.bankAccountNo}`, 20, finalY + 32);

  if (invoice.notes) {
    doc.setFont('helvetica', 'italic');
    doc.text('Notes:', 20, finalY + 45);
    const noteLines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(noteLines, 20, finalY + 50);
  }

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for your business!', 105, 285, { align: 'center' });

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

  // Receipt Header
  doc.setFillColor(162, 123, 92); // mate-brown
  doc.rect(0, 0, 210, 40, 'F');

  let textStartX = 20;
  if (settings.logo) {
    try {
      doc.addImage(settings.logo, 'PNG', 20, 5, 25, 25);
      textStartX = 50;
    } catch (e) {
      console.error("Failed to add logo to receipt PDF", e);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.businessName, textStartX, 22);
  doc.setFontSize(24);
  doc.text('OFFICIAL RECEIPT', 110, 25);

  // Info
  doc.setTextColor(44, 57, 48);
  doc.setFontSize(12);
  doc.text(`Receipt No: ${receipt.receiptNo}`, 20, 60);
  doc.text(`Date Paid: ${formatDate(receipt.paidDate)}`, 20, 68);
  doc.text(`Reference Invoice: ${invoice.invoiceNo}`, 20, 76);

  doc.text('RECEIVED FROM:', 120, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(client.name, 120, 68);
  if (client.company) doc.text(client.company, 120, 74);

  // Main Amount Box
  doc.setFillColor(220, 215, 201); // mate-cream
  doc.rect(20, 90, 170, 40, 'F');
  doc.setTextColor(44, 57, 48);
  doc.setFontSize(14);
  doc.text('The amount of:', 30, 105);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(receipt.amountPaid, currency), 30, 120);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Being payment for: Invoice ${invoice.invoiceNo}`, 30, 145);
  doc.text(`Payment Method: ${receipt.paymentMethod}`, 30, 153);

  if (receipt.notes) {
    doc.setFont('helvetica', 'italic');
    doc.text('Notes:', 30, 165);
    doc.text(receipt.notes, 30, 172);
  }

  // Signature
  doc.line(130, 220, 190, 220);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signature', 140, 228);
  doc.text(settings.businessName, 140, 235);

  doc.save(`${receipt.receiptNo}.pdf`);
}
