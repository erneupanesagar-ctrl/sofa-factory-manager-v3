import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Bell, Send, Trash2, CheckCircle, Clock, XCircle, MessageSquare, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { openWhatsApp } from '../../lib/notificationHelper';

export default function NotificationQueue() {
  const { state, actions } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const allNotifications = await actions.getAll("notificationQueue");
      // Sort by created date, newest first
      const sorted = (allNotifications || []).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNotifications(sorted);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const handleSendNotification = async (notification) => {
    try {
      // Open WhatsApp
      openWhatsApp(notification.recipient.phone, notification.message);

      // Mark as sent
      await actions.updateItem('notificationQueue', {
        ...notification,
        status: 'sent',
        sentAt: new Date().toISOString()
      });

      // Reload notifications
      await loadNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  const handleDeleteNotification = async (notification) => {
    if (!window.confirm('Delete this notification?')) {
      return;
    }

    try {
      await actions.deleteItem('notificationQueue', notification.id);
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification. Please try again.');
    }
  };

  const handleClearSent = async () => {
    if (!window.confirm('Clear all sent notifications?')) {
      return;
    }

    try {
      const sentNotifications = notifications.filter(n => n.status === 'sent');
      for (const notification of sentNotifications) {
        await actions.deleteItem('notificationQueue', notification.id);
      }
      await loadNotifications();
    } catch (error) {
      console.error('Error clearing sent notifications:', error);
      alert('Failed to clear notifications. Please try again.');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterStatus !== 'all' && n.status !== filterStatus) return false;
    if (filterType !== 'all' && n.type !== filterType) return false;
    return true;
  });

  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  const sentCount = notifications.filter(n => n.status === 'sent').length;

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
      sent: { variant: 'success', icon: CheckCircle, label: 'Sent' },
      failed: { variant: 'destructive', icon: XCircle, label: 'Failed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      orderConfirmation: 'Order Confirmation',
      productionStarted: 'Production Started',
      productionCompleted: 'Production Completed',
      paymentReminder: 'Payment Reminder',
      deliveryScheduled: 'Delivery Scheduled',
      orderDelivered: 'Order Delivered',
      purchaseOrderCreated: 'Purchase Order',
      lowStockAlert: 'Low Stock Alert'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            Notification Queue
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and send WhatsApp notifications
          </p>
        </div>
        {sentCount > 0 && (
          <Button variant="outline" onClick={handleClearSent}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Sent ({sentCount})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-green-600">{sentCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="orderConfirmation">Order Confirmation</SelectItem>
                  <SelectItem value="productionStarted">Production Started</SelectItem>
                  <SelectItem value="productionCompleted">Production Completed</SelectItem>
                  <SelectItem value="paymentReminder">Payment Reminder</SelectItem>
                  <SelectItem value="deliveryScheduled">Delivery Scheduled</SelectItem>
                  <SelectItem value="orderDelivered">Order Delivered</SelectItem>
                  <SelectItem value="lowStockAlert">Low Stock Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No notifications found</p>
              <p className="text-sm text-gray-500 mt-1">
                Notifications will appear here when events occur
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card key={notification.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{getTypeLabel(notification.type)}</Badge>
                      {getStatusBadge(notification.status)}
                    </div>

                    {/* Recipient */}
                    <div>
                      <p className="font-semibold text-lg">{notification.recipient.name}</p>
                      <p className="text-sm text-gray-600">📱 {notification.recipient.phone}</p>
                    </div>

                    {/* Message Preview */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap font-mono">
                        {notification.message.length > 200 
                          ? notification.message.substring(0, 200) + '...' 
                          : notification.message}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Created: {formatDate(notification.createdAt)}</span>
                      {notification.sentAt && (
                        <span>Sent: {formatDate(notification.sentAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {notification.status === 'pending' && (
                      <Button
                        onClick={() => handleSendNotification(notification)}
                        className="whitespace-nowrap"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send WhatsApp
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteNotification(notification)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
