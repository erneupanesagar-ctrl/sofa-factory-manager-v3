import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Search, Eye, MessageCircle, ChevronRight, Package, Truck, Camera, Trash2, X, AlertTriangle, CheckCircle, ShoppingCart, Users } from 'lucide-react';
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
import database from '../../lib/database';

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

// Material units
const materialUnits = ['Pieces', 'Meters', 'Feet', 'Yards', 'Sq.Ft', 'Sq.M', 'Kg', 'Grams', 'Liters', 'Sheets', 'Rolls', 'Sets'];

export default function Orders() {
  const { state, actions } = useApp();
  const { customers, rawMaterials, sofaModels, company } = state;
  const [orders, setOrders] = useState([]);
  const [labourers, setLabourers] = useState([]);
  
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
    bom: [], // Bill of Materials
    labourCosts: [] // Labour costs
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

  // Load orders and labourers from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const [allOrders, allLabourers] = await Promise.all([
          actions.getAllOrders(),
          database.getAll('labourers')
        ]);
        setOrders(allOrders || []);
        setLabourers((allLabourers || []).filter(l => l.status === 'active'));
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
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

  // Get stock status for a material
  const getMaterialStockStatus = (materialId, requiredQty) => {
    const material = (rawMaterials || []).find(m => m.id === parseInt(materialId));
    if (!material) return { status: 'not_found', available: 0, shortage: requiredQty };
    
    const available = parseFloat(material.quantity) || 0;
    const required = parseFloat(requiredQty) || 0;
    
    if (available >= required) {
      return { status: 'in_stock', available, shortage: 0, material };
    } else if (available > 0) {
      return { status: 'low_stock', available, shortage: required - available, material };
    } else {
      return { status: 'out_of_stock', available: 0, shortage: required, material };
    }
  };

  // Calculate total BOM cost
  const calculateBomCost = () => {
    return formData.bom.reduce((total, item) => {
      const material = (rawMaterials || []).find(m => m.id === parseInt(item.materialId));
      if (material) {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(material.pricePerUnit) || 0;
        return total + (qty * price);
      }
      return total;
    }, 0);
  };

  // Calculate total labour cost
  const calculateLabourCost = () => {
    return formData.labourCosts.reduce((total, item) => {
      return total + (parseFloat(item.cost) || 0);
    }, 0);
  };

  // Calculate total order cost
  const calculateTotalCost = () => {
    const bomCost = calculateBomCost();
    const labourCost = calculateLabourCost();
    const quantity = parseInt(formData.quantity) || 1;
    return (bomCost + labourCost) * quantity;
  };

  const handleOpenDialog = () => {
    setFormData({
      orderType: 'customer',
      customerId: '',
      productName: '',
      quantity: '1',
      unitPrice: '',
      notes: '',
      dueDate: '',
      bom: [],
      labourCosts: []
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // BOM Management - Add from inventory
  const handleAddBomItem = () => {
    setFormData({
      ...formData,
      bom: [...formData.bom, { 
        materialId: '', 
        materialName: '',
        category: '',
        unit: 'Pieces', 
        quantity: 1,
        availableStock: 0,
        pricePerUnit: 0,
        isOutOfStock: false,
        needToPurchase: false,
        purchaseNote: ''
      }]
    });
  };

  // Add custom material (not in inventory)
  const handleAddCustomMaterial = () => {
    setFormData({
      ...formData,
      bom: [...formData.bom, { 
        materialId: 'custom', 
        materialName: '',
        category: 'Custom',
        unit: 'Pieces', 
        quantity: 1,
        availableStock: 0,
        pricePerUnit: 0,
        isOutOfStock: true,
        needToPurchase: true,
        purchaseNote: '',
        estimatedCost: ''
      }]
    });
  };

  const handleRemoveBomItem = (index) => {
    const newBom = formData.bom.filter((_, i) => i !== index);
    setFormData({ ...formData, bom: newBom });
  };

  const handleBomItemChange = (index, field, value) => {
    const newBom = [...formData.bom];
    newBom[index] = { ...newBom[index], [field]: value };
    
    // If material is selected from inventory, update related fields
    if (field === 'materialId' && value !== 'custom') {
      const material = (rawMaterials || []).find(m => m.id === parseInt(value));
      if (material) {
        newBom[index] = {
          ...newBom[index],
          materialName: material.name,
          category: material.category || 'General',
          unit: material.unit || 'Pieces',
          availableStock: parseFloat(material.quantity) || 0,
          pricePerUnit: parseFloat(material.pricePerUnit) || 0,
          isOutOfStock: (parseFloat(material.quantity) || 0) === 0,
          needToPurchase: false
        };
      }
    }
    
    // Check stock status when quantity changes
    if (field === 'quantity' && newBom[index].materialId !== 'custom') {
      const material = (rawMaterials || []).find(m => m.id === parseInt(newBom[index].materialId));
      if (material) {
        const required = parseFloat(value) || 0;
        const available = parseFloat(material.quantity) || 0;
        newBom[index].isOutOfStock = available < required;
        newBom[index].shortage = Math.max(0, required - available);
      }
    }
    
    setFormData({ ...formData, bom: newBom });
  };

  // Labour Cost Management
  const handleAddLabourCost = () => {
    setFormData({
      ...formData,
      labourCosts: [...formData.labourCosts, {
        labourerId: '',
        labourerName: '',
        workType: '',
        hoursEstimated: '',
        ratePerHour: '',
        cost: ''
      }]
    });
  };

  const handleRemoveLabourCost = (index) => {
    const newLabourCosts = formData.labourCosts.filter((_, i) => i !== index);
    setFormData({ ...formData, labourCosts: newLabourCosts });
  };

  const handleLabourCostChange = (index, field, value) => {
    const newLabourCosts = [...formData.labourCosts];
    newLabourCosts[index] = { ...newLabourCosts[index], [field]: value };
    
    // If labourer is selected, update related fields
    if (field === 'labourerId') {
      const labourer = labourers.find(l => l.id === parseInt(value));
      if (labourer) {
        newLabourCosts[index] = {
          ...newLabourCosts[index],
          labourerName: labourer.name,
          ratePerHour: (parseFloat(labourer.dailyWage) / 8).toFixed(2), // Assuming 8-hour workday
          specialization: labourer.specialization
        };
        // Recalculate cost if hours are set
        if (newLabourCosts[index].hoursEstimated) {
          const hours = parseFloat(newLabourCosts[index].hoursEstimated) || 0;
          const rate = parseFloat(newLabourCosts[index].ratePerHour) || 0;
          newLabourCosts[index].cost = (hours * rate).toFixed(2);
        }
      }
    }
    
    // Recalculate cost when hours or rate changes
    if (field === 'hoursEstimated' || field === 'ratePerHour') {
      const hours = parseFloat(field === 'hoursEstimated' ? value : newLabourCosts[index].hoursEstimated) || 0;
      const rate = parseFloat(field === 'ratePerHour' ? value : newLabourCosts[index].ratePerHour) || 0;
      newLabourCosts[index].cost = (hours * rate).toFixed(2);
    }
    
    setFormData({ ...formData, labourCosts: newLabourCosts });
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

    // Check for materials that need to be purchased
    const materialsNeedingPurchase = formData.bom.filter(item => item.needToPurchase || item.isOutOfStock);
    
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

      // Calculate costs
      const materialCost = calculateBomCost();
      const labourCost = calculateLabourCost();
      const totalProductionCost = (materialCost + labourCost) * quantity;

      const orderData = {
        orderNumber,
        orderType: formData.orderType,
        ...customerData,
        productName: formData.productName.trim(),
        quantity,
        unitPrice,
        totalAmount: unitPrice * quantity,
        materialCost: materialCost * quantity,
        labourCost: labourCost * quantity,
        totalProductionCost,
        bom: formData.bom.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity) || 0,
          totalNeeded: (parseFloat(item.quantity) || 0) * quantity
        })),
        labourCosts: formData.labourCosts.map(item => ({
          ...item,
          totalCost: (parseFloat(item.cost) || 0) * quantity
        })),
        materialsNeedingPurchase: materialsNeedingPurchase.map(item => ({
          materialName: item.materialName,
          quantityNeeded: (parseFloat(item.quantity) || 0) * quantity,
          shortage: (item.shortage || item.quantity) * quantity,
          unit: item.unit,
          purchaseNote: item.purchaseNote,
          estimatedCost: item.estimatedCost
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
      
      // Show warning if materials need to be purchased
      if (materialsNeedingPurchase.length > 0) {
        alert(`Order created successfully!\n\nNote: ${materialsNeedingPurchase.length} material(s) need to be purchased before production can start.`);
      } else {
        alert('Order created successfully!');
      }
      
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
      // Skip custom materials (not in inventory)
      if (bomItem.materialId === 'custom') continue;
      
      // Find matching raw material by ID
      const material = (rawMaterials || []).find(m => m.id === parseInt(bomItem.materialId));
      
      if (material) {
        const toDeduct = bomItem.totalNeeded || (bomItem.quantity * order.quantity);
        const newQuantity = Math.max(0, (parseFloat(material.quantity) || 0) - toDeduct);
        
        const updatedMaterial = {
          ...material,
          quantity: newQuantity
        };
        await actions.updateItem('rawMaterials', updatedMaterial);
      }
    }
  };

  const addToFinishedProducts = async (order, completionData) => {
    const productData = {
      name: order.productName,
      category: 'Finished Product',
      stock: order.quantity,
      sellingPrice: parseFloat(completionData.sellingPrice) || 0,
      productionCost: order.totalProductionCost || 0,
      photo: completionData.productPhotoPreview || null,
      orderNumber: order.orderNumber,
      createdAt: new Date().toISOString()
    };

    await actions.addItem('finishedProducts', productData);
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
      productionCost: order.totalProductionCost || 0,
      profit: (order.totalAmount || 0) - (order.totalProductionCost || 0),
      orderNumber: order.orderNumber,
      deliveryNotes: deliveryData.deliveryNotes,
      createdAt: new Date().toISOString()
    };

    await actions.addItem('sales', saleData);
  };

  // Approval handler
  const handleApprove = async (order) => {
    // Check if all materials are available
    const unavailableMaterials = [];
    for (const bomItem of (order.bom || [])) {
      if (bomItem.materialId === 'custom') continue;
      
      const material = (rawMaterials || []).find(m => m.id === parseInt(bomItem.materialId));
      if (!material) {
        unavailableMaterials.push(`${bomItem.materialName} (not found)`);
      } else {
        const available = parseFloat(material.quantity) || 0;
        const needed = bomItem.totalNeeded || (bomItem.quantity * order.quantity);
        if (available < needed) {
          unavailableMaterials.push(`${bomItem.materialName}: Need ${needed}, Have ${available}`);
        }
      }
    }

    let confirmMessage = 'Approve this order and move to production queue?';
    if (unavailableMaterials.length > 0) {
      confirmMessage = `Warning: Some materials are insufficient:\n${unavailableMaterials.join('\n')}\n\nDo you still want to approve this order?`;
    }

    if (window.confirm(confirmMessage)) {
      await handleStatusUpdate(order, OrderStatuses.APPROVED.value);
      alert('Order approved!');
    }
  };

  // Cancel handler
  const handleCancelOrder = async (order) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      await handleStatusUpdate(order, OrderStatuses.CANCELLED.value);
      alert('Order cancelled.');
    }
  };

  // Start production handler
  const handleStartProduction = async (order) => {
    // Validate materials availability
    let canStart = true;
    let missingMaterials = [];

    for (const bomItem of (order.bom || [])) {
      if (bomItem.materialId === 'custom') {
        if (bomItem.needToPurchase) {
          canStart = false;
          missingMaterials.push(`${bomItem.materialName}: Custom material - needs to be purchased`);
        }
        continue;
      }
      
      const totalNeeded = bomItem.totalNeeded || (bomItem.quantity * order.quantity);
      const material = (rawMaterials || []).find(m => m.id === parseInt(bomItem.materialId));
      
      if (!material) {
        canStart = false;
        missingMaterials.push(`${bomItem.materialName}: Not found in inventory`);
      } else {
        const available = parseFloat(material.quantity) || 0;
        if (available < totalNeeded) {
          canStart = false;
          missingMaterials.push(`${bomItem.materialName}: Need ${totalNeeded}, Have ${available}`);
        }
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

  // Photo upload handler
  const handlePhotoUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'completion') {
          setCompletionData({
            ...completionData,
            productPhoto: file,
            productPhotoPreview: reader.result
          });
        } else if (type === 'delivery') {
          setDeliveryData({
            ...deliveryData,
            deliveryPhoto: file,
            deliveryPhotoPreview: reader.result
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Get order actions based on status
  const getOrderActions = (order) => {
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
      case OrderStatuses.COMPLETED.value:
        if (order.orderType === 'customer') {
          actions.push({ label: 'Ready for Delivery', action: () => handleReadyForDelivery(order), variant: 'default' });
        }
        break;
      case OrderStatuses.READY_FOR_DELIVERY.value:
        actions.push({ label: 'Mark Delivered', action: () => handleReadyForDelivery(order), variant: 'default' });
        break;
    }
    
    return actions;
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusObj = OrderStatuses[Object.keys(OrderStatuses).find(k => OrderStatuses[k].value === status)];
    return statusObj?.color || 'bg-gray-100 text-gray-800';
  };

  // Get status counts
  const getStatusCounts = () => {
    const counts = {
      pendingApproval: 0,
      inProduction: 0,
      readyForDelivery: 0,
      completedThisMonth: 0
    };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    orders.forEach(order => {
      if (order.status === OrderStatuses.PENDING_APPROVAL.value) counts.pendingApproval++;
      if (order.status === OrderStatuses.IN_PRODUCTION.value) counts.inProduction++;
      if (order.status === OrderStatuses.READY_FOR_DELIVERY.value) counts.readyForDelivery++;
      if ((order.status === OrderStatuses.COMPLETED.value || order.status === OrderStatuses.DELIVERED.value) && 
          new Date(order.updatedAt) >= startOfMonth) {
        counts.completedThisMonth++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-gray-500">Manage stock and customer orders with full production workflow</p>
          <p className="text-sm text-blue-600 mt-1">
            * Orders flow: Pending Approval → Approved → In Production → Completed/Delivered
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Pending Approval</div>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pendingApproval}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">In Production</div>
            <div className="text-2xl font-bold text-purple-600">{statusCounts.inProduction}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Ready for Delivery</div>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.readyForDelivery}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Completed This Month</div>
            <div className="text-2xl font-bold text-green-600">{statusCounts.completedThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="stock">Stock Orders</SelectItem>
            <SelectItem value="customer">Customer Orders</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(OrderStatuses).map(status => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleOpenDialog}>
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No orders found. Create your first order to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map(order => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{order.orderNumber}</span>
                      <Badge className={getStatusColor(order.status)}>
                        {OrderStatuses[Object.keys(OrderStatuses).find(k => OrderStatuses[k].value === order.status)]?.label}
                      </Badge>
                      <Badge variant="outline">
                        {order.orderType === 'stock' ? '📦 Stock' : '👤 Customer'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>Product:</strong> {order.productName}</p>
                      <p><strong>Quantity:</strong> {order.quantity}</p>
                      {order.customerName && <p><strong>Customer:</strong> {order.customerName}</p>}
                      {order.materialsNeedingPurchase?.length > 0 && (
                        <p className="text-orange-600 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          {order.materialsNeedingPurchase.length} material(s) need to be purchased
                        </p>
                      )}
                      {order.totalProductionCost > 0 && (
                        <p><strong>Production Cost:</strong> {formatCurrency(order.totalProductionCost)}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Materials: {order.bom?.length || 0} items | 
                      Labour: {order.labourCosts?.length || 0} entries
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewingOrder(order)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {getOrderActions(order).map((action, idx) => (
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
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>
              Create a stock order (for inventory) or customer order (for delivery)
            </DialogDescription>
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
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Stock Order (Build for Inventory)
                    </div>
                  </SelectItem>
                  <SelectItem value="customer">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
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
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Bill of Materials (BOM) *
                </Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={handleAddBomItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    From Inventory
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddCustomMaterial}>
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Custom (To Purchase)
                  </Button>
                </div>
              </div>
              
              {formData.bom.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-4 text-center text-gray-500">
                  No materials added. Add materials from inventory or custom materials to purchase.
                </div>
              ) : (
                <div className="space-y-3 border rounded-lg p-3">
                  {formData.bom.map((item, index) => (
                    <div key={index} className={`p-3 rounded-lg ${item.isOutOfStock ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                      <div className="grid grid-cols-12 gap-2 items-end">
                        {item.materialId === 'custom' ? (
                          // Custom material input
                          <>
                            <div className="col-span-4">
                              <Label className="text-xs">Material Name (Custom)</Label>
                              <Input
                                value={item.materialName}
                                onChange={(e) => handleBomItemChange(index, 'materialName', e.target.value)}
                                placeholder="Enter material name"
                                className="h-9"
                              />
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
                            <div className="col-span-2">
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
                            <div className="col-span-2">
                              <Label className="text-xs">Est. Cost</Label>
                              <Input
                                type="number"
                                min="0"
                                value={item.estimatedCost}
                                onChange={(e) => handleBomItemChange(index, 'estimatedCost', e.target.value)}
                                placeholder="NPR"
                                className="h-9"
                              />
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
                          </>
                        ) : (
                          // Inventory material selection
                          <>
                            <div className="col-span-4">
                              <Label className="text-xs">Select Material</Label>
                              <Select 
                                value={item.materialId?.toString()} 
                                onValueChange={(value) => handleBomItemChange(index, 'materialId', value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select from inventory" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(rawMaterials || []).map(material => {
                                    const qty = parseFloat(material.quantity) || 0;
                                    const isOutOfStock = qty === 0;
                                    const isLowStock = qty > 0 && qty <= (parseFloat(material.minStock) || 0);
                                    return (
                                      <SelectItem key={material.id} value={material.id.toString()}>
                                        <div className="flex items-center gap-2">
                                          {isOutOfStock ? (
                                            <AlertTriangle className="w-3 h-3 text-red-500" />
                                          ) : isLowStock ? (
                                            <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                          ) : (
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                          )}
                                          <span>{material.name}</span>
                                          <span className="text-xs text-gray-400">
                                            ({qty} {material.unit})
                                          </span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Qty Needed</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => handleBomItemChange(index, 'quantity', e.target.value)}
                                className="h-9"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Available</Label>
                              <div className={`h-9 flex items-center px-2 rounded text-sm ${
                                item.availableStock >= (parseFloat(item.quantity) || 0) 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {item.availableStock} {item.unit}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Unit Cost</Label>
                              <div className="h-9 flex items-center px-2 bg-gray-100 rounded text-sm">
                                {formatCurrency(item.pricePerUnit)}
                              </div>
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
                          </>
                        )}
                      </div>
                      
                      {/* Stock warning */}
                      {item.isOutOfStock && item.materialId !== 'custom' && (
                        <div className="mt-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600">
                            Insufficient stock! Shortage: {item.shortage || item.quantity} {item.unit}
                          </span>
                          <label className="flex items-center gap-1 ml-4">
                            <input
                              type="checkbox"
                              checked={item.needToPurchase}
                              onChange={(e) => handleBomItemChange(index, 'needToPurchase', e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-sm">Mark for purchase</span>
                          </label>
                        </div>
                      )}
                      
                      {/* Purchase note for out of stock items */}
                      {(item.needToPurchase || item.materialId === 'custom') && (
                        <div className="mt-2">
                          <Input
                            value={item.purchaseNote}
                            onChange={(e) => handleBomItemChange(index, 'purchaseNote', e.target.value)}
                            placeholder="Purchase note (e.g., supplier, urgency)"
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* BOM Cost Summary */}
                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estimated Material Cost (per unit):</span>
                    <span className="font-bold">{formatCurrency(calculateBomCost())}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Labour Costs */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Labour Costs
                </Label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddLabourCost}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Labour
                </Button>
              </div>
              
              {formData.labourCosts.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-4 text-center text-gray-500">
                  No labour costs added. Click "Add Labour" to assign workers.
                </div>
              ) : (
                <div className="space-y-3 border rounded-lg p-3">
                  {formData.labourCosts.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-3 rounded-lg">
                      <div className="col-span-3">
                        <Label className="text-xs">Select Worker</Label>
                        <Select 
                          value={item.labourerId?.toString()} 
                          onValueChange={(value) => handleLabourCostChange(index, 'labourerId', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select worker" />
                          </SelectTrigger>
                          <SelectContent>
                            {labourers.map(labourer => (
                              <SelectItem key={labourer.id} value={labourer.id.toString()}>
                                {labourer.name} ({labourer.specialization})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Work Type</Label>
                        <Input
                          value={item.workType}
                          onChange={(e) => handleLabourCostChange(index, 'workType', e.target.value)}
                          placeholder="e.g., Assembly"
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Hours Est.</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.hoursEstimated}
                          onChange={(e) => handleLabourCostChange(index, 'hoursEstimated', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Rate/Hour</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.ratePerHour}
                          onChange={(e) => handleLabourCostChange(index, 'ratePerHour', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Total Cost</Label>
                        <div className="h-9 flex items-center px-2 bg-blue-100 rounded text-sm font-medium">
                          {formatCurrency(parseFloat(item.cost) || 0)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          className="h-9 w-9 p-0 text-red-500"
                          onClick={() => handleRemoveLabourCost(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Labour Cost Summary */}
                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Labour Cost (per unit):</span>
                    <span className="font-bold">{formatCurrency(calculateLabourCost())}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Total Cost Summary */}
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Material Cost (per unit):</span>
                    <span>{formatCurrency(calculateBomCost())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Labour Cost (per unit):</span>
                    <span>{formatCurrency(calculateLabourCost())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span>× {formData.quantity || 1}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Production Cost:</span>
                    <span>{formatCurrency(calculateTotalCost())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                <div>
                  <Label className="text-gray-500">Product</Label>
                  <p className="font-medium">{viewingOrder.productName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Quantity</Label>
                  <p className="font-medium">{viewingOrder.quantity}</p>
                </div>
                {viewingOrder.customerName && (
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
                {viewingOrder.totalProductionCost > 0 && (
                  <>
                    <div>
                      <Label className="text-gray-500">Material Cost</Label>
                      <p className="font-medium">{formatCurrency(viewingOrder.materialCost || 0)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Labour Cost</Label>
                      <p className="font-medium">{formatCurrency(viewingOrder.labourCost || 0)}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-500">Total Production Cost</Label>
                      <p className="font-bold text-lg">{formatCurrency(viewingOrder.totalProductionCost)}</p>
                    </div>
                  </>
                )}
              </div>

              {/* BOM Details */}
              {viewingOrder.bom && viewingOrder.bom.length > 0 && (
                <div>
                  <Label className="text-gray-500">Bill of Materials</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Material</th>
                          <th className="px-3 py-2 text-right">Qty/Unit</th>
                          <th className="px-3 py-2 text-right">Total Needed</th>
                          <th className="px-3 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingOrder.bom.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">{item.materialName}</td>
                            <td className="px-3 py-2 text-right">{item.quantity} {item.unit}</td>
                            <td className="px-3 py-2 text-right">{item.totalNeeded} {item.unit}</td>
                            <td className="px-3 py-2 text-center">
                              {item.needToPurchase || item.materialId === 'custom' ? (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700">To Purchase</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700">In Stock</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Labour Details */}
              {viewingOrder.labourCosts && viewingOrder.labourCosts.length > 0 && (
                <div>
                  <Label className="text-gray-500">Labour Costs</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Worker</th>
                          <th className="px-3 py-2 text-left">Work Type</th>
                          <th className="px-3 py-2 text-right">Hours</th>
                          <th className="px-3 py-2 text-right">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingOrder.labourCosts.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">{item.labourerName}</td>
                            <td className="px-3 py-2">{item.workType}</td>
                            <td className="px-3 py-2 text-right">{item.hoursEstimated}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.totalCost || item.cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Materials Needing Purchase */}
              {viewingOrder.materialsNeedingPurchase && viewingOrder.materialsNeedingPurchase.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <Label className="text-orange-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Materials Needing Purchase
                  </Label>
                  <ul className="mt-2 space-y-1 text-sm">
                    {viewingOrder.materialsNeedingPurchase.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{item.materialName}</span>
                        <span>{item.shortage} {item.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Status History */}
              {viewingOrder.statusHistory && viewingOrder.statusHistory.length > 0 && (
                <div>
                  <Label className="text-gray-500">Status History</Label>
                  <div className="mt-2 space-y-2">
                    {viewingOrder.statusHistory.map((history, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Badge className={getStatusColor(history.status)} variant="outline">
                          {OrderStatuses[Object.keys(OrderStatuses).find(k => OrderStatuses[k].value === history.status)]?.label}
                        </Badge>
                        <span className="text-gray-500">{formatDate(history.timestamp)}</span>
                        {history.note && <span className="text-gray-400">- {history.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingOrder.notes && (
                <div>
                  <Label className="text-gray-500">Notes</Label>
                  <p className="text-sm">{viewingOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Production Dialog */}
      <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Production</DialogTitle>
            <DialogDescription>
              Add product photo and set selling price for inventory
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompletionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompletionSubmit}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Dialog */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
            <DialogDescription>
              Record delivery details for this order
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Delivery Date *</Label>
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
              <Label>Delivery Photo</Label>
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
