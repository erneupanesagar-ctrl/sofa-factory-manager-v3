import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Search, Eye, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, OrderStatuses, getOrderStatusColor, generateWhatsAppURL, NotificationTemplates } from '../../lib/utils';

export default function Orders() {
  const { state, actions } = useApp();
  const { customers, sofaModels, company } = state;
  const [orders, setOrders] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    productId: '',
    quantity: '1',
    notes: '',
    dueDate: ''
  });

  // Load orders from database
  React.useEffect(() => {
    const loadOrders = async () => {
      try {
        const allOrders = await actions.getAllOrders();
        setOrders(allOrders || []);
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    };
    loadOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = () => {
    setFormData({
      customerId: '',
      productId: '',
      quantity: '1',
      notes: '',
      dueDate: ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      customerId: '',
      productId: '',
      quantity: '1',
      notes: '',
      dueDate: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.productId) {
      alert('Please select customer and product');
      return;
    }

    try {
      const customer = customers.find(c => c.id === formData.customerId);
      const product = sofaModels.find(p => p.id === formData.productId);
      
      if (!customer || !product) {
        alert('Invalid customer or product selection');
        return;
      }

      const quantity = parseInt(formData.quantity) || 1;
      const totalAmount = product.sellingPrice * quantity;
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

      const orderData = {
        orderNumber,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.sellingPrice,
        totalAmount,
        status: OrderStatuses.PENDING_APPROVAL.value,
        notes: formData.notes,
        dueDate: formData.dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [{
          status: OrderStatuses.PENDING_APPROVAL.value,
          timestamp: new Date().toISOString(),
          note: 'Order created'
        }]
      };

      const newOrder = await actions.addItem('orders', orderData);
      setOrders([...orders, newOrder]);
      alert('Order created successfully!');
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  const handleStatusUpdate = async (order, newStatus) => {
    if (window.confirm(`Update order status to "${OrderStatuses[Object.keys(OrderStatuses).find(k => OrderStatuses[k].value === newStatus)]?.label}"?`)) {
      try {
        const updatedOrder = {
          ...order,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          statusHistory: [
            ...(order.statusHistory || []),
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
              note: `Status updated to ${OrderStatuses[Object.keys(OrderStatuses).find(k => OrderStatuses[k].value === newStatus)]?.label}`
            }
          ]
        };

        await actions.updateItem('orders', updatedOrder);
        setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
        
        // Trigger WhatsApp notification
        handleSendWhatsApp(updatedOrder);
        
        alert('Order status updated successfully!');
        setViewingOrder(null);
      } catch (error) {
        console.error('Error updating order:', error);
        alert('Failed to update order status. Please try again.');
      }
    }
  };

  const handleSendWhatsApp = (order) => {
    if (!company) {
      alert('Company information not set up');
      return;
    }

    const message = NotificationTemplates.orderStatus(
      company,
      order.customerName,
      order.orderNumber,
      order.status
    );

    const whatsappURL = generateWhatsAppURL(order.customerPhone, message);
    window.open(whatsappURL, '_blank');
  };

  const getNextStatus = (currentStatus) => {
    const statusOrder = [
      OrderStatuses.PENDING_APPROVAL.value,
      OrderStatuses.QUEUED.value,
      OrderStatuses.IN_CONSTRUCTION.value,
      OrderStatuses.PENDING_INSPECTION.value,
      OrderStatuses.COMPLETED.value
    ];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  const groupedOrders = {
    [OrderStatuses.PENDING_APPROVAL.value]: filteredOrders.filter(o => o.status === OrderStatuses.PENDING_APPROVAL.value),
    [OrderStatuses.QUEUED.value]: filteredOrders.filter(o => o.status === OrderStatuses.QUEUED.value),
    [OrderStatuses.IN_CONSTRUCTION.value]: filteredOrders.filter(o => o.status === OrderStatuses.IN_CONSTRUCTION.value),
    [OrderStatuses.PENDING_INSPECTION.value]: filteredOrders.filter(o => o.status === OrderStatuses.PENDING_INSPECTION.value),
    [OrderStatuses.COMPLETED.value]: filteredOrders.filter(o => o.status === OrderStatuses.COMPLETED.value)
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage customer orders with 5-stage workflow</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search orders by number, customer, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(OrderStatuses).map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleOpenDialog} className="whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Orders by Status */}
      <Tabs defaultValue={OrderStatuses.PENDING_APPROVAL.value} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {Object.values(OrderStatuses).map(status => (
            <TabsTrigger key={status.value} value={status.value} className="text-xs">
              {status.label}
              <Badge variant="secondary" className="ml-2">
                {groupedOrders[status.value].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.values(OrderStatuses).map(status => (
          <TabsContent key={status.value} value={status.value}>
            {groupedOrders[status.value].length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500">No orders in {status.label}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedOrders[status.value].map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                          <CardDescription>{order.customerName}</CardDescription>
                        </div>
                        <Badge className={getOrderStatusColor(order.status)}>
                          {OrderStatuses[Object.keys(OrderStatuses).find(k => OrderStatuses[k].value === order.status)]?.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Product</p>
                          <p className="font-medium">{order.productName}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-gray-500">Quantity</p>
                            <p className="font-medium">{order.quantity}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="font-medium text-green-600">{formatCurrency(order.totalAmount)}</p>
                          </div>
                        </div>

                        {order.dueDate && (
                          <div>
                            <p className="text-sm text-gray-500">Due Date</p>
                            <p className="font-medium">{formatDate(order.dueDate)}</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setViewingOrder(order)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendWhatsApp(order)}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>
              Create a new customer order. Status will be set to Pending Approval.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">
                  Customer <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
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

              <div className="space-y-2">
                <Label htmlFor="productId">
                  Product <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {sofaModels.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.sellingPrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
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
              <Button type="submit">Create Order</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      {viewingOrder && (
        <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - {viewingOrder.orderNumber}</DialogTitle>
              <DialogDescription>
                Created on {formatDate(viewingOrder.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="font-medium">{viewingOrder.customerName}</p>
                  <p className="text-sm text-gray-500">{viewingOrder.customerPhone}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getOrderStatusColor(viewingOrder.status)}>
                    {OrderStatuses[Object.keys(OrderStatuses).find(k => OrderStatuses[k].value === viewingOrder.status)]?.label}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Product</Label>
                <p className="font-medium">{viewingOrder.productName}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <p className="font-medium">{viewingOrder.quantity}</p>
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <p className="font-medium">{formatCurrency(viewingOrder.unitPrice)}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="font-medium text-green-600">{formatCurrency(viewingOrder.totalAmount)}</p>
                </div>
              </div>

              {viewingOrder.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-gray-700">{viewingOrder.notes}</p>
                </div>
              )}

              {viewingOrder.statusHistory && viewingOrder.statusHistory.length > 0 && (
                <div>
                  <Label>Status History</Label>
                  <div className="mt-2 space-y-2">
                    {viewingOrder.statusHistory.map((history, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 mt-0.5 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {OrderStatuses[Object.keys(OrderStatuses).find(k => OrderStatuses[k].value === history.status)]?.label}
                          </p>
                          <p className="text-gray-500 text-xs">{formatDate(history.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => handleSendWhatsApp(viewingOrder)}
                className="w-full sm:w-auto"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send WhatsApp
              </Button>
              
              {getNextStatus(viewingOrder.status) && (
                <Button
                  onClick={() => handleStatusUpdate(viewingOrder, getNextStatus(viewingOrder.status))}
                  className="w-full sm:w-auto"
                >
                  Move to {OrderStatuses[Object.keys(OrderStatuses).find(k => OrderStatuses[k].value === getNextStatus(viewingOrder.status))]?.label}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
