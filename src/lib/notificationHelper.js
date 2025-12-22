// WhatsApp Notification Helper Functions

/**
 * Format phone number to international format (Nepal)
 * @param {string} phone - Phone number (e.g., "9800000000")
 * @param {string} countryCode - Country code (default: "977" for Nepal)
 * @returns {string} - Formatted phone number (e.g., "9779800000000")
 */
export function formatPhoneNumber(phone, countryCode = '977') {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If already has country code, return as is
  if (cleaned.startsWith(countryCode)) {
    return cleaned;
  }
  
  // Add country code
  return countryCode + cleaned;
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export function validatePhoneNumber(phone) {
  if (!phone) return false;
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Nepal phone numbers are 10 digits (without country code)
  // With country code (977): 13 digits total
  return cleaned.length === 10 || cleaned.length === 13;
}

/**
 * Generate WhatsApp URL with pre-filled message
 * @param {string} phone - Phone number in international format
 * @param {string} message - Message text
 * @returns {string} - WhatsApp URL
 */
export function generateWhatsAppUrl(phone, message) {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Format message template with variables
 * @param {string} template - Message template with {variables}
 * @param {object} variables - Object with variable values
 * @returns {string} - Formatted message
 */
export function formatMessageTemplate(template, variables) {
  let message = template;
  
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    message = message.replace(regex, variables[key] || '');
  });
  
  return message;
}

/**
 * Default message templates
 */
export const DEFAULT_TEMPLATES = {
  orderConfirmation: {
    title: 'Order Confirmation',
    template: `Hello {customerName}! 🛋️

Your order has been confirmed:
Order #: {orderNumber}
Product: {productName}
Quantity: {quantity}
Total Amount: NPR {totalAmount}
Paid: NPR {paidAmount}
Due: NPR {dueAmount}

Expected Delivery: {expectedDelivery}

Thank you for choosing us!
- {companyName}`,
    variables: ['customerName', 'orderNumber', 'productName', 'quantity', 'totalAmount', 'paidAmount', 'dueAmount', 'expectedDelivery', 'companyName']
  },
  
  productionStarted: {
    title: 'Production Started',
    template: `Hello {customerName}! 🏭

Great news! Production has started for your order.
Order #: {orderNumber}
Product: {productName}

Expected Completion: {expectedCompletion}

We'll notify you when it's ready!
- {companyName}`,
    variables: ['customerName', 'orderNumber', 'productName', 'expectedCompletion', 'companyName']
  },
  
  productionCompleted: {
    title: 'Production Completed',
    template: `Hello {customerName}! ✅

Your sofa is ready!
Order #: {orderNumber}
Product: {productName}

Please contact us to schedule delivery.

Thank you for your patience!
- {companyName}`,
    variables: ['customerName', 'orderNumber', 'productName', 'companyName']
  },
  
  paymentReminder: {
    title: 'Payment Reminder',
    template: `Hello {customerName}! 💰

Payment reminder for your order:
Order #: {orderNumber}
Total Amount: NPR {totalAmount}
Paid: NPR {paidAmount}
Due: NPR {dueAmount}

Please make payment at your earliest convenience.

Thank you!
- {companyName}`,
    variables: ['customerName', 'orderNumber', 'totalAmount', 'paidAmount', 'dueAmount', 'companyName']
  },
  
  deliveryScheduled: {
    title: 'Delivery Scheduled',
    template: `Hello {customerName}! 🚚

Your delivery has been scheduled:
Order #: {orderNumber}
Product: {productName}
Delivery Date: {deliveryDate}
Address: {deliveryAddress}

Please be available on the scheduled date.
- {companyName}`,
    variables: ['customerName', 'orderNumber', 'productName', 'deliveryDate', 'deliveryAddress', 'companyName']
  },
  
  orderDelivered: {
    title: 'Order Delivered',
    template: `Hello {customerName}! 🎉

Your order has been delivered!
Order #: {orderNumber}
Product: {productName}

Thank you for your business. We hope you enjoy your new sofa!

Please let us know if you have any questions.
- {companyName}`,
    variables: ['customerName', 'orderNumber', 'productName', 'companyName']
  },
  
  purchaseOrderCreated: {
    title: 'Purchase Order Created',
    template: `Hello {supplierName}! 📦

New purchase order:
PO #: {poNumber}
Items: {itemCount}
Total Amount: NPR {totalAmount}

Please confirm receipt and delivery schedule.

Thank you!
- {companyName}`,
    variables: ['supplierName', 'poNumber', 'itemCount', 'totalAmount', 'companyName']
  },
  
  lowStockAlert: {
    title: 'Low Stock Alert',
    template: `⚠️ LOW STOCK ALERT

Item: {itemName}
Current Stock: {currentStock}
Minimum Stock: {minStock}

Action needed: Reorder soon!
- {companyName}`,
    variables: ['itemName', 'currentStock', 'minStock', 'companyName']
  }
};

/**
 * Get default notification settings
 */
export function getDefaultNotificationSettings() {
  return {
    id: 1,
    whatsappEnabled: true,
    defaultCountryCode: '977',
    companyName: 'Sofa Factory',
    adminPhoneNumber: '',
    notificationTypes: {
      orderConfirmation: true,
      productionStarted: true,
      productionCompleted: true,
      paymentReminder: true,
      deliveryScheduled: true,
      orderDelivered: true,
      purchaseOrderCreated: false,
      lowStockAlert: true
    },
    messageTemplates: DEFAULT_TEMPLATES
  };
}

/**
 * Create notification object
 * @param {string} type - Notification type
 * @param {object} recipient - Recipient info {name, phone}
 * @param {string} message - Formatted message
 * @param {object} related - Related entity {id, type}
 * @returns {object} - Notification object
 */
export function createNotification(type, recipient, message, related = {}) {
  return {
    type,
    recipient,
    message,
    status: 'pending',
    createdAt: new Date().toISOString(),
    sentAt: null,
    relatedId: related.id || null,
    relatedType: related.type || null
  };
}

/**
 * Open WhatsApp with message
 * @param {string} phone - Phone number
 * @param {string} message - Message text
 */
export function openWhatsApp(phone, message) {
  const url = generateWhatsAppUrl(phone, message);
  window.open(url, '_blank');
}
