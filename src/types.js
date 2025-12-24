
/**
 * @typedef {Object} BusinessSettings
 * @property {number} id
 * @property {string} businessName
 * @property {string} [ssmNo]
 * @property {string} address
 * @property {string} email
 * @property {string} phone
 * @property {string} bankName
 * @property {string} bankAccountName
 * @property {string} bankAccountNo
 * @property {string} currency
 * @property {string} [logo] - Base64 encoded logo image
 */

/**
 * @typedef {Object} Client
 * @property {number} [id]
 * @property {string} name
 * @property {string} [company]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} [address]
 */

/**
 * @typedef {'draft' | 'sent' | 'paid' | 'overdue'} InvoiceStatus
 */

/**
 * @typedef {Object} Invoice
 * @property {number} [id]
 * @property {string} invoiceNo
 * @property {number} clientId
 * @property {string} issueDate
 * @property {string} dueDate
 * @property {InvoiceStatus} status
 * @property {string} [notes]
 * @property {number} subtotal
 * @property {number} total
 * @property {number} createdAt
 */

/**
 * @typedef {Object} InvoiceItem
 * @property {number} [id]
 * @property {number} invoiceId
 * @property {string} description
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} total
 */

/**
 * @typedef {Object} Receipt
 * @property {number} [id]
 * @property {string} receiptNo
 * @property {number} invoiceId
 * @property {string} paidDate
 * @property {string} paymentMethod
 * @property {number} amountPaid
 * @property {string} [notes]
 */

/**
 * @typedef {Object} Counter
 * @property {string} name
 * @property {number} value
 */