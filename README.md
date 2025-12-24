# InvoiceMate - Solo Invoice Lite

A modern, lightweight invoicing application built with React and Vite. InvoiceMate helps freelancers and small business owners manage invoices, clients, and payments efficiently with a beautiful, intuitive interface.

## Features

### 📊 Dashboard
- Real-time overview of your business metrics
- Total revenue tracking (paid invoices)
- Pending payment amounts at a glance
- Quick statistics: paid invoices count, draft invoices count
- Recent activity timeline
- Quick access to create new invoices
- Personalized welcome with your business name

### 📄 Invoice Management
- **Create & Edit Invoices**: Draft invoices with auto-save functionality
- **Invoice Details Page**: View complete invoice information with:
  - Professional PDF generation
  - Invoice status tracking (draft, sent, paid, overdue)
  - Share via WhatsApp and Email
  - Mark invoices as paid
  - Download as PDF
  - Edit and delete options
- **Invoice Listing**: 
  - Search invoices by invoice number or client name
  - Filter by status (draft, sent, paid, overdue)
  - Delete invoices (with associated items)
  - Quick actions menu

### 👥 Client Management
- **Add/Edit Clients**: Manage client information including:
  - Full name and company
  - Email and phone number
  - Physical address
- **Client Directory**: 
  - Search clients by name or company
  - Edit and delete client records
  - Beautiful card-based layout
  - Quick contact information display

### 🧾 Receipt Management
- **Payment Records**: Track payments received
- **Receipt Details**: 
  - Receipt number and date
  - Payment method
  - Amount paid
  - Payment reference to invoice
  - Signature and notes

### ⚙️ Business Settings
- **Company Profile**: Set up your business information:
  - Business name and SSM number
  - Address and contact details
  - Email and phone
- **Banking Information**:
  - Bank name and account details
  - Account holder name
- **Branding**:
  - Upload company logo (appears on invoices and receipts)
  - Currency preference for formatting

### 📑 Data Management
- **Local Storage**: All data stored locally using Dexie (IndexedDB)
- **Auto-Save**: Invoices auto-save while editing
- **Atomic Operations**: Database transactions ensure data integrity
- **No Server Required**: Works completely offline

## Technology Stack

- **Frontend**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Styling**: Tailwind CSS
- **Database**: Dexie (IndexedDB wrapper)
- **PDF Generation**: jsPDF with AutoTable
- **Icons**: Lucide React
- **Routing**: React Router
- **State Management**: Dexie Live Query Hooks

## Project Structure

```
src/
├── pages/
│   ├── Dashboard.jsx          # Main dashboard with metrics
│   ├── Invoices.jsx           # Invoice list and management
│   ├── InvoiceForm.jsx        # Create and edit invoices
│   ├── InvoiceDetail.jsx      # View and manage single invoice
│   ├── Clients.jsx            # Client management
│   ├── Settings.jsx           # Business configuration
│   └── ReceiptDetails.jsx     # Receipt viewing
├── services/
│   └── pdfService.js          # PDF generation utilities
├── utils/
│   └── formatter.js           # Currency and date formatting
├── App.jsx                    # Main app component with routing
├── db.js                      # Database schema and initialization
├── types.js                   # Type definitions (JSDoc)
└── main.jsx                   # Application entry point
```

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The app uses Vite's HMR (Hot Module Replacement) for fast refresh during development. All changes are reflected immediately in the browser.

## Database Schema

- **BusinessSettings**: Company profile, banking info, and branding
- **Clients**: Client contact information
- **Invoices**: Invoice records with metadata
- **InvoiceItems**: Line items for each invoice
- **Receipts**: Payment records
- **Counters**: Auto-incrementing counters for invoice/receipt numbers

## JavaScript Type System

This project uses JSDoc comments for type documentation instead of TypeScript, providing type hints while remaining pure JavaScript for maximum simplicity and flexibility.

## Features in Detail

### Invoice Workflow
1. Create a new invoice with client selection
2. Add line items with descriptions, quantities, and prices
3. Set due dates and add notes
4. Auto-save as draft
5. Review and send invoice
6. Track payment status
7. Generate PDF for sharing
8. Mark as paid and create receipt

### PDF Generation
- Professional invoice layout with your company logo
- Client and billing information
- Itemized line items with totals
- Payment details and banking information
- Receipt PDF generation for payment records

### Smart Filtering & Search
- Search invoices by number or client
- Filter by payment status
- Search clients by name or company
- Real-time filtering updates

## Browser Support

Works on all modern browsers supporting:
- ES6 JavaScript
- IndexedDB
- HTML5

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.
