import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Search, Edit, Trash2, Calendar, MessageCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, generateWhatsAppURL, NotificationTemplates } from '../../lib/utils';

export default function CleaningServices() {
  const { state, actions } = useApp();
  const { customers, cleaningServices, company } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    serviceDate: '',
    serviceTime: '',
    serviceType: 'regular',
    price: '',
    address: '',
    notes: ''
  });

  const filteredServices = cleaningServices.filter(service => {
    const matchesSearch = 
      service.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.serviceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const upcomingServices = filteredServices.filter(s => s.status === 'scheduled');
  const completedServices = filteredServices.filter(s => s.status === 'completed');
  const cancelledServices = filteredServices.filter(s => s.status === 'cancelled');

  const handleOpenDialog = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        customerId: service.customerId,
        serviceDate: service.serviceDate,
        serviceTime: service.serviceTime,
        serviceType: service.serviceType,
        price: service.price.toString(),
        address: service.address,
        notes: service.notes || ''
      });
    } else {
      setEditingService(null);
      setFormData({
        customerId: '',
        serviceDate: '',
        serviceTime: '',
        serviceType: 'regular',
        price: '',
        address: '',
        notes: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    setFormData({
      customerId: '',
      serviceDate: '',
      serviceTime: '',
      serviceType: 'regular',
      price: '',
      address: '',
      notes: ''
    });
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer && customer.address) {
      setFormData({
        ...formData,
        customerId,
        address: customer.address
      });
    } else {
      setFormData({
        ...formData,
        customerId
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.serviceDate || !formData.serviceTime) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const customer = customers.find(c => c.id === formData.customerId);
      
      if (!customer) {
        alert('Invalid customer selection');
        return;
      }

      const serviceData = {
        serviceNumber: editingService?.serviceNumber || `CLN-${Date.now().toString().slice(-6)}`,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        serviceDate: formData.serviceDate,
        serviceTime: formData.serviceTime,
        serviceType: formData.serviceType,
        price: parseFloat(formData.price) || 0,
        address: formData.address,
        notes: formData.notes,
        status: editingService?.status || 'scheduled',
        createdAt: editingService?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingService) {
        await actions.updateItem('cleaningServices', { ...serviceData, id: editingService.id });
        alert('Service updated successfully!');
      } else {
        await actions.addItem('cleaningServices', serviceData);
        alert('Service scheduled successfully!');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service. Please try again.');
    }
  };

  const handleStatusUpdate = async (service, newStatus) => {
    if (window.confirm(`Update service status to "${newStatus}"?`)) {
      try {
        const updatedService = {
          ...service,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };

        await actions.updateItem('cleaningServices', updatedService);
        alert('Service status updated successfully!');
      } catch (error) {
        console.error('Error updating service:', error);
        alert('Failed to update service status. Please try again.');
      }
    }
  };

  const handleDelete = async (service) => {
    if (window.confirm(`Are you sure you want to delete this service appointment?`)) {
      try {
        await actions.deleteItem('cleaningServices', service.id);
        alert('Service deleted successfully!');
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service. Please try again.');
      }
    }
  };

  const handleSendReminder = (service) => {
    if (!company) {
      alert('Company information not set up');
      return;
    }

    const message = NotificationTemplates.cleaningReminder(
      company,
      service.customerName,
      service.serviceDate,
      service.serviceTime
    );

    const whatsappURL = generateWhatsAppURL(service.customerPhone, message);
    window.open(whatsappURL, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cleaning Services</h1>
        <p className="text-gray-600 mt-1">Schedule and manage sofa cleaning appointments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingServices.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedServices.length}</div>
            <p className="text-xs text-muted-foreground">Services completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(cleaningServices.reduce((sum, s) => sum + (s.price || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">From cleaning services</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search services by number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Service
        </Button>
      </div>

      {/* Services by Status */}
      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled">
            Scheduled
            <Badge variant="secondary" className="ml-2">{upcomingServices.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge variant="secondary" className="ml-2">{completedServices.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled
            <Badge variant="secondary" className="ml-2">{cancelledServices.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled">
          {upcomingServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500">No scheduled services</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingServices.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{service.serviceNumber}</CardTitle>
                        <CardDescription>{service.customerName}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Date & Time</p>
                        <p className="font-medium">{formatDate(service.serviceDate)} at {service.serviceTime}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Service Type</p>
                        <p className="font-medium capitalize">{service.serviceType}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="font-medium text-green-600">{formatCurrency(service.price)}</p>
                      </div>

                      {service.address && (
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="text-sm line-clamp-2">{service.address}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenDialog(service)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendReminder(service)}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(service, 'completed')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500">No completed services</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedServices.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{service.serviceNumber}</h3>
                          <Badge className={getStatusColor(service.status)}>
                            {service.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-500">Customer</p>
                            <p className="font-medium">{service.customerName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">{formatDate(service.serviceDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Service Type</p>
                            <p className="font-medium capitalize">{service.serviceType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Price</p>
                            <p className="font-medium text-green-600">{formatCurrency(service.price)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled">
          {cancelledServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500">No cancelled services</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {cancelledServices.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{service.serviceNumber} - {service.customerName}</h3>
                        <p className="text-sm text-gray-500">{formatDate(service.serviceDate)}</p>
                      </div>
                      <Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Schedule New Service'}
            </DialogTitle>
            <DialogDescription>
              {editingService 
                ? 'Update service appointment details' 
                : 'Schedule a new cleaning service appointment'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">
                  Customer <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.customerId} onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceDate">
                    Service Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="serviceDate"
                    type="date"
                    value={formData.serviceDate}
                    onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceTime">
                    Service Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="serviceTime"
                    type="time"
                    value={formData.serviceTime}
                    onChange={(e) => setFormData({ ...formData, serviceTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select value={formData.serviceType} onValueChange={(value) => setFormData({ ...formData, serviceType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular Cleaning</SelectItem>
                      <SelectItem value="deep">Deep Cleaning</SelectItem>
                      <SelectItem value="stain_removal">Stain Removal</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (NPR)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Service Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter service address"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any special instructions or notes"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingService ? 'Update Service' : 'Schedule Service'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
