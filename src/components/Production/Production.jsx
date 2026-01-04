import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Search, Factory, CheckCircle, XCircle, Clock, AlertTriangle, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '../../lib/utils';
import { sendProductionStarted, sendProductionCompleted } from '../../lib/notificationService';

export default function Production() {
  const { state, actions } = useApp();
  const { productions = [], sofaModels, rawMaterials, orders } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingProduction, setViewingProduction] = useState(null);
  const [formData, setFormData] = useState({
    productionType: 'stock', // 'stock' or 'order'
    orderId: null,
    productName: '',
    quantity: '',
    notes: '',
    billOfMaterials: []
  });
  const [materialValidation, setMaterialValidation] = useState(null);

  const filteredProductions = productions.filter(prod => {
    const product = sofaModels.find(p => p.id === prod.sofaModelId);
    const searchLower = searchTerm.toLowerCase();
    return (
      product?.name.toLowerCase().includes(searchLower) ||
      prod.status?.toLowerCase().includes(searchLower) ||
      prod.productionNumber?.toLowerCase().includes(searchLower)
    );
  });

  const activeProductions = filteredProductions.filter(p => 
    p.status === 'in_progress' || p.status === 'pending'
  );
  
  const completedProductions = filteredProductions.filter(p => 
    p.status === 'completed'
  );

  // Validate materials for production
  const validateMaterials = (bom, quantity) => {
    if (!bom || bom.length === 0) {
      return { valid: false, message: 'No Bill of Materials defined', materials: [] };
    }

    const validation = {
      valid: true,
      message: '',
      materials: []
    };

    bom.forEach(bomItem => {
      const rawMaterial = rawMaterials.find(rm => rm.id === parseInt(bomItem.materialId));
      const requiredQty = parseFloat(bomItem.quantity) * parseInt(quantity);
      const availableQty = rawMaterial?.quantity || 0;
      const isAvailable = availableQty >= requiredQty;

      if (!isAvailable) {
        validation.valid = false;
      }

      validation.materials.push({
        materialId: bomItem.materialId,
        materialName: bomItem.materialName || rawMaterial?.name || 'Unknown',
        unit: bomItem.unit || rawMaterial?.unit || '',
        requiredQty,
        availableQty,
        shortage: isAvailable ? 0 : requiredQty - availableQty,
        isAvailable
      });
    });

    if (!validation.valid) {
      validation.message = 'Insufficient materials for production';
    } else {
      validation.message = 'All materials available';
    }

    return validation;
  };

  // Handle product selection and validate materials
  const handleProductChange = (sofaModelId) => {
    const numericId = parseInt(sofaModelId);
    const product = sofaModels.find(p => p.id === numericId);
    const bom = product?.billOfMaterials || [];
    
    setFormData({ 
      ...formData, 
      productName: product?.name || '',
      billOfMaterials: bom
    });
    
    if (bom.length > 0 && formData.quantity) {
      const validation = validateMaterials(bom, formData.quantity);
      setMaterialValidation(validation);
    }
  };

  const calculateMaterialCostFromBOM = () => {
    if (formData.billOfMaterials && formData.billOfMaterials.length > 0) {
      return formData.billOfMaterials.reduce((sum, item) => {
        const rawMaterial = rawMaterials.find(rm => rm.id === parseInt(item.materialId));
        const unitPrice = rawMaterial?.unitPrice || rawMaterial?.pricePerUnit || 0;
        const qty = parseFloat(item.quantity) || 0;
        return sum + (unitPrice * qty);
      }, 0);
    }
    return 0;
  };

  const handleQuantityChange = (quantity) => {
    setFormData({ ...formData, quantity });
    if (formData.billOfMaterials.length > 0 && quantity) {
      const validation = validateMaterials(formData.billOfMaterials, quantity);
      setMaterialValidation(validation);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      productionType: 'stock',
      orderId: null,
      productName: '',
      quantity: '',
      notes: '',
      billOfMaterials: []
    });
    setMaterialValidation(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      productionType: 'stock',
      orderId: null,
      productName: '',
      quantity: '',
      notes: '',
      billOfMaterials: []
    });
    setMaterialValidation(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.productName || !formData.quantity) {
      alert('Please enter product name and quantity');
      return;
    }

    // Validate materials
    const validation = validateMaterials(formData.billOfMaterials, formData.quantity);
    if (!validation.valid) {
      alert('Cannot start production: ' + validation.message + '\n\nPlease purchase more materials first.');
      return;
    }

    try {
      // Find existing product or create a new one if it doesn't exist
      let product = sofaModels.find(p => p.name.toLowerCase() === formData.productName.toLowerCase());
      
      if (!product) {
        const newProductId = await actions.addItem('sofaModels', {
          name: formData.productName,
          description: 'Auto-created from production',
          stockQuantity: 0,
          billOfMaterials: formData.billOfMaterials,
          materialCost: calculateMaterialCostFromBOM(),
          sellingPrice: 0,
          laborCost: 0,
          status: 'active',
          images: []
        });
        product = { id: newProductId, name: formData.productName };
      } else {
        // Update existing product's BOM if changed
        if (JSON.stringify(product.billOfMaterials) !== JSON.stringify(formData.billOfMaterials)) {
          await actions.updateItem('sofaModels', {
            ...product,
            billOfMaterials: formData.billOfMaterials,
            materialCost: calculateMaterialCostFromBOM()
          });
        }
      }

      const productionNumber = `PROD-${Date.now().toString().slice(-6)}`;
      const productionData = {
        productionNumber,
        productionType: formData.productionType,
        orderId: formData.orderId ? parseInt(formData.orderId) : null,
        sofaModelId: product.id,
        productName: product.name,
        quantity: parseInt(formData.quantity),
        billOfMaterials: formData.billOfMaterials,
        materialsNeeded: validation.materials,
        status: 'in_progress',
        startDate: new Date().toISOString(),
        estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        actualCompletionDate: null,
        notes: formData.notes,
        createdAt: new Date().toISOString()
      };

      await actions.addItem('productions', productionData);

      // AUTOMATION: Deduct materials from inventory immediately when production starts
      for (const material of validation.materials) {
        const rawMaterial = rawMaterials.find(rm => rm.id === parseInt(material.materialId));
        if (rawMaterial) {
          const newQuantity = rawMaterial.quantity - material.requiredQty;
          await actions.updateItem('rawMaterials', {
            ...rawMaterial,
            quantity: newQuantity
          });
        }
      }
      
      // Send production started notification if linked to order
      if (productionData.orderId) {
        try {
          const order = orders.find(o => o.id === productionData.orderId);
          if (order) {
            const customer = state.customers?.find(c => c.id === order.customerId);
            if (customer) {
              await sendProductionStarted(actions, productionData, order, customer);
            }
          }
        } catch (error) {
          console.error('Error sending production started notification:', error);
        }
      }
      
      // Update order status if linked
      if (formData.orderId) {
        const order = orders.find(o => o.id === parseInt(formData.orderId));
        if (order) {
          await actions.updateItem('orders', {
            ...order,
            status: 'in_production',
            productionId: productionData.id
          });
        }
      }

      alert('Production started successfully!');
      handleCloseDialog();
    } catch (error) {
      console.error('Error starting production:', error);
      alert('Failed to start production. Please try again.');
    }
  };

  const handleCompleteProduction = async (production) => {
    if (!window.confirm(`Complete production ${production.productionNumber}?\n\nThis will:\n- Add ${production.quantity} units to stock\n- Automatically update sales (if linked to order)`)) {
      return;
    }

    try {
      // Add to finished products stock
      const product = sofaModels.find(p => p.id === production.sofaModelId);
      if (product) {
        const newStockQuantity = (product.stockQuantity || 0) + production.quantity;
        await actions.updateItem('sofaModels', {
          ...product,
          stockQuantity: newStockQuantity
        });
      }

      // Update production status
      await actions.updateItem('productions', {
        ...production,
        status: 'completed',
        actualCompletionDate: new Date().toISOString()
      });

      // AUTOMATION: Update order status and AUTO-GENERATE SALE if linked to order
      if (production.orderId) {
        const order = orders.find(o => o.id === production.orderId);
        if (order) {
          // Update order status
          await actions.updateItem('orders', {
            ...order,
            status: 'completed'
          });

          // AUTO-GENERATE SALE RECORD
          const customer = state.customers?.find(c => c.id === order.customerId);
          if (customer && product) {
            const saleData = {
              saleNumber: `SALE-${Date.now().toString().slice(-6)}`,
              customerId: customer.id,
              customerName: customer.name,
              productId: product.id,
              productName: product.name,
              quantity: production.quantity,
              unitPrice: product.sellingPrice || 0,
              totalAmount: (product.sellingPrice || 0) * production.quantity,
              paidAmount: 0, // Initial paid amount for auto-generated sale
              paymentStatus: 'pending',
              status: 'approved', // Auto-approved since production is complete
              approvalStatus: 'approved',
              orderId: order.id,
              notes: `Auto-generated from Production #${production.productionNumber}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await actions.addItem('sales', saleData);
          }
        }
      }

      // Send production completed notification if linked to order
      if (production.orderId) {
        try {
          const order = orders.find(o => o.id === production.orderId);
          if (order) {
            const customer = state.customers?.find(c => c.id === order.customerId);
            if (customer) {
              await sendProductionCompleted(actions, production, order, customer);
            }
          }
        } catch (error) {
          console.error('Error sending production completed notification:', error);
        }
      }
      
      alert('Production completed successfully!\n\nStock updated and sale record generated (if applicable).');
    } catch (error) {
      console.error('Error completing production:', error);
      alert('Failed to complete production. Please try again.');
    }
  };

  const handleCancelProduction = async (production) => {
    if (!window.confirm(`Cancel production ${production.productionNumber}?\n\nThis will restore deducted materials to inventory.`)) {
      return;
    }

    try {
      // AUTOMATION: Restore materials to inventory when production is cancelled
      if (production.materialsNeeded) {
        for (const material of production.materialsNeeded) {
          const rawMaterial = rawMaterials.find(rm => rm.id === parseInt(material.materialId));
          if (rawMaterial) {
            const newQuantity = rawMaterial.quantity + material.requiredQty;
            await actions.updateItem('rawMaterials', {
              ...rawMaterial,
              quantity: newQuantity
            });
          }
        }
      }

      await actions.updateItem('productions', {
        ...production,
        status: 'cancelled'
      });

      // Update order status if linked
      if (production.orderId) {
        const order = orders.find(o => o.id === production.orderId);
        if (order) {
          await actions.updateItem('orders', {
            ...order,
            status: 'pending'
          });
        }
      }

      alert('Production cancelled');
    } catch (error) {
      console.error('Error cancelling production:', error);
      alert('Failed to cancel production. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
      in_progress: { variant: 'default', icon: Factory, label: 'In Progress' },
      completed: { variant: 'success', icon: CheckCircle, label: 'Completed' },
      cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelled' }
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Production Management</h1>
        <p className="text-gray-600 mt-1">Manage production jobs and track material usage</p>
        <p className="text-xs text-blue-600 mt-1 font-medium italic">
          * Starting production automatically deducts raw materials. Completing production automatically updates stock and generates sales records.
        </p>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search productions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleOpenDialog} className="whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" />
          New Production
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Productions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProductions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProductions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Units Produced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedProductions.reduce((sum, p) => sum + (p.quantity || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Productions */}
      {activeProductions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Active Productions</h2>
          <div className="grid grid-cols-1 gap-4">
            {activeProductions.map((production) => {
              const product = sofaModels.find(p => p.id === production.sofaModelId);
              return (
                <Card key={production.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{production.productionNumber}</h3>
                          {getStatusBadge(production.status)}
                          {production.productionType === 'stock' && (
                            <Badge variant="outline">Stock Production</Badge>
                          )}
                        </div>
                        <p className="text-gray-600">
                          {product?.name} × {production.quantity} units
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Started</p>
                        <p className="font-semibold">
                          {new Date(production.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Est. Completion</p>
                        <p className="font-semibold">
                          {new Date(production.estimatedCompletionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Materials</p>
                        <p className="font-semibold">{production.materialsNeeded?.length || 0} items</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Type</p>
                        <p className="font-semibold capitalize">{production.productionType}</p>
                      </div>
                    </div>

                    {production.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{production.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCompleteProduction(production)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete Production
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingProduction(production)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelProduction(production)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Productions */}
      {completedProductions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Completed Productions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedProductions.map((production) => {
              const product = sofaModels.find(p => p.id === production.sofaModelId);
              return (
                <Card key={production.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{production.productionNumber}</h3>
                        <p className="text-sm text-gray-600">
                          {product?.name} × {production.quantity} units
                        </p>
                      </div>
                      {getStatusBadge(production.status)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Completed: {new Date(production.actualCompletionDate).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProductions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Factory className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No productions found' : 'No productions yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Start your first production job'}
            </p>
            {!searchTerm && (
              <Button onClick={handleOpenDialog}>
                <Plus className="w-4 h-4 mr-2" />
                New Production
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* New Production Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Production</DialogTitle>
            <DialogDescription>
              Start a new production job. Materials will be validated before starting.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Production Type */}
              <div className="space-y-2">
                <Label>Production Type</Label>
                <Select
                  value={formData.productionType}
                  onValueChange={(value) => setFormData({ ...formData, productionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock Production (Build Inventory)</SelectItem>
                    <SelectItem value="order">Order Production (For Customer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Order Selection (if order type) */}
              {formData.productionType === 'order' && (
                <div className="space-y-2">
                  <Label>Select Order</Label>
                  <Select
                    value={formData.orderId?.toString() || ''}
                    onValueChange={(value) => setFormData({ ...formData, orderId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an order..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.filter(o => o.status === 'pending').map(order => (
                        <SelectItem key={order.id} value={order.id.toString()}>
                          Order #{order.orderNumber} - {order.customerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Product Name Input */}
              <div className="space-y-2">
                <Label htmlFor="productName">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => {
                      const name = e.target.value;
                      const existingProduct = sofaModels.find(p => p.name.toLowerCase() === name.toLowerCase());
                      if (existingProduct) {
                        handleProductChange(existingProduct.id);
                      } else {
                        setFormData({ ...formData, productName: name });
                      }
                    }}
                    placeholder="Enter product name (e.g., L-Shape Sofa)"
                    required
                  />
                  {sofaModels.length > 0 && formData.productName && !sofaModels.find(p => p.name.toLowerCase() === formData.productName.toLowerCase()) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {sofaModels
                        .filter(p => p.name.toLowerCase().includes(formData.productName.toLowerCase()))
                        .map(p => (
                          <div
                            key={p.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => handleProductChange(p.id)}
                          >
                            {p.name} (Existing Product)
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder="Enter quantity to produce"
                  required
                />
              </div>

              {/* Bill of Materials Section */}
              <div className="space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Bill of Materials (BOM)</Label>
                    <p className="text-xs text-gray-500 mt-1">Adjust materials needed for this production</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        billOfMaterials: [
                          ...formData.billOfMaterials,
                          {
                            id: Date.now(),
                            materialId: '',
                            materialName: '',
                            quantity: '',
                            unit: '',
                            costPerUnit: 0,
                            totalCost: 0
                          }
                        ]
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Material
                  </Button>
                </div>

                {formData.billOfMaterials.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No materials added yet. Click "Add Material" to build the BOM.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.billOfMaterials.map((material, index) => {
                      const rawMaterial = rawMaterials.find(rm => rm.id === parseInt(material.materialId));
                      const totalCost = (parseFloat(material.quantity) || 0) * (rawMaterial?.costPerUnit || 0);
                      
                      return (
                        <div key={material.id} className="p-3 bg-white border rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div className="md:col-span-2">
                              <Label className="text-xs">Material</Label>
                              <select
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                value={material.materialId}
                                onChange={(e) => {
                                  const selectedMaterial = rawMaterials.find(rm => rm.id === parseInt(e.target.value));
                                  const newBOM = [...formData.billOfMaterials];
                                  newBOM[index] = {
                                    ...newBOM[index],
                                    materialId: e.target.value,
                                    materialName: selectedMaterial?.name || '',
                                    unit: selectedMaterial?.unit || '',
                                    costPerUnit: selectedMaterial?.costPerUnit || 0
                                  };
                                  setFormData({ ...formData, billOfMaterials: newBOM });
                                }}
                              >
                                <option value="">Select material...</option>
                                {rawMaterials.map(rm => (
                                  <option key={rm.id} value={rm.id}>
                                    {rm.name} (NPR {rm.costPerUnit}/{rm.unit})
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <Label className="text-xs">Quantity</Label>
                              <Input
                                type="number"
                                step="0.01"
                                className="mt-1"
                                value={material.quantity}
                                onChange={(e) => {
                                  const newBOM = [...formData.billOfMaterials];
                                  newBOM[index] = {
                                    ...newBOM[index],
                                    quantity: e.target.value,
                                    totalCost: (parseFloat(e.target.value) || 0) * (rawMaterial?.costPerUnit || 0)
                                  };
                                  setFormData({ ...formData, billOfMaterials: newBOM });
                                  
                                  // Re-validate materials when BOM quantity changes
                                  if (formData.sofaModelId) {
                                    const validation = validateMaterials(formData.sofaModelId, formData.quantity);
                                    setMaterialValidation(validation);
                                  }
                                }}
                                placeholder="0"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Unit</Label>
                              <Input
                                type="text"
                                className="mt-1 bg-gray-100"
                                value={material.unit}
                                readOnly
                                placeholder="-"
                              />
                            </div>
                            
                            <div className="flex items-end gap-2">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const newBOM = formData.billOfMaterials.filter((_, i) => i !== index);
                                  setFormData({
                                    ...formData,
                                    billOfMaterials: newBOM
                                  });
                                  // Re-validate
                                  if (newBOM.length > 0 && formData.quantity) {
                                    const validation = validateMaterials(newBOM, formData.quantity);
                                    setMaterialValidation(validation);
                                  } else {
                                    setMaterialValidation(null);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-900">Total Material Cost (per unit)</span>
                        <span className="text-lg font-bold text-blue-900">
                          {formatCurrency(calculateMaterialCostFromBOM())}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Material Validation */}
              {materialValidation && (
                <div className={`p-4 rounded-lg ${materialValidation.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {materialValidation.valid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${materialValidation.valid ? 'text-green-800' : 'text-red-800'}`}>
                      {materialValidation.message}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {materialValidation.materials.map((m, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{m.materialName}</span>
                        <span className={m.isAvailable ? 'text-green-700' : 'text-red-700 font-bold'}>
                          {m.requiredQty} {m.unit} (Available: {m.availableQty})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any production notes..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!materialValidation?.valid}
                className={!materialValidation?.valid ? 'opacity-50 cursor-not-allowed' : ''}
              >
                Start Production
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Production Details Dialog */}
      {viewingProduction && (
        <Dialog open={!!viewingProduction} onOpenChange={() => setViewingProduction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Production Details - {viewingProduction.productionNumber}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-semibold">{viewingProduction.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p className="font-semibold">{viewingProduction.quantity} units</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(viewingProduction.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-semibold capitalize">{viewingProduction.productionType}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Materials Needed</h4>
                <div className="space-y-2">
                  {viewingProduction.materialsNeeded?.map((material, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between">
                        <span>{material.materialName}</span>
                        <span className="font-semibold">
                          {material.requiredQty} {material.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {viewingProduction.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-gray-700">{viewingProduction.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setViewingProduction(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
