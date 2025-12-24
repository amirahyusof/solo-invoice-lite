
import Dexie from 'dexie';

// FreelancerInvoiceDB extends Dexie to provide a strongly typed database schema.
// Using the default import for Dexie ensures proper class inheritance of core methods.
/**
 * @class FreelancerInvoiceDB
 */
export class FreelancerInvoiceDB extends Dexie {
  /**
   * @param {Table<BusinessSettings, number>} settings
   * @param {Table<Client, number>} clients
   * @param {Table<Invoice, number>} invoices
   * @param {Table<InvoiceItem, number>} invoice_items
   * @param {Table<Receipt, number>} receipts
   * @param {Table<Counter, string>} counters
   */
  constructor() {
    super('FreelancerInvoiceDB');
    /** @type {Table<BusinessSettings, number>} */
    this.settings;
    /** @type {Table<Client, number>} */
    this.clients;
    /** @type {Table<Invoice, number>} */
    this.invoices;
    /** @type {Table<InvoiceItem, number>} */
    this.invoice_items;
    /** @type {Table<Receipt, number>} */
    this.receipts;
    /** @type {Table<Counter, string>} */
    this.counters;
    // Define the database schema and versioning for Dexie
    this.version(1).stores({
      settings: 'id',
      clients: '++id, name, company, email',
      invoices: '++id, invoiceNo, clientId, status, issueDate, dueDate',
      invoice_items: '++id, invoiceId',
      receipts: '++id, receiptNo, invoiceId, paidDate',
      counters: 'name'
    });
  }
}

export const db = new FreelancerInvoiceDB();

// The 'ready' event is used for database initialization after the DB is opened
db.on('ready', async () => {
  const invoiceCounter = await db.counters.get('invoice');
  if (!invoiceCounter) {
    await db.counters.add({ name: 'invoice', value: 0 });
  }
  const receiptCounter = await db.counters.get('receipt');
  if (!receiptCounter) {
    await db.counters.add({ name: 'receipt', value: 0 });
  }
});