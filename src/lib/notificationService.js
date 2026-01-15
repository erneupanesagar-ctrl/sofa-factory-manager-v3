// Notification Service - Handles creating and queueing notifications

import { formatMessageTemplate, createNotification } from './notificationHelper';
import { formatCurrency } from './utils';

/**
 * Get notification settings from database
 */
async function getNotificationSettings(actions) {
  try {
  const settings = await actions.getAll(\'notificationSettings\');   return settings && settings.length > 0 ? settings[0] : null;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return null;
  }
}

/**
 * Check if notification type is enabled
 */
async function isNotificationEnabled(actions, notificationType) {
  const settings = await getNotificationSettings(actions);
  if (!settings || !settings.whatsappEnabled) return false;
  return settings.notificationTypes[notificationType] === true;
}

/**
 * Queue a notification
 */
async function queueNotification(actions, notification) {
  try {
    await actions.addItem('notificationQueue', notification);
    console.log('Notification queued:', notification.type);
  } catch (error) {
    console.error('Error queueing notification:', error);
  }
}

/**
 * Send Order Confirmation notification
 */
export async function sendOrderConfirmation(actions, order, customer, product) {
  try {
    const enabled = await isNotificationEnabled(actions, 'orderConfirmation');
    if (!enabled) return;

    const settings = await getNotificationSettings(actions);
    if (!settings) return;

    const template = settings.messageTemplates.orderConfirmation?.template;
    if (!template) return;

    const variables = {
      customerName: customer.name || 'Customer',
      orderNumber: order.orderNumber || order.id,
      productName: product.name || 'Product',
      quantity: order.quantity || 1,
      totalAmount: formatCurrency(order.totalAmount || 0),
      paidAmount: formatCurrency(order.paidAmount || 0),
      dueAmount: formatCurrency((order.totalAmount || 0) - (order.paidAmount || 0)),
      expectedDelivery: order.expectedDeliveryDate 
        ? new Date(order.expectedDeliveryDate).toLocaleDateString()
        : 'To be confirmed',
      companyName: settings.companyName || 'Sofa Factory'
    };

    const message = formatMessageTemplate(template, variables);

    const notification = createNotification(
      'orderConfirmation',
      {
        name: customer.name,
        phone: customer.phone
      },
      message,
      {
        id: order.id,
        type: 'order'
      }
    );

    await queueNotification(actions, notification);
  } catch (error) {
    console.error('Error sending order confirmation:', error);
  }
}

/**
 * Send Production Started notification
 */
export async function sendProductionStarted(actions, production, order, customer) {
  try {
    const enabled = await isNotificationEnabled(actions, 'productionStarted');
    if (!enabled || !order || !customer) return;

    const settings = await getNotificationSettings(actions);
    if (!settings) return;

    const template = settings.messageTemplates.productionStarted?.template;
    if (!template) return;

    const variables = {
      customerName: customer.name || 'Customer',
      orderNumber: order.orderNumber || order.id,
      productName: production.productName || 'Product',
      expectedCompletion: production.expectedCompletionDate
        ? new Date(production.expectedCompletionDate).toLocaleDateString()
        : 'Soon',
      companyName: settings.companyName || 'Sofa Factory'
    };

    const message = formatMessageTemplate(template, variables);

    const notification = createNotification(
      'productionStarted',
      {
        name: customer.name,
        phone: customer.phone
      },
      message,
      {
        id: production.id,
        type: 'production'
      }
    );

    await queueNotification(actions, notification);
  } catch (error) {
    console.error('Error sending production started notification:', error);
  }
}

/**
 * Send Production Completed notification
 */
export async function sendProductionCompleted(actions, production, order, customer) {
  try {
    const enabled = await isNotificationEnabled(actions, 'productionCompleted');
    if (!enabled || !order || !customer) return;

    const settings = await getNotificationSettings(actions);
    if (!settings) return;

    const template = settings.messageTemplates.productionCompleted?.template;
    if (!template) return;

    const variables = {
      customerName: customer.name || 'Customer',
      orderNumber: order.orderNumber || order.id,
      productName: production.productName || 'Product',
      companyName: settings.companyName || 'Sofa Factory'
    };

    const message = formatMessageTemplate(template, variables);

    const notification = createNotification(
      'productionCompleted',
      {
        name: customer.name,
        phone: customer.phone
      },
      message,
      {
        id: production.id,
        type: 'production'
      }
    );

    await queueNotification(actions, notification);
  } catch (error) {
    console.error('Error sending production completed notification:', error);
  }
}

/**
 * Send Payment Reminder notification
 */
export async function sendPaymentReminder(actions, sale, customer, product) {
  try {
    const enabled = await isNotificationEnabled(actions, 'paymentReminder');
    if (!enabled) return;

    const settings = await getNotificationSettings(actions);
    if (!settings) return;

    const template = settings.messageTemplates.paymentReminder?.template;
    if (!template) return;

    const dueAmount = (sale.totalAmount || 0) - (sale.paidAmount || 0);
    if (dueAmount <= 0) return; // No payment due

    const variables = {
      customerName: customer.name || 'Customer',
      orderNumber: sale.saleNumber || sale.id,
      totalAmount: formatCurrency(sale.totalAmount || 0),
      paidAmount: formatCurrency(sale.paidAmount || 0),
      dueAmount: formatCurrency(dueAmount),
      paymentMessage: 'Please make payment at your earliest convenience.',
      companyName: settings.companyName || 'Sofa Factory'
    };

    const message = formatMessageTemplate(template, variables);

    const notification = createNotification(
      'paymentReminder',
      {
        name: customer.name,
        phone: customer.phone
      },
      message,
      {
        id: sale.id,
        type: 'sale'
      }
    );

    await queueNotification(actions, notification);
  } catch (error) {
    console.error('Error sending payment reminder:', error);
  }
}

/**
 * Send Delivery Scheduled notification
 */
export async function sendDeliveryScheduled(actions, order, customer, deliveryDate, deliveryAddress) {
  try {
    const enabled = await isNotificationEnabled(actions, 'deliveryScheduled');
    if (!enabled) return;

    const settings = await getNotificationSettings(actions);
    if (!settings) return;

    const template = settings.messageTemplates.deliveryScheduled?.template;
    if (!template) return;

    const variables = {
      customerName: customer.name || 'Customer',
      orderNumber: order.orderNumber || order.id,
      productName: order.productName || 'Product',
      deliveryDate: deliveryDate 
        ? new Date(deliveryDate).toLocaleDateString()
        : 'To be confirmed',
      deliveryAddress: deliveryAddress || customer.address || 'Your address',
      companyName: settings.companyName || 'Sofa Factory'
    };

    const message = formatMessageTemplate(template, variables);

    const notification = createNotification(
      'deliveryScheduled',
      {
        name: customer.name,
        phone: customer.phone
      },
      message,
      {
        id: order.id,
        type: 'order'
      }
    );

    await queueNotification(actions, notification);
  } catch (error) {
    console.error('Error sending delivery scheduled notification:', error);
  }
}

/**
 * Send Order Delivered notification
 */
export async function sendOrderDelivered(actions, order, customer) {
  try {
    const enabled = await isNotificationEnabled(actions, 'orderDelivered');
    if (!enabled) return;

    const settings = await getNotificationSettings(actions);
    if (!settings) return;

    const template = settings.messageTemplates.orderDelivered?.template;
    if (!template) return;

    const variables = {
      customerName: customer.name || 'Customer',
      orderNumber: order.orderNumber || order.id,
      productName: order.productName || 'Product',
      companyName: settings.companyName || 'Sofa Factory'
    };

    const message = formatMessageTemplate(template, variables);

    const notification = createNotification(
      'orderDelivered',
      {
        name: customer.name,
        phone: customer.phone
      },
      message,
      {
        id: order.id,
        type: 'order'
      }
    );

    await queueNotification(actions, notification);
  } catch (error) {
    console.error('Error sending order delivered notification:', error);
  }
}

/**
 * Send Purchase Order Created notification (to supplier)
 */
export async function sendPurchaseOrderCreated(actions, purchase, supplier) {
  try {
    const enabled = await isNotificationEnabled(actions, 'purchaseOrderCreated');
    if (!enabled) return;

    const settings = await getNotificationSettings(actions);
    if (!settings) return;

    const template = settings.messageTemplates.purchaseOrderCreated?.template;
    if (!template) return;

    const variables = {
      supplierName: supplier.name || 'Supplier',
      poNumber: purchase.purchaseNumber || purchase.id,
      itemCount: purchase.items?.length || 1,
      totalAmount: formatCurrency(purchase.totalAmount || 0),
      companyName: settings.companyName || 'Sofa Factory'
    };

    const message = formatMessageTemplate(template, variables);

    const notification = createNotification(
      'purchaseOrderCreated',
      {
        name: supplier.name,
        phone: supplier.phone
      },
      message,
      {
        id: purchase.id,
        type: 'purchase'
      }
    );

    await queueNotification(actions, notification);
  } catch (error) {
    console.error('Error sending purchase order notification:', error);
  }
}

/**
 * Send Low Stock Alert notification (to admin)
 */
export async function sendLowStockAlert(actions, item, currentStock, minStock) {
  try {
    const enabled = await isNotificationEnabled(actions, 'lowStockAlert');
    if (!enabled) return;

    const settings = await getNotificationSettings(actions);
    if (!settings || !settings.adminPhoneNumber) return;

    const template = settings.messageTemplates.lowStockAlert?.template;
    if (!template) return;

    const variables = {
      itemName: item.name || 'Item',
      currentStock: currentStock || 0,
      minStock: minStock || 0,
      companyName: settings.companyName || 'Sofa Factory'
    };

    const message = formatMessageTemplate(template, variables);

    const notification = createNotification(
      'lowStockAlert',
      {
        name: 'Admin',
        phone: settings.adminPhoneNumber
      },
      message,
      {
        id: item.id,
        type: item.type || 'item'
      }
    );

    await queueNotification(actions, notification);
  } catch (error) {
    console.error('Error sending low stock alert:', error);
  }
}
