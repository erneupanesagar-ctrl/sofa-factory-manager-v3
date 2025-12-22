import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Search, Eye, Edit, Trash2, DollarSign, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Purchases() {
  const { state, actions } = useApp();
  const { purchases = [], suppliers = [], rawMaterials = [] } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    materialId: '',
    quantity: '',
    pricePerUnit: '',
    totalAmount: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    notes: ''
  });

  const filteredPurchases = purchases.filter(purchase =>
    (purchase.supplierName && purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (purchase.materialName && purchase.materialName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (purchase.paymentMethod && purchase.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Partial': return 'warning';
      case 'Unpaid': return 'destructive';
      default: return 'default';
    }
  };

  const handleOpenDialog = (purchase = null) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setFormData({
        date: purchase.date,
        supplierId: purchase.supplierId?.toString() || '',
        materialId: purchase.materialId?.toString() || '',
        quantity: purchase.quantity?.toString() || '',
        pricePerUnit: purchase.pricePerUnit?.toString() || '',
        totalAmount: purchase.totalAmount?.toString() || '',
        paymentMethod: purchase.paymentMethod || 'Cash',
        paymentStatus: purchase.paymentStatus || 'Paid',
        notes: purchase.notes || ''
      });
    } else {
      setEditingPurchase(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        supplierId: '',
        materialId: '',
        quantity: '',
        pricePerUnit: '',
        totalAmount: '',
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        notes: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPurchase(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      materialId: '',
      quantity: '',
      pricePerUnit: '',
      totalAmount: '',
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      notes: ''
    });
  };

  const handleMaterialChange = (materialId) => {
    setFormData({ ...formData, materialId });
    
    // Auto-fill price if material exists
    const material = rawMaterials.find(m => m.id === parseInt(materialId));
    if (material && material.pricePerUnit) {
      setFormData(prev => ({
        ...prev,
        materialId,
        pricePerUnit: material.pricePerUnit.toString()
      }));
      
      // Recalculate total if quantity exists
      if (formData.quantity) {
        const total = parseFloat(formData.quantity) * material.pricePerUnit;
        setFormData(prev => ({
          ...prev,
          materialId,
          pricePerUnit: material.pricePerUnit.toString(),
          totalAmount: total.toString()
        }));
      }
    }
  };

  const handleQuantityOrPriceChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate total amount
    const quantity = field === 'quantity' ? parseFloat(value) : parseFloat(formData.quantity);
    const price = field === 'pricePerUnit' ? parseFloat(value) : parseFloat(formData.pricePerUnit);
    
    if (!isNaN(quantity) && !isNaN(price)) {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        totalAmount: (quantity * price).toString()
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplierId || !formData.materialId || !formData.quantity || !formData.pricePerUnit) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const supplier = suppliers.find(s => s.id === parseInt(formData.supplierId));
      const material = rawMaterials.find(m => m.id === parseInt(formData.materialId));
      
      if (!supplier || !material) {
        alert('Invalid supplier or material selected');
        return;
      }

      const purchaseData = {
        date: formData.date,
        supplierId: parseInt(formData.supplierId),
        supplierName: supplier.name,
        materialId: parseInt(formData.materialId),
        materialName: material.name,
        quantity: parseFloat(formData.quantity),
        unit: material.unit,
        pricePerUnit: parseFloat(formData.pricePerUnit),
        totalAmount: parseFloat(formData.totalAmount),
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes,
        createdAt: editingPurchase?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingPurchase) {
        // Update purchase
        await actions.updateItem('purchases', { ...purchaseData, id: editingPurchase.id });
        
        // Update material quantity (calculate difference)
        const quantityDiff = parseFloat(formData.quantity) - editingPurchase.quantity;
        const updatedMaterial = {
          ...material,
          quantity: material.quantity + quantityDiff,
          pricePerUnit: parseFloat(formData.pricePerUnit) // Update price
        };
        await actions.updateItem('rawMaterials', updatedMaterial);
        
        alert('Purchase updated successfully!');
      } else {
        // Add new purchase
        await actions.addItem('purchases', purchaseData);
        
        // Update material quantity
        const updatedMaterial = {
          ...material,
          quantity: material.quantity + parseFloat(formData.quantity),
          pricePerUnit: parseFloat(formData.pricePerUnit) // Update price
        };
        await actions.updateItem('rawMaterials', updatedMaterial);
        
        alert('Purchase added successfully! Material inventory updated.');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Failed to save purchase. Please try again.');
    }
  };

  const handleDelete = async (purchase) => {
    if (!window.confirm(`Are you sure you want to delete this purchase?`)) {
      return;
    }

    try {
      // Revert material quantity
      const material = rawMaterials.find(m => m.id === purchase.materialId);
      if (material) {
        const updatedMaterial = {
          ...material,
          quantity: material.quantity - purchase.quantity
        };
        await actions.updateItem('rawMaterials', updatedMaterial);
      }
      
      await actions.deleteItem('purchases', purchase.id);
      alert('Purchase deleted successfully! Material inventory reverted.');
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Failed to delete purchase. Please try again.');
    }
  };

  const handleViewPurchase = (purchase) => {
    setViewingPurchase(purchase);
    setIsViewDialogOpen(true);
  };

  const totalPurchases = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const pendingPayments = purchases.filter(p => p.paymentStatus === 'Unpaid' || p.paymentStatus === 'Partial').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Purchases</h1>
        <p className="text-gray-600 mt-1">Track purchase orders and manage inventory</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Purchases</CardDescription>
            <CardTitle className="text-2xl">{purchases.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Amount</CardDescription>
            <CardTitle className="text-2xl">NPR {totalPurchases.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Payments</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{pendingPayments}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search purchases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" />
          New Purchase
        </Button>
      </div>

      {/* Purchases Table */}
      {filteredPurchases.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map(purchase => (
                  <TableRow key={purchase.id}>
                    <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                    <TableCell>{purchase.supplierName}</TableCell>
                    <TableCell>{purchase.materialName}</TableCell>
                    <TableCell>{purchase.quantity} {purchase.unit}</TableCell>
                    <TableCell className="font-medium">NPR {purchase.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(purchase.paymentStatus)}>
                        {purchase.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewPurchase(purchase)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(purchase)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(purchase)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No purchases found' : 'No purchases yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Record your first purchase to get started'}
            </p>
            {!searchTerm && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                New Purchase
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Purchase Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPurchase ? 'Edit Purchase' : 'New Purchase'}
            </DialogTitle>
            <DialogDescription>
              {editingPurchase 
                ? 'Update purchase details below' 
                : 'Record a new purchase and update inventory'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">
                    Supplier <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">
                  Raw Material <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.materialId}
                  onValueChange={handleMaterialChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawMaterials.map(material => (
                      <SelectItem key={material.id} value={material.id.toString()}>
                        {material.name} ({material.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => handleQuantityOrPriceChange('quantity', e.target.value)}
                    placeholder="e.g., 100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">
                    Price/Unit (NPR) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerUnit}
                    onChange={(e) => handleQuantityOrPriceChange('pricePerUnit', e.target.value)}
                    placeholder="e.g., 500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount (NPR)</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Mobile Payment">Mobile Payment</SelectItem>
                      <SelectItem value="Credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={formData.paymentStatus}
                    onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this purchase"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPurchase ? 'Update Purchase' : 'Record Purchase'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Purchase Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Details</DialogTitle>
          </DialogHeader>
          {viewingPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(viewingPurchase.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Supplier</p>
                  <p className="font-medium">{viewingPurchase.supplierName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Material</p>
                  <p className="font-medium">{viewingPurchase.materialName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-medium">{viewingPurchase.quantity} {viewingPurchase.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price per Unit</p>
                  <p className="font-medium">NPR {viewingPurchase.pricePerUnit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-medium text-lg">NPR {viewingPurchase.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">{viewingPurchase.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <Badge variant={getStatusBadgeVariant(viewingPurchase.paymentStatus)}>
                    {viewingPurchase.paymentStatus}
                  </Badge>
                </div>
              </div>
              {viewingPurchase.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium">{viewingPurchase.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
