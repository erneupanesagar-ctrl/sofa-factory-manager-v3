import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Search, Factory, CheckCircle, XCircle, Clock, AlertTriangle, Package } from 'lucide-react';
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
    sofaModelId: null,
    quantity: '',
    notes: ''
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
  const validateMaterials = (sofaModelId, quantity) => {
    const product = sofaModels.find(p => p.id === parseInt(sofaModelId));
    if (!product || !product.billOfMaterials || product.billOfMaterials.length === 0) {
      return { valid: false, message: 'Product has no Bill of Materials defined', materials: [] };
    }

    const validation = {
      valid: true,
      message: '',
      materials: []
    };

    product.billOfMaterials.forEach(bomItem => {
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
    setFormData({ ...formData, sofaModelId });
    if (sofaModelId && formData.quantity) {
      const validation = validateMaterials(sofaModelId, formData.quantity);
      setMaterialValidation(validation);
    }
  };

  const handleQuantityChange = (quantity) => {
    setFormData({ ...formData, quantity });
    if (formData.sofaModelId && quantity) {
      const validation = validateMaterials(formData.sofaModelId, quantity);
      setMaterialValidation(validation);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      productionType: 'stock',
      orderId: null,
      sofaModelId: null,
      quantity: '',
      notes: ''
    });
    setMaterialValidation(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      productionType: 'stock',
      orderId: null,
      sofaModelId: null,
      quantity: '',
      notes: ''
    });
    setMaterialValidation(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sofaModelId || !formData.quantity) {
      alert('Please select product and enter quantity');
      return;
    }

    // Validate materials
    const validation = validateMaterials(formData.sofaModelId, formData.quantity);
    if (!validation.valid) {
      alert('Cannot start production: ' + validation.message + '\n\nPlease purchase more materials first.');
      return;
    }

    try {
      const product = sofaModels.find(p => p.id === parseInt(formData.sofaModelId));
      const productionNumber = `PROD-${Date.now().toString().slice(-6)}`;
      
      const productionData = {
        productionNumber,
        productionType: formData.productionType,
        orderId: formData.orderId ? parseInt(formData.orderId) : null,
        sofaModelId: parseInt(formData.sofaModelId),
        productName: product.name,
        quantity: parseInt(formData.quantity),
        billOfMaterials: product.billOfMaterials || [],
        materialsNeeded: validation.materials,
        status: 'in_progress',
        startDate: new Date().toISOString(),
        estimatedCompletionDate: new Date(Date.now() + (product.estimatedDays || 7) * 24 * 60 * 60 * 1000).toISOString(),
        actualCompletionDate: null,
        notes: formData.notes,
        createdAt: new Date().toISOString()
      };

      await actions.addItem('productions', productionData);
      
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
    if (!window.confirm(`Complete production ${production.productionNumber}?\n\nThis will:\n- Deduct materials from inventory\n- Add ${production.quantity} units to stock`)) {
      return;
    }

    try {
      // Deduct materials from raw materials
      for (const material of production.materialsNeeded) {
        const rawMaterial = rawMaterials.find(rm => rm.id === parseInt(material.materialId));
        if (rawMaterial) {
          const newQuantity = rawMaterial.quantity - material.requiredQty;
          await actions.updateItem('rawMaterials', {
            ...rawMaterial,
            quantity: newQuantity
          });
        }
      }

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

      // Update order status if linked
      if (production.orderId) {
        const order = orders.find(o => o.id === production.orderId);
        if (order) {
          await actions.updateItem('orders', {
            ...order,
            status: 'completed'
          });
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
      
      alert('Production completed successfully!\n\nMaterials deducted and stock updated.');
    } catch (error) {
      console.error('Error completing production:', error);
      alert('Failed to complete production. Please try again.');
    }
  };

  const handleCancelProduction = async (production) => {
    if (!window.confirm(`Cancel production ${production.productionNumber}?`)) {
      return;
    }

    try {
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

              {/* Product Selection */}
              <div className="space-y-2">
                <Label>
                  Select Product <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sofaModelId?.toString() || ''}
                  onValueChange={handleProductChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sofaModels.map(product => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} (Stock: {product.stockQuantity || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {/* Material Validation */}
              {materialValidation && (
                <div className={`p-4 rounded-lg border-2 ${materialValidation.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    {materialValidation.valid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <h4 className={`font-semibold ${materialValidation.valid ? 'text-green-900' : 'text-red-900'}`}>
                      {materialValidation.message}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {materialValidation.materials.map((material, index) => (
                      <div key={index} className={`p-3 rounded-lg ${material.isAvailable ? 'bg-white border border-green-200' : 'bg-red-100 border border-red-300'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{material.materialName}</p>
                            <p className="text-sm text-gray-600">
                              Need: {material.requiredQty} {material.unit} | 
                              Available: {material.availableQty} {material.unit}
                            </p>
                          </div>
                          {material.isAvailable ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="text-right">
                              <XCircle className="w-5 h-5 text-red-600 mb-1" />
                              <p className="text-xs text-red-600 font-semibold">
                                Short: {material.shortage} {material.unit}
                              </p>
                            </div>
                          )}
                        </div>
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
