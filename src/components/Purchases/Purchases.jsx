import { useState, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Search, Eye, Edit, Trash2, DollarSign, Calendar, Package, Upload, FileText, Image, X } from 'lucide-react';
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
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    materialName: '',
    materialCategory: 'General',
    unit: 'pieces',
    quantity: '',
    pricePerUnit: '',
    totalAmount: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    notes: ''
  });

  // Material suggestions from existing raw materials
  const materialSuggestions = rawMaterials.map(m => m.name);

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
        materialName: purchase.materialName || '',
        materialCategory: purchase.materialCategory || 'General',
        unit: purchase.unit || 'pieces',
        quantity: purchase.quantity?.toString() || '',
        pricePerUnit: purchase.pricePerUnit?.toString() || '',
        totalAmount: purchase.totalAmount?.toString() || '',
        paymentMethod: purchase.paymentMethod || 'Cash',
        paymentStatus: purchase.paymentStatus || 'Paid',
        notes: purchase.notes || ''
      });
      // Load existing invoice if any
      if (purchase.invoiceData) {
        setInvoicePreview(purchase.invoiceData);
        setInvoiceFile({ name: purchase.invoiceFileName || 'Invoice', type: purchase.invoiceType });
      }
    } else {
      setEditingPurchase(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        supplierId: '',
        materialName: '',
        materialCategory: 'General',
        unit: 'pieces',
        quantity: '',
        pricePerUnit: '',
        totalAmount: '',
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        notes: ''
      });
      setInvoiceFile(null);
      setInvoicePreview(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPurchase(null);
    setInvoiceFile(null);
    setInvoicePreview(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      materialName: '',
      materialCategory: 'General',
      unit: 'pieces',
      quantity: '',
      pricePerUnit: '',
      totalAmount: '',
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      notes: ''
    });
  };

  const handleMaterialNameChange = (name) => {
    setFormData(prev => ({ ...prev, materialName: name }));
    
    // Auto-fill unit and category if material exists
    const existingMaterial = rawMaterials.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (existingMaterial) {
      setFormData(prev => ({
        ...prev,
        materialName: name,
        unit: existingMaterial.unit || 'pieces',
        materialCategory: existingMaterial.category || 'General',
        pricePerUnit: existingMaterial.unitPrice?.toString() || existingMaterial.pricePerUnit?.toString() || ''
      }));
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

  const handleInvoiceUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or image file (JPEG, PNG, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setInvoiceFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setInvoicePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeInvoice = () => {
    setInvoiceFile(null);
    setInvoicePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplierId || !formData.materialName || !formData.quantity || !formData.pricePerUnit) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const supplier = suppliers.find(s => s.id === parseInt(formData.supplierId));
      
      if (!supplier) {
        alert('Invalid supplier selected');
        return;
      }

      // Check if material already exists in inventory
      let existingMaterial = rawMaterials.find(m => 
        m.name.toLowerCase() === formData.materialName.toLowerCase()
      );

      const purchaseData = {
        date: formData.date,
        supplierId: parseInt(formData.supplierId),
        supplierName: supplier.name,
        materialName: formData.materialName,
        materialCategory: formData.materialCategory,
        unit: formData.unit,
        quantity: parseFloat(formData.quantity),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        totalAmount: parseFloat(formData.totalAmount),
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes,
        // Invoice data
        invoiceData: invoicePreview || null,
        invoiceFileName: invoiceFile?.name || null,
        invoiceType: invoiceFile?.type || null,
        createdAt: editingPurchase?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingPurchase) {
        // Update purchase
        await actions.updateItem('purchases', { ...purchaseData, id: editingPurchase.id });
        
        // Update material quantity (calculate difference)
        if (existingMaterial) {
          const quantityDiff = parseFloat(formData.quantity) - editingPurchase.quantity;
          const updatedMaterial = {
            ...existingMaterial,
            quantity: (parseFloat(existingMaterial.quantity) || 0) + quantityDiff,
            unitPrice: parseFloat(formData.pricePerUnit)
          };
          await actions.updateItem('rawMaterials', updatedMaterial);
        }
        
        alert('Purchase updated successfully!');
      } else {
        // Add new purchase
        await actions.addItem('purchases', purchaseData);
        
        // Auto-update or create raw material in inventory
        if (existingMaterial) {
          // Update existing material quantity
          const updatedMaterial = {
            ...existingMaterial,
            quantity: (parseFloat(existingMaterial.quantity) || 0) + parseFloat(formData.quantity),
            unitPrice: parseFloat(formData.pricePerUnit),
            updatedAt: new Date().toISOString()
          };
          await actions.updateItem('rawMaterials', updatedMaterial);
        } else {
          // Create new raw material
          const newMaterial = {
            name: formData.materialName,
            category: formData.materialCategory,
            unit: formData.unit,
            quantity: parseFloat(formData.quantity),
            unitPrice: parseFloat(formData.pricePerUnit),
            minStock: 10, // Default minimum stock
            supplierId: parseInt(formData.supplierId),
            supplierName: supplier.name,
            description: `Auto-created from purchase on ${formData.date}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await actions.addItem('rawMaterials', newMaterial);
        }
        
        alert('Purchase recorded! Raw material inventory updated automatically.');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Failed to save purchase. Please try again.');
    }
  };

  const handleDelete = async (purchase) => {
    if (!window.confirm(`Are you sure you want to delete this purchase? This will also revert the inventory.`)) {
      return;
    }

    try {
      // Revert material quantity
      const material = rawMaterials.find(m => 
        m.name.toLowerCase() === purchase.materialName?.toLowerCase()
      );
      if (material) {
        const updatedMaterial = {
          ...material,
          quantity: Math.max(0, (parseFloat(material.quantity) || 0) - purchase.quantity)
        };
        await actions.updateItem('rawMaterials', updatedMaterial);
      }
      
      await actions.deleteItem('purchases', purchase.id);
      alert('Purchase deleted! Inventory reverted.');
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
        <p className="text-sm text-green-600 mt-1">* Purchases automatically update raw material inventory</p>
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
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                    <TableCell>{purchase.supplierName}</TableCell>
                    <TableCell>{purchase.materialName}</TableCell>
                    <TableCell>{purchase.quantity} {purchase.unit}</TableCell>
                    <TableCell>NPR {purchase.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(purchase.paymentStatus)}>
                        {purchase.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {purchase.invoiceData ? (
                        <Badge variant="outline" className="text-green-600">
                          <FileText className="w-3 h-3 mr-1" />
                          Attached
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPurchase(purchase)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(purchase)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(purchase)}
                          className="text-red-600 hover:text-red-700"
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
            <Package className="w-12 h-12 text-gray-400 mb-4" />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPurchase ? 'Edit Purchase' : 'New Purchase'}
            </DialogTitle>
            <DialogDescription>
              {editingPurchase 
                ? 'Update purchase details below' 
                : 'Record a new purchase - inventory will be updated automatically'}
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

              {/* Material Name Input with Suggestions */}
              <div className="space-y-2">
                <Label htmlFor="materialName">
                  Material Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="materialName"
                  type="text"
                  value={formData.materialName}
                  onChange={(e) => handleMaterialNameChange(e.target.value)}
                  placeholder="Enter material name (e.g., Wood, Fabric, Foam)"
                  list="material-suggestions"
                  required
                />
                <datalist id="material-suggestions">
                  {materialSuggestions.map((name, index) => (
                    <option key={index} value={name} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500">
                  Type a new material name or select from existing materials
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="materialCategory">Category</Label>
                  <Select
                    value={formData.materialCategory}
                    onValueChange={(value) => setFormData({ ...formData, materialCategory: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Wood">Wood</SelectItem>
                      <SelectItem value="Fabric">Fabric</SelectItem>
                      <SelectItem value="Foam">Foam</SelectItem>
                      <SelectItem value="Metal">Metal</SelectItem>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Adhesive">Adhesive</SelectItem>
                      <SelectItem value="Finishing">Finishing</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="meters">Meters</SelectItem>
                      <SelectItem value="feet">Feet</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="sheets">Sheets</SelectItem>
                      <SelectItem value="rolls">Rolls</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

              {/* Invoice Upload Section */}
              <div className="space-y-2">
                <Label>Invoice / Bill (PDF or Image)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {invoicePreview ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {invoiceFile?.type?.includes('pdf') ? (
                            <FileText className="w-8 h-8 text-red-500" />
                          ) : (
                            <Image className="w-8 h-8 text-blue-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{invoiceFile?.name || 'Invoice'}</p>
                            <p className="text-xs text-gray-500">
                              {invoiceFile?.type?.includes('pdf') ? 'PDF Document' : 'Image'}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeInvoice}
                          className="text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {invoicePreview && !invoiceFile?.type?.includes('pdf') && (
                        <img 
                          src={invoicePreview} 
                          alt="Invoice preview" 
                          className="max-h-40 rounded border"
                        />
                      )}
                    </div>
                  ) : (
                    <div 
                      className="text-center cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload invoice
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, JPEG, PNG (max 5MB)
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleInvoiceUpload}
                    className="hidden"
                  />
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
        <DialogContent className="max-w-2xl">
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
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{viewingPurchase.materialCategory || 'General'}</p>
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
                  <p className="font-medium text-lg">NPR {viewingPurchase.totalAmount?.toLocaleString()}</p>
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

              {/* Invoice Display */}
              {viewingPurchase.invoiceData && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Invoice / Bill</p>
                  {viewingPurchase.invoiceType?.includes('pdf') ? (
                    <div className="flex items-center gap-2">
                      <FileText className="w-8 h-8 text-red-500" />
                      <div>
                        <p className="font-medium">{viewingPurchase.invoiceFileName || 'Invoice.pdf'}</p>
                        <a 
                          href={viewingPurchase.invoiceData} 
                          download={viewingPurchase.invoiceFileName || 'invoice.pdf'}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Download PDF
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <img 
                        src={viewingPurchase.invoiceData} 
                        alt="Invoice" 
                        className="max-w-full max-h-64 rounded border cursor-pointer"
                        onClick={() => window.open(viewingPurchase.invoiceData, '_blank')}
                      />
                      <p className="text-xs text-gray-500 mt-1">Click to view full size</p>
                    </div>
                  )}
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
