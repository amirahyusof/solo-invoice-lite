
/**
 * @param {number} amount
 * @param {string} [currency='MYR']
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'MYR') {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  /** @type {Intl.DateTimeFormatOptions} */
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString(undefined, options);
}