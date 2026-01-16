import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Bell, Save, Phone, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDefaultNotificationSettings, DEFAULT_TEMPLATES, validatePhoneNumber } from '../../lib/notificationHelper';

export default function NotificationSettings() {
  const { state, actions } = useApp();
  const [settings, setSettings] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const allSettings = await actions.getAll("notificationSettings");
      if (allSettings && allSettings.length > 0) {
        setSettings(allSettings[0]);
      } else {
        // Create default settings
        const defaultSettings = getDefaultNotificationSettings();
        await actions.addItem('notificationSettings', defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      setSettings(getDefaultNotificationSettings());
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate phone number if provided
      if (settings.adminPhoneNumber && !validatePhoneNumber(settings.adminPhoneNumber)) {
        alert('Please enter a valid 10-digit phone number');
        setIsSaving(false);
        return;
      }

      await actions.updateItem('notificationSettings', settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotificationType = (type) => {
    setSettings({
      ...settings,
      notificationTypes: {
        ...settings.notificationTypes,
        [type]: !settings.notificationTypes[type]
      }
    });
  };

  const handleUpdateTemplate = (type, newTemplate) => {
    setSettings({
      ...settings,
      messageTemplates: {
        ...settings.messageTemplates,
        [type]: {
          ...settings.messageTemplates[type],
          template: newTemplate
        }
      }
    });
  };

  const handleResetTemplate = (type) => {
    if (window.confirm('Reset this template to default?')) {
      setSettings({
        ...settings,
        messageTemplates: {
          ...settings.messageTemplates,
          [type]: DEFAULT_TEMPLATES[type]
        }
      });
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  const notificationTypeLabels = {
    orderConfirmation: 'Order Confirmation',
    productionStarted: 'Production Started',
    productionCompleted: 'Production Completed',
    paymentReminder: 'Payment Reminder',
    deliveryScheduled: 'Delivery Scheduled',
    orderDelivered: 'Order Delivered',
    purchaseOrderCreated: 'Purchase Order Created',
    lowStockAlert: 'Low Stock Alert'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            WhatsApp Notifications
          </h1>
          <p className="text-gray-600 mt-2">
            Configure automated WhatsApp notifications for customers and suppliers
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="types">Notification Types</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic WhatsApp notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable WhatsApp */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-semibold">Enable WhatsApp Notifications</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Turn on/off all WhatsApp notifications
                  </p>
                </div>
                <Switch
                  checked={settings.whatsappEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, whatsappEnabled: checked })}
                />
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  placeholder="Your Company Name"
                />
                <p className="text-sm text-gray-500">
                  This will appear in notification messages
                </p>
              </div>

              {/* Country Code */}
              <div className="space-y-2">
                <Label>Default Country Code</Label>
                <Input
                  value={settings.defaultCountryCode}
                  onChange={(e) => setSettings({ ...settings, defaultCountryCode: e.target.value })}
                  placeholder="977"
                />
                <p className="text-sm text-gray-500">
                  Country code for phone numbers (Nepal: 977)
                </p>
              </div>

              {/* Admin Phone */}
              <div className="space-y-2">
                <Label>Admin Phone Number</Label>
                <Input
                  value={settings.adminPhoneNumber}
                  onChange={(e) => setSettings({ ...settings, adminPhoneNumber: e.target.value })}
                  placeholder="9800000000"
                />
                <p className="text-sm text-gray-500">
                  Phone number for receiving admin notifications (10 digits, without country code)
                </p>
              </div>

              {/* Info Card */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">How it works</h4>
                      <p className="text-sm text-blue-800">
                        When an event occurs (like a new order), the system generates a WhatsApp message 
                        and adds it to the notification queue. You can then send it with one click, which 
                        opens WhatsApp Web/App with the pre-filled message ready to send.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Types */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Enable or disable specific notification types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.keys(notificationTypeLabels).map((type) => (
                <div key={type} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <Label className="font-medium">{notificationTypeLabels[type]}</Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {DEFAULT_TEMPLATES[type]?.title || ''}
                    </p>
                  </div>
                  <Switch
                    checked={settings.notificationTypes[type]}
                    onCheckedChange={() => handleToggleNotificationType(type)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message Templates */}
        <TabsContent value="templates" className="space-y-4">
          {Object.keys(DEFAULT_TEMPLATES).map((type) => (
            <Card key={type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{notificationTypeLabels[type]}</CardTitle>
                    <CardDescription>
                      Customize the message template. Use {'{variable}'} for dynamic content.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetTemplate(type)}
                  >
                    Reset to Default
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Message Template</Label>
                  <Textarea
                    value={settings.messageTemplates[type]?.template || ''}
                    onChange={(e) => handleUpdateTemplate(type, e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-semibold mb-2 block">Available Variables:</Label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_TEMPLATES[type].variables.map((variable) => (
                      <code key={variable} className="px-2 py-1 bg-white border rounded text-xs">
                        {'{' + variable + '}'}
                      </code>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
