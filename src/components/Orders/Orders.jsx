import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Search, Eye, MessageCircle, ChevronRight, Package, Truck, Camera, Trash2, X } from 'lucide-react';
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

// Order Statuses
const OrderStatuses = {
  PENDING_APPROVAL: { value: 'pending_approval', label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { value: 'approved', label: 'Approved', color: 'bg-blue-100 text-blue-800' },
  IN_PRODUCTION: { value: 'in_production', label: 'In Production', color: 'bg-purple-100 text-purple-800' },
  COMPLETED: { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  READY_FOR_DELIVERY: { value: 'ready_for_delivery', label: 'Ready for Delivery', color: 'bg-orange-100 text-orange-800' },
  DELIVERED: { value: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-800' },
  CANCELLED: { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
};

// Material categories and units
const materialCategories = ['Wood', 'Fabric', 'Foam', 'Metal', 'Leather', 'Springs', 'Webbing', 'Thread', 'General'];
const materialUnits = ['Pieces', 'Meters', 'Feet', 'Yards', 'Sq.Ft', 'Sq.M', 'Kg', 'Grams', 'Liters', 'Sheets', 'Rolls', 'Sets'];

export default function Orders() {
  const { state, actions } = useApp();
  const { customers, rawMaterials, sofaModels, company } = state;
  const [orders, setOrders] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [completingOrder, setCompletingOrder] = useState(null);
  const [deliveringOrder, setDeliveringOrder] = useState(null);
  
  // Form state for new order
  const [formData, setFormData] = useState({
    orderType: 'customer', // 'customer' or 'stock'
    customerId: '',
    productName: '',
    quantity: '1',
    unitPrice: '',
    notes: '',
    dueDate: '',
    bom: [] // Bill of Materials
  });

  // Completion form state (for stock orders)
  const [completionData, setCompletionData] = useState({
    productPhoto: null,
    productPhotoPreview: '',
    sellingPrice: ''
  });

  // Delivery form state (for customer orders)
  const [deliveryData, setDeliveryData] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryNotes: '',
    deliveryPhoto: null,
    deliveryPhotoPreview: ''
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
    const matchesType = orderTypeFilter === 'all' || order.orderType === orderTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleOpenDialog = () => {
    setFormData({
      orderType: 'customer',
      customerId: '',
      productName: '',
      quantity: '1',
      unitPrice: '',
      notes: '',
      dueDate: '',
      bom: []
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // BOM Management
  const handleAddBomItem = () => {
    setFormData({
      ...formData,
      bom: [...formData.bom, { materialName: '', category: 'General', unit: 'Pieces', quantity: 1 }]
    });
  };

  const handleRemoveBomItem = (index) => {
    const newBom = formData.bom.filter((_, i) => i !== index);
    setFormData({ ...formData, bom: newBom });
  };

  const handleBomItemChange = (index, field, value) => {
    const newBom = [...formData.bom];
    newBom[index] = { ...newBom[index], [field]: value };
    setFormData({ ...formData, bom: newBom });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.productName.trim()) {
      alert('Please enter product name');
      return;
    }

    if (formData.orderType === 'customer' && !formData.customerId) {
      alert('Please select a customer for customer order');
      return;
    }

    if (formData.bom.length === 0) {
      alert('Please add at least one material to the Bill of Materials');
      return;
    }

    try {
      const quantity = parseInt(formData.quantity) || 1;
      const unitPrice = parseFloat(formData.unitPrice) || 0;
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

      let customerData = {};
      if (formData.orderType === 'customer') {
        const customer = customers.find(c => c.id === parseInt(formData.customerId));
        if (!customer) {
          alert('Invalid customer selection');
          return;
        }
        customerData = {
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerAddress: customer.address
        };
      }

      const orderData = {
        orderNumber,
        orderType: formData.orderType,
        ...customerData,
        productName: formData.productName.trim(),
        quantity,
        unitPrice,
        totalAmount: unitPrice * quantity,
        bom: formData.bom.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity) || 0,
          totalNeeded: (parseFloat(item.quantity) || 0) * quantity
        })),
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

  const handleStatusUpdate = async (order, newStatus, additionalData = {}) => {
    try {
      const statusLabel = OrderStatuses[Object.keys(OrderStatuses).find(k => OrderStatuses[k].value === newStatus)]?.label;
      
      const updatedOrder = {
        ...order,
        ...additionalData,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        statusHistory: [
          ...(order.statusHistory || []),
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: `Status updated to ${statusLabel}`
          }
        ]
      };

      // Handle material deduction when moving to In Production
      if (newStatus === OrderStatuses.IN_PRODUCTION.value) {
        await deductMaterials(order);
      }

      // Handle stock order completion - add to finished products
      if (order.orderType === 'stock' && newStatus === OrderStatuses.COMPLETED.value) {
        await addToFinishedProducts(order, additionalData);
      }

      // Handle customer order delivery - create sale record
      if (order.orderType === 'customer' && newStatus === OrderStatuses.DELIVERED.value) {
        await createSaleRecord(order, additionalData);
      }

      await actions.updateItem('orders', updatedOrder);
      setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
      
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status. Please try again.');
      return false;
    }
  };

  const deductMaterials = async (order) => {
    if (!order.bom || order.bom.length === 0) return;

    for (const bomItem of order.bom) {
      // Find matching raw material by name and try to deduct
      const matchingMaterials = (rawMaterials || []).filter(
        m => m.name?.toLowerCase() === bomItem.materialName?.toLowerCase()
      );

      if (matchingMaterials.length > 0) {
        let remainingToDeduct = bomItem.totalNeeded || (bomItem.quantity * order.quantity);
        
        for (const material of matchingMaterials) {
          if (remainingToDeduct <= 0) break;
          
          const deductAmount = Math.min(material.quantity, remainingToDeduct);
          const updatedMaterial = {
            ...material,
            quantity: material.quantity - deductAmount
          };
          await actions.updateItem('rawMaterials', updatedMaterial);
          remainingToDeduct -= deductAmount;
        }
      }
    }
  };

  const addToFinishedProducts = async (order, completionData) => {
    const productData = {
      name: order.productName,
      category: 'Finished Product',
      stock: order.quantity,
      sellingPrice: parseFloat(completionData.sellingPrice) || 0,
      productPhoto: completionData.productPhoto || null,
      bom: order.bom,
      createdFromOrder: order.orderNumber,
      createdAt: new Date().toISOString()
    };

    await actions.addItem('sofaModels', productData);
  };

  const createSaleRecord = async (order, deliveryData) => {
    const saleData = {
      date: deliveryData.deliveryDate || new Date().toISOString().split('T')[0],
      customerId: order.customerId,
      customerName: order.customerName,
      productName: order.productName,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      totalAmount: order.totalAmount,
      paymentMethod: 'pending',
      paymentStatus: 'pending',
      status: 'approved',
      orderNumber: order.orderNumber,
      deliveryNotes: deliveryData.deliveryNotes,
      deliveryPhoto: deliveryData.deliveryPhoto,
      createdAt: new Date().toISOString()
    };

    await actions.addItem('sales', saleData);
  };

  // Approval handler
  const handleApprove = async (order) => {
    if (window.confirm('Approve this order and move to production queue?')) {
      await handleStatusUpdate(order, OrderStatuses.APPROVED.value);
      alert('Order approved!');
    }
  };

  // Start production handler
  const handleStartProduction = async (order) => {
    // Validate materials availability
    let canStart = true;
    let missingMaterials = [];

    for (const bomItem of (order.bom || [])) {
      const totalNeeded = bomItem.totalNeeded || (bomItem.quantity * order.quantity);
      const matchingMaterials = (rawMaterials || []).filter(
        m => m.name?.toLowerCase() === bomItem.materialName?.toLowerCase()
      );
      const totalAvailable = matchingMaterials.reduce((sum, m) => sum + (m.quantity || 0), 0);
      
      if (totalAvailable < totalNeeded) {
        canStart = false;
        missingMaterials.push(`${bomItem.materialName}: Need ${totalNeeded}, Have ${totalAvailable}`);
      }
    }

    if (!canStart) {
      alert(`Cannot start production. Insufficient materials:\n${missingMaterials.join('\n')}`);
      return;
    }

    if (window.confirm('Start production? Materials will be deducted from inventory.')) {
      const success = await handleStatusUpdate(order, OrderStatuses.IN_PRODUCTION.value);
      if (success) {
        alert('Production started! Materials have been deducted.');
      }
    }
  };

  // Complete production handler
  const handleCompleteProduction = (order) => {
    setCompletingOrder(order);
    setCompletionData({
      productPhoto: null,
      productPhotoPreview: '',
      sellingPrice: order.unitPrice?.toString() || ''
    });
    setIsCompletionDialogOpen(true);
  };

  const handleCompletionSubmit = async () => {
    if (!completingOrder) return;

    if (completingOrder.orderType === 'stock' && !completionData.sellingPrice) {
      alert('Please enter selling price for stock item');
      return;
    }

    const newStatus = completingOrder.orderType === 'stock' 
      ? OrderStatuses.COMPLETED.value 
      : OrderStatuses.COMPLETED.value;

    const success = await handleStatusUpdate(completingOrder, newStatus, completionData);
    
    if (success) {
      if (completingOrder.orderType === 'stock') {
        alert('Production completed! Product added to Finished Products inventory.');
      } else {
        alert('Production completed! Order is ready for delivery.');
        // Move customer order to Ready for Delivery
        await handleStatusUpdate(
          { ...completingOrder, status: newStatus },
          OrderStatuses.READY_FOR_DELIVERY.value
        );
      }
      setIsCompletionDialogOpen(false);
      setCompletingOrder(null);
    }
  };

  // Delivery handler for customer orders
  const handleReadyForDelivery = (order) => {
    setDeliveringOrder(order);
    setDeliveryData({
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryNotes: '',
      deliveryPhoto: null,
      deliveryPhotoPreview: ''
    });
    setIsDeliveryDialogOpen(true);
  };

  const handleDeliverySubmit = async () => {
    if (!deliveringOrder) return;

    const success = await handleStatusUpdate(deliveringOrder, OrderStatuses.DELIVERED.value, deliveryData);
    
    if (success) {
      alert('Order delivered! Sale record has been created.');
      setIsDeliveryDialogOpen(false);
      setDeliveringOrder(null);
    }
  };

  // Photo upload handlers
  const handlePhotoUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'completion') {
          setCompletionData({
            ...completionData,
            productPhoto: reader.result,
            productPhotoPreview: reader.result
          });
        } else if (type === 'delivery') {
          setDeliveryData({
            ...deliveryData,
            deliveryPhoto: reader.result,
            deliveryPhotoPreview: reader.result
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Cancel order handler
  const handleCancelOrder = async (order) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      // If in production, restore materials
      if (order.status === OrderStatuses.IN_PRODUCTION.value) {
        // TODO: Restore materials logic
      }
      await handleStatusUpdate(order, OrderStatuses.CANCELLED.value);
      alert('Order cancelled.');
    }
  };

  const getStatusColor = (status) => {
    const statusObj = Object.values(OrderStatuses).find(s => s.value === status);
    return statusObj?.color || 'bg-gray-100 text-gray-800';
  };

  const getNextActions = (order) => {
    const actions = [];
    
    switch (order.status) {
      case OrderStatuses.PENDING_APPROVAL.value:
        actions.push({ label: 'Approve', action: () => handleApprove(order), variant: 'default' });
        actions.push({ label: 'Cancel', action: () => handleCancelOrder(order), variant: 'destructive' });
        break;
      case OrderStatuses.APPROVED.value:
        actions.push({ label: 'Start Production', action: () => handleStartProduction(order), variant: 'default' });
        actions.push({ label: 'Cancel', action: () => handleCancelOrder(order), variant: 'destructive' });
        break;
      case OrderStatuses.IN_PRODUCTION.value:
        actions.push({ label: 'Complete Production', action: () => handleCompleteProduction(order), variant: 'default' });
        break;
      case OrderStatuses.READY_FOR_DELIVERY.value:
        if (order.orderType === 'customer') {
          actions.push({ label: 'Mark Delivered', action: () => handleReadyForDelivery(order), variant: 'default' });
        }
        break;
      default:
        break;
    }
    
    return actions;
  };

  // Stats
  const stats = {
    pendingApproval: orders.filter(o => o.status === OrderStatuses.PENDING_APPROVAL.value).length,
    inProduction: orders.filter(o => o.status === OrderStatuses.IN_PRODUCTION.value).length,
    readyForDelivery: orders.filter(o => o.status === OrderStatuses.READY_FOR_DELIVERY.value).length,
    completedThisMonth: orders.filter(o => {
      const isCompleted = o.status === OrderStatuses.COMPLETED.value || o.status === OrderStatuses.DELIVERED.value;
      const thisMonth = new Date().getMonth();
      const orderMonth = new Date(o.updatedAt).getMonth();
      return isCompleted && thisMonth === orderMonth;
    }).length
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage stock and customer orders with full production workflow</p>
        <p className="text-sm text-blue-600 mt-1">* Orders flow: Pending Approval → Approved → In Production → Completed/Delivered</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Pending Approval</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">In Production</div>
            <div className="text-2xl font-bold text-purple-600">{stats.inProduction}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Ready for Delivery</div>
            <div className="text-2xl font-bold text-orange-600">{stats.readyForDelivery}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Completed This Month</div>
            <div className="text-2xl font-bold text-green-600">{stats.completedThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Order Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="stock">Stock Orders</SelectItem>
            <SelectItem value="customer">Customer Orders</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No orders yet</p>
            <p className="text-gray-400">Create your first order to get started</p>
            <Button onClick={handleOpenDialog} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                    <CardDescription>
                      {order.orderType === 'stock' ? 'Stock Order' : order.customerName}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={getStatusColor(order.status)}>
                      {OrderStatuses[Object.keys(OrderStatuses).find(k => OrderStatuses[k].value === order.status)]?.label}
                    </Badge>
                    <Badge variant={order.orderType === 'stock' ? 'secondary' : 'outline'}>
                      {order.orderType === 'stock' ? <Package className="w-3 h-3 mr-1" /> : <Truck className="w-3 h-3 mr-1" />}
                      {order.orderType === 'stock' ? 'Stock' : 'Customer'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-medium">{order.productName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{order.quantity}</span>
                  </div>
                  {order.orderType === 'customer' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">NPR {(order.totalAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {order.dueDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">{new Date(order.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {order.bom && order.bom.length > 0 && (
                    <div className="text-sm text-gray-500">
                      Materials: {order.bom.length} items
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setViewingOrder(order)}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {getNextActions(order).map((action, idx) => (
                    <Button 
                      key={idx} 
                      size="sm" 
                      variant={action.variant}
                      onClick={action.action}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
            <DialogDescription>Create a new stock or customer order with Bill of Materials</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Order Type */}
            <div className="space-y-2">
              <Label>Order Type *</Label>
              <Select 
                value={formData.orderType} 
                onValueChange={(value) => setFormData({ ...formData, orderType: value, customerId: '' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Stock Order (Build for Inventory)
                    </div>
                  </SelectItem>
                  <SelectItem value="customer">
                    <div className="flex items-center">
                      <Truck className="w-4 h-4 mr-2" />
                      Customer Order (For Delivery)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customer Selection (only for customer orders) */}
            {formData.orderType === 'customer' && (
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select 
                  value={formData.customerId} 
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {(customers || []).map(customer => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Product Name */}
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="e.g., L-Shape Sofa, 3-Seater Couch"
              />
            </div>

            {/* Quantity and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              {formData.orderType === 'customer' && (
                <div className="space-y-2">
                  <Label>Unit Price (NPR)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    placeholder="Price per unit"
                  />
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            {/* Bill of Materials */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Bill of Materials (BOM) *</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddBomItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Material
                </Button>
              </div>
              
              {formData.bom.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-4 text-center text-gray-500">
                  No materials added. Click "Add Material" to define required materials.
                </div>
              ) : (
                <div className="space-y-3 border rounded-lg p-3">
                  {formData.bom.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Label className="text-xs">Material Name</Label>
                        <Input
                          value={item.materialName}
                          onChange={(e) => handleBomItemChange(index, 'materialName', e.target.value)}
                          placeholder="e.g., Wood, Fabric"
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Category</Label>
                        <Select 
                          value={item.category} 
                          onValueChange={(value) => handleBomItemChange(index, 'category', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {materialCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => handleBomItemChange(index, 'quantity', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Unit</Label>
                        <Select 
                          value={item.unit} 
                          onValueChange={(value) => handleBomItemChange(index, 'unit', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {materialUnits.map(unit => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1">
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          className="h-9 w-9 p-0 text-red-500"
                          onClick={() => handleRemoveBomItem(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this order"
                rows={2}
              />
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
      <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {viewingOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          
          {viewingOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Order Type</Label>
                  <p className="font-medium">{viewingOrder.orderType === 'stock' ? 'Stock Order' : 'Customer Order'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <Badge className={getStatusColor(viewingOrder.status)}>
                    {OrderStatuses[Object.keys(OrderStatuses).find(k => OrderStatuses[k].value === viewingOrder.status)]?.label}
                  </Badge>
                </div>
                {viewingOrder.orderType === 'customer' && (
                  <>
                    <div>
                      <Label className="text-gray-500">Customer</Label>
                      <p className="font-medium">{viewingOrder.customerName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Phone</Label>
                      <p className="font-medium">{viewingOrder.customerPhone}</p>
                    </div>
                  </>
                )}
                <div>
                  <Label className="text-gray-500">Product</Label>
                  <p className="font-medium">{viewingOrder.productName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Quantity</Label>
                  <p className="font-medium">{viewingOrder.quantity}</p>
                </div>
                {viewingOrder.orderType === 'customer' && (
                  <div>
                    <Label className="text-gray-500">Total Amount</Label>
                    <p className="font-medium">NPR {(viewingOrder.totalAmount || 0).toLocaleString()}</p>
                  </div>
                )}
                {viewingOrder.dueDate && (
                  <div>
                    <Label className="text-gray-500">Due Date</Label>
                    <p className="font-medium">{new Date(viewingOrder.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* BOM Section */}
              {viewingOrder.bom && viewingOrder.bom.length > 0 && (
                <div>
                  <Label className="text-gray-500">Bill of Materials</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Material</th>
                          <th className="px-3 py-2 text-left">Category</th>
                          <th className="px-3 py-2 text-right">Qty/Unit</th>
                          <th className="px-3 py-2 text-right">Total Needed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingOrder.bom.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">{item.materialName}</td>
                            <td className="px-3 py-2">{item.category}</td>
                            <td className="px-3 py-2 text-right">{item.quantity} {item.unit}</td>
                            <td className="px-3 py-2 text-right">{item.totalNeeded || (item.quantity * viewingOrder.quantity)} {item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Status History */}
              {viewingOrder.statusHistory && viewingOrder.statusHistory.length > 0 && (
                <div>
                  <Label className="text-gray-500">Status History</Label>
                  <div className="mt-2 space-y-2">
                    {viewingOrder.statusHistory.map((history, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        <span className="text-gray-600">{new Date(history.timestamp).toLocaleString()}</span>
                        <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                        <span className="font-medium">{history.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingOrder.notes && (
                <div>
                  <Label className="text-gray-500">Notes</Label>
                  <p className="mt-1">{viewingOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Completion Dialog (for finishing production) */}
      <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Production</DialogTitle>
            <DialogDescription>
              {completingOrder?.orderType === 'stock' 
                ? 'Add product photo and set selling price for inventory'
                : 'Mark production as complete'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {completingOrder?.orderType === 'stock' && (
              <>
                <div className="space-y-2">
                  <Label>Selling Price (NPR) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={completionData.sellingPrice}
                    onChange={(e) => setCompletionData({ ...completionData, sellingPrice: e.target.value })}
                    placeholder="Enter selling price"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Product Photo</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {completionData.productPhotoPreview ? (
                      <div className="relative">
                        <img 
                          src={completionData.productPhotoPreview} 
                          alt="Product" 
                          className="max-h-40 mx-auto rounded"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-0 right-0"
                          onClick={() => setCompletionData({ ...completionData, productPhoto: null, productPhotoPreview: '' })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload photo</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e, 'completion')}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompletionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompletionSubmit}>
              Complete Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Dialog (for customer orders) */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Delivered</DialogTitle>
            <DialogDescription>
              Confirm delivery details. A sale record will be created automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Delivery Date</Label>
              <Input
                type="date"
                value={deliveryData.deliveryDate}
                onChange={(e) => setDeliveryData({ ...deliveryData, deliveryDate: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Delivery Notes</Label>
              <Textarea
                value={deliveryData.deliveryNotes}
                onChange={(e) => setDeliveryData({ ...deliveryData, deliveryNotes: e.target.value })}
                placeholder="Any notes about the delivery"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Delivery Photo (Proof)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {deliveryData.deliveryPhotoPreview ? (
                  <div className="relative">
                    <img 
                      src={deliveryData.deliveryPhotoPreview} 
                      alt="Delivery" 
                      className="max-h-40 mx-auto rounded"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-0 right-0"
                      onClick={() => setDeliveryData({ ...deliveryData, deliveryPhoto: null, deliveryPhotoPreview: '' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload delivery photo</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, 'delivery')}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeliverySubmit}>
              <Truck className="w-4 h-4 mr-2" />
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
