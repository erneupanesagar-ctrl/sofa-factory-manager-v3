// Utility functions for Sofa Factory Manager
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format currency in NPR
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return 'NPR 0';
  return `NPR ${Number(amount).toLocaleString('en-NP')}`;
}

// Format date
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format datetime
export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Generate unique ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (Nepal format)
export function isValidPhone(phone) {
  const phoneRegex = /^(\+977)?[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Calculate percentage
export function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return (value / total) * 100;
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Deep clone object
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Check if object is empty
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

// Capitalize first letter
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate WhatsApp message URL
export function generateWhatsAppURL(phoneNumber, message) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

// Generate email URL
export function generateEmailURL(email, subject, body) {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
}

// File size formatter
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// --- File Upload Utilities ---

// Simulates a file upload to a storage service and returns a URL
export async function uploadFile(file) {
  // In a real application, this would send the file to a server (e.g., S3, Cloudinary)
  // For this local-first PWA, we'll simulate the upload and return a unique URL
  // that can be used to display the image (e.g., by storing the Base64 data)
  
  // For now, we'll just return a placeholder URL for demonstration
  const uniqueId = generateId();
  const fileExtension = file.name.split('.').pop();
  
  // IMPORTANT: For a real PWA, the image data would need to be stored in a separate IndexedDB store
  // or the Base64 string would be stored directly in the order record.
  // For this phase, we will store a placeholder URL that includes the file name.
  return `local-storage://orders/${uniqueId}.${fileExtension}`;
}

// Convert file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Download file
export function downloadFile(data, filename, type = 'application/json') {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Generate sync file for WhatsApp sharing
export function generateSyncFile(data, date) {
  const syncData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    date: date,
    data: data
  };
  
  const filename = `sofa-factory-sync-${date}.json`;
  const content = JSON.stringify(syncData, null, 2);
  
  return { filename, content };
}

// Parse sync file
export function parseSyncFile(fileContent) {
  try {
    const syncData = JSON.parse(fileContent);
    if (!syncData.version || !syncData.data) {
      throw new Error('Invalid sync file format');
    }
    return syncData;
  } catch (error) {
    throw new Error('Failed to parse sync file: ' + error.message);
  }
}

// Get month name
export function getMonthName(monthNumber) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || '';
}

// Get payment status color
export function getPaymentStatusColor(status) {
  switch (status) {
    case 'paid':
      return 'text-green-600 bg-green-100';
    case 'unpaid':
      return 'text-red-600 bg-red-100';
    case 'partially_paid':
      return 'text-yellow-600 bg-yellow-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Order Statuses
export const OrderStatuses = {
  PENDING_APPROVAL: { value: 'pending_approval', label: 'Pending Approval', color: 'orange' },
  QUEUED: { value: 'queued_for_production', label: 'Queued for Production', color: 'yellow' },
  IN_CONSTRUCTION: { value: 'in_construction', label: 'In Construction', color: 'blue' },
  PENDING_INSPECTION: { value: 'pending_final_inspection', label: 'Pending Final Inspection', color: 'purple' },
  COMPLETED: { value: 'completed', label: 'Completed', color: 'green' },
};

// Get order status color
export function getOrderStatusColor(status) {
  switch (status) {
    case OrderStatuses.COMPLETED.value:
      return 'text-green-600 bg-green-100';
    case OrderStatuses.PENDING_APPROVAL.value:
      return 'text-orange-600 bg-orange-100';
    case OrderStatuses.QUEUED.value:
      return 'text-yellow-600 bg-yellow-100';
    case OrderStatuses.IN_CONSTRUCTION.value:
      return 'text-blue-600 bg-blue-100';
    case OrderStatuses.PENDING_INSPECTION.value:
      return 'text-purple-600 bg-purple-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Get sale status color
export function getSaleStatusColor(status) {
  switch (status) {
    case 'complete':
      return 'text-green-600 bg-green-100';
    case 'pending_approval':
      return 'text-orange-600 bg-orange-100';
    case 'cancelled':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Get stock status color
export function getStockStatusColor(current, threshold) {
  if (current <= 0) return 'text-red-600 bg-red-100';
  if (current <= threshold) return 'text-yellow-600 bg-yellow-100';
  return 'text-green-600 bg-green-100';
}

// Calculate days until due
export function getDaysUntilDue(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Check if date is overdue
export function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

// Generate notification message templates
export const NotificationTemplates = {
  // Supplier payment confirmation
  supplierPayment: (companyInfo, supplierName, items, amount, balance, receiptAttached) => {
    return `*${companyInfo.name}*
${companyInfo.address}

Dear ${supplierName},

This is a confirmation for our recent transaction.

*Items Received:*
${items.map(item => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n')}

*Financials:*
- Amount Paid Today: ${formatCurrency(amount)}
- Remaining Balance: ${formatCurrency(balance)}

${receiptAttached ? 'A copy of the payment receipt is attached.' : ''}

Thank you!

*${companyInfo.name}*
${companyInfo.phone}`;
  },

  // Customer payment reminder
  customerPaymentReminder: (companyInfo, customerName, amount, dueDate) => {
    return `*${companyInfo.name}*

Hi ${customerName},

This is a friendly reminder that your payment of ${formatCurrency(amount)} is due on ${formatDate(dueDate)}.

Thank you for your business!

*${companyInfo.name}*
${companyInfo.address}
${companyInfo.phone}`;
  },

  // Cleaning service reminder
  cleaningReminder: (companyInfo, customerName, date, time) => {
    return `*${companyInfo.name}*

Hi ${customerName},

This is a friendly reminder from *${companyInfo.name}* about your sofa cleaning appointment tomorrow at ${time}.

We look forward to serving you!

Sincerely,
*The Team at ${companyInfo.name}*
${companyInfo.address}
${companyInfo.phone}`;
  },

  // Account settlement statement
  accountSettlement: (companyInfo, entityName, payableAmount, receivableAmount, netBalance, isCustomerOwing) => {
    return `*${companyInfo.name}*
${companyInfo.address}

*Subject: Statement of Account Settlement*

Dear ${entityName},

This is a confirmation from *${companyInfo.name}* that we have settled our mutual accounts.

*Summary:*
- Amount you were owed: ${formatCurrency(payableAmount)}
- Amount you owed us: ${formatCurrency(receivableAmount)}

*Settlement:*
- The ${formatCurrency(payableAmount)} you were owed has been settled against the ${formatCurrency(receivableAmount)} you owed us.

*FINAL RESULT:*
${netBalance === 0 
  ? '- Account settled. Balance is 0.' 
  : isCustomerOwing 
    ? `- Your new remaining balance due to us is ${formatCurrency(Math.abs(netBalance))}.`
    : `- Our new remaining balance due to you is ${formatCurrency(Math.abs(netBalance))}.`
}

Thank you.

*${companyInfo.name}*
${companyInfo.phone}`;
  },

  // Order Status Notifications
  orderStatus: (companyInfo, customerName, orderId, newStatus) => {
    let messageBody = '';
    switch (newStatus) {
      case OrderStatuses.PENDING_APPROVAL.value:
        messageBody = `Your order #${orderId} has been received and is awaiting final approval. We will notify you when it is queued for production.`;
        break;
      case OrderStatuses.QUEUED.value:
        messageBody = `Great news, ${customerName}! Your order #${orderId} has been approved and is now queued for production. We will begin construction soon.`;
        break;
      case OrderStatuses.IN_CONSTRUCTION.value:
        messageBody = `Production has started! Your order #${orderId} is now in construction. We are working hard to craft your items.`;
        break;
      case OrderStatuses.PENDING_INSPECTION.value:
        messageBody = `Your order #${orderId} is complete and is now undergoing final quality inspection. We will notify you when it is ready for delivery.`;
        break;
      case OrderStatuses.COMPLETED.value:
        messageBody = `Congratulations, ${customerName}! Your order #${orderId} is complete and ready for delivery/pickup. Please contact us to arrange the final steps.`;
        break;
      default:
        messageBody = `The status of your order #${orderId} has been updated to "${newStatus}".`;
    }

    return `*${companyInfo.name}*

Hi ${customerName},

${messageBody}

Thank you for your business!

*${companyInfo.name}*
${companyInfo.phone}`;
  },

  // Monthly labour report
  monthlyLabourReport: (companyInfo, month, year, totalPayroll) => {
    return `*${companyInfo.name}*

The Monthly Labour Report for ${getMonthName(month)} ${year} is ready.

Total payroll for the month: ${formatCurrency(totalPayroll)}

Please review the detailed report in the app.

*${companyInfo.name}*`;
  }
};
