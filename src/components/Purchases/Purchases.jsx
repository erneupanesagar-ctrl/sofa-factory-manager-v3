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

// Extended units list
const UNITS = [
  { value: 'pieces', label: 'Pieces' },
  { value: 'meters', label: 'Meters' },
  { value: 'feet', label: 'Feet' },
  { value: 'sqft', label: 'Square Feet (sqft)' },
  { value: 'sqm', label: 'Square Meters (sqm)' },
  { value: 'cuft', label: 'Cubic Feet (cuft)' },
  { value: 'cum', label: 'Cubic Meters (cum)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'grams', label: 'Grams (g)' },
  { value: 'lbs', label: 'Pounds (lbs)' },
  { value: 'liters', label: 'Liters (L)' },
  { value: 'gallons', label: 'Gallons' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'yards', label: 'Yards' },
  { value: 'inches', label: 'Inches' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'sheets', label: 'Sheets' },
  { value: 'rolls', label: 'Rolls' },
  { value: 'bundles', label: 'Bundles' },
  { value: 'sets', label: 'Sets' },
  { value: 'pairs', label: 'Pairs' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'cartons', label: 'Cartons' },
  { value: 'bags', label: 'Bags' },
  { value: 'packets', label: 'Packets' },
  { value: 'bottles', label: 'Bottles' },
  { value: 'cans', label: 'Cans' },
  { value: 'units', label: 'Units' }
];

// Categories
const CATEGORIES = [
  'General', 'Wood', 'Fabric', 'Foam', 'Metal', 'Hardware', 
  'Adhesive', 'Finishing', 'Leather', 'Springs', 'Webbing', 
  'Thread', 'Zipper', 'Cushion', 'Packaging', 'Other'
];

// Empty item template
const emptyItem = {
  materialName: '',
  materialCategory: 'General',
  unit: 'pieces',
  quantity: '',
  pricePerUnit: '',
  totalAmount: ''
};

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
  
  // Multi-item support
  const [purchaseItems, setPurchaseItems] = useState([{ ...emptyItem }]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    notes: ''
  });

  // Material suggestions from existing raw materials
  const materialSuggestions = rawMaterials.map(m => m.name);

  const filteredPurchases = purchases.filter(purchase =>
    (purchase.supplierName && purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (purchase.materialName && purchase.materialName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (purchase.items && purchase.items.some(item => item.materialName?.toLowerCase().includes(searchTerm.toLowerCase()))) ||
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

  // Calculate grand total from all items
  const calculateGrandTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
  };

  const handleOpenDialog = (purchase = null) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setFormData({
        date: purchase.date,
        supplierId: purchase.supplierId?.toString() || '',
        paymentMethod: purchase.paymentMethod || 'Cash',
        paymentStatus: purchase.paymentStatus || 'Paid',
        notes: purchase.notes || ''
      });
      
      // Load items (support both old single-item and new multi-item format)
      if (purchase.items && purchase.items.length > 0) {
        setPurchaseItems(purchase.items.map(item => ({
          materialName: item.materialName || '',
          materialCategory: item.materialCategory || 'General',
          unit: item.unit || 'pieces',
          quantity: item.quantity?.toString() || '',
          pricePerUnit: item.pricePerUnit?.toString() || '',
          totalAmount: item.totalAmount?.toString() || ''
        })));
      } else {
        // Old format - single item
        setPurchaseItems([{
          materialName: purchase.materialName || '',
          materialCategory: purchase.materialCategory || 'General',
          unit: purchase.unit || 'pieces',
          quantity: purchase.quantity?.toString() || '',
          pricePerUnit: purchase.pricePerUnit?.toString() || '',
          totalAmount: purchase.totalAmount?.toString() || ''
        }]);
      }
      
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
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        notes: ''
      });
      setPurchaseItems([{ ...emptyItem }]);
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
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      notes: ''
    });
    setPurchaseItems([{ ...emptyItem }]);
  };

  // Add new item row
  const addItemRow = () => {
    setPurchaseItems([...purchaseItems, { ...emptyItem }]);
  };

  // Remove item row
  const removeItemRow = (index) => {
    if (purchaseItems.length > 1) {
      setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    }
  };

  // Update item field
  const updateItemField = (index, field, value) => {
    const newItems = [...purchaseItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill unit and category if material exists
    if (field === 'materialName') {
      const existingMaterial = rawMaterials.find(m => m.name.toLowerCase() === value.toLowerCase());
      if (existingMaterial) {
        newItems[index].unit = existingMaterial.unit || 'pieces';
        newItems[index].materialCategory = existingMaterial.category || 'General';
        newItems[index].pricePerUnit = existingMaterial.unitPrice?.toString() || existingMaterial.pricePerUnit?.toString() || '';
      }
    }
    
    // Auto-calculate total amount
    if (field === 'quantity' || field === 'pricePerUnit') {
      const quantity = field === 'quantity' ? parseFloat(value) : parseFloat(newItems[index].quantity);
      const price = field === 'pricePerUnit' ? parseFloat(value) : parseFloat(newItems[index].pricePerUnit);
      
      if (!isNaN(quantity) && !isNaN(price)) {
        newItems[index].totalAmount = (quantity * price).toString();
      }
    }
    
    setPurchaseItems(newItems);
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
    
    // Validate
    if (!formData.supplierId) {
      alert('Please select a supplier');
      return;
    }
    
    // Validate all items
    for (let i = 0; i < purchaseItems.length; i++) {
      const item = purchaseItems[i];
      if (!item.materialName || !item.quantity || !item.pricePerUnit) {
        alert(`Please fill in all required fields for item ${i + 1}`);
        return;
      }
    }

    try {
      const supplier = suppliers.find(s => s.id === parseInt(formData.supplierId));
      
      if (!supplier) {
        alert('Invalid supplier selected');
        return;
      }

      const grandTotal = calculateGrandTotal();
      
      // Prepare items with proper types
      const processedItems = purchaseItems.map(item => ({
        materialName: item.materialName,
        materialCategory: item.materialCategory,
        unit: item.unit,
        quantity: parseFloat(item.quantity),
        pricePerUnit: parseFloat(item.pricePerUnit),
        totalAmount: parseFloat(item.totalAmount)
      }));

      const purchaseData = {
        date: formData.date,
        supplierId: parseInt(formData.supplierId),
        supplierName: supplier.name,
        items: processedItems,
        // Keep first item fields for backward compatibility
        materialName: processedItems[0]?.materialName || '',
        materialCategory: processedItems[0]?.materialCategory || 'General',
        unit: processedItems[0]?.unit || 'pieces',
        quantity: processedItems[0]?.quantity || 0,
        pricePerUnit: processedItems[0]?.pricePerUnit || 0,
        totalAmount: grandTotal,
        itemCount: processedItems.length,
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
        
        // Update inventory for each item
        for (const item of processedItems) {
          const existingMaterial = rawMaterials.find(m => 
            m.name.toLowerCase() === item.materialName.toLowerCase()
          );
          
          if (existingMaterial) {
            // Find old quantity for this material
            const oldItem = editingPurchase.items?.find(i => 
              i.materialName?.toLowerCase() === item.materialName.toLowerCase()
            ) || (editingPurchase.materialName?.toLowerCase() === item.materialName.toLowerCase() ? editingPurchase : null);
            
            const oldQty = oldItem?.quantity || 0;
            const quantityDiff = item.quantity - oldQty;
            
            const updatedMaterial = {
              ...existingMaterial,
              quantity: (parseFloat(existingMaterial.quantity) || 0) + quantityDiff,
              pricePerUnit: item.pricePerUnit
            };
            await actions.updateItem('rawMaterials', updatedMaterial);
          }
        }
        
        alert('Purchase updated successfully!');
      } else {
        // Add new purchase
        await actions.addItem('purchases', purchaseData);
        
        // Auto-update or create raw materials in inventory for each item
        for (const item of processedItems) {
          const existingMaterial = rawMaterials.find(m => 
            m.name.toLowerCase() === item.materialName.toLowerCase()
          );
          
          if (existingMaterial) {
            // Update existing material quantity
            const updatedMaterial = {
              ...existingMaterial,
              quantity: (parseFloat(existingMaterial.quantity) || 0) + item.quantity,
              pricePerUnit: item.pricePerUnit,
              updatedAt: new Date().toISOString()
            };
            await actions.updateItem('rawMaterials', updatedMaterial);
          } else {
            // Create new raw material
            const newMaterial = {
              name: item.materialName,
              category: item.materialCategory,
              unit: item.unit,
              quantity: item.quantity,
              pricePerUnit: item.pricePerUnit,
              minStock: 10, // Default minimum stock
              supplierId: parseInt(formData.supplierId),
              supplierName: supplier.name,
              description: `Auto-created from purchase on ${formData.date}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await actions.addItem('rawMaterials', newMaterial);
          }
        }
        
        alert(`Purchase recorded! ${processedItems.length} item(s) added to inventory.`);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Failed to save purchase. Please try again.');
    }
  };

  const handleDelete = async (purchase) => {
    if (!confirm('Are you sure you want to delete this purchase? This will NOT reverse the inventory changes.')) {
      return;
    }

    try {
      await actions.deleteItem('purchases', purchase.id);
      alert('Purchase deleted successfully');
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Failed to delete purchase');
    }
  };

  const handleViewPurchase = (purchase) => {
    setViewingPurchase(purchase);
    setIsViewDialogOpen(true);
  };

  // Stats calculations
  const totalPurchases = purchases.length;
  const totalSpent = purchases.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);
  const pendingPayments = purchases
    .filter(p => p.paymentStatus === 'Unpaid' || p.paymentStatus === 'Partial')
    .reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
          <p className="text-gray-600">Track purchase orders and manage inventory</p>
          <p className="text-sm text-green-600 mt-1">* Purchases automatically update raw material inventory</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          New Purchase
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold">{totalPurchases}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold">NPR {totalSpent.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-red-600">NPR {pendingPayments.toLocaleString()}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search purchases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
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
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      {new Date(purchase.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {purchase.supplierName}
                    </TableCell>
                    <TableCell>
                      {purchase.items && purchase.items.length > 1 ? (
                        <div>
                          <span className="font-medium">{purchase.items.length} items</span>
                          <p className="text-xs text-gray-500">
                            {purchase.items.map(i => i.materialName).join(', ').substring(0, 30)}...
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium">{purchase.materialName}</span>
                          <p className="text-xs text-gray-500">
                            {purchase.quantity} {purchase.unit}
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      NPR {(purchase.totalAmount || 0).toLocaleString()}
                    </TableCell>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPurchase ? 'Edit Purchase' : 'New Purchase'}
            </DialogTitle>
            <DialogDescription>
              {editingPurchase 
                ? 'Update purchase details below' 
                : 'Record a new purchase with multiple items - inventory will be updated automatically'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Date and Supplier Row */}
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

              {/* Items Section */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Purchase Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {purchaseItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Item {index + 1}</span>
                      {purchaseItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemRow(index)}
                          className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Material Name */}
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Material Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={item.materialName}
                        onChange={(e) => updateItemField(index, 'materialName', e.target.value)}
                        placeholder="Enter material name"
                        list={`material-suggestions-${index}`}
                        required
                      />
                      <datalist id={`material-suggestions-${index}`}>
                        {materialSuggestions.map((name, i) => (
                          <option key={i} value={name} />
                        ))}
                      </datalist>
                    </div>

                    {/* Category, Unit Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Category</Label>
                        <Select
                          value={item.materialCategory}
                          onValueChange={(value) => updateItemField(index, 'materialCategory', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Unit</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateItemField(index, 'unit', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map(unit => (
                              <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Quantity, Price, Total Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Quantity <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateItemField(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="h-9"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">
                          Price/Unit <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.pricePerUnit}
                          onChange={(e) => updateItemField(index, 'pricePerUnit', e.target.value)}
                          placeholder="Price"
                          className="h-9"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Total</Label>
                        <Input
                          type="number"
                          value={item.totalAmount}
                          readOnly
                          className="h-9 bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grand Total */}
                <div className="flex justify-end items-center pt-2 border-t">
                  <span className="text-sm font-medium mr-4">Grand Total:</span>
                  <span className="text-lg font-bold text-green-600">
                    NPR {calculateGrandTotal().toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Row */}
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
                      <SelectItem value="Cheque">Cheque</SelectItem>
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
                  rows={2}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Details</DialogTitle>
          </DialogHeader>

          {viewingPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Date</Label>
                  <p className="font-medium">{new Date(viewingPurchase.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Supplier</Label>
                  <p className="font-medium">{viewingPurchase.supplierName}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="border rounded-lg p-3">
                <Label className="text-gray-500 mb-2 block">Items</Label>
                {viewingPurchase.items && viewingPurchase.items.length > 0 ? (
                  <div className="space-y-2">
                    {viewingPurchase.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{item.materialName}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} {item.unit} × NPR {item.pricePerUnit}
                          </p>
                        </div>
                        <p className="font-medium">NPR {(item.totalAmount || 0).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">{viewingPurchase.materialName}</p>
                      <p className="text-sm text-gray-500">
                        {viewingPurchase.quantity} {viewingPurchase.unit} × NPR {viewingPurchase.pricePerUnit}
                      </p>
                    </div>
                    <p className="font-medium">NPR {(viewingPurchase.totalAmount || 0).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total Amount</span>
                <span className="text-xl font-bold text-green-600">
                  NPR {(viewingPurchase.totalAmount || 0).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Payment Method</Label>
                  <p className="font-medium">{viewingPurchase.paymentMethod}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Payment Status</Label>
                  <Badge variant={getStatusBadgeVariant(viewingPurchase.paymentStatus)}>
                    {viewingPurchase.paymentStatus}
                  </Badge>
                </div>
              </div>

              {viewingPurchase.notes && (
                <div>
                  <Label className="text-gray-500">Notes</Label>
                  <p className="text-gray-700">{viewingPurchase.notes}</p>
                </div>
              )}

              {viewingPurchase.invoiceData && (
                <div>
                  <Label className="text-gray-500">Invoice</Label>
                  <div className="mt-2 border rounded-lg p-3">
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
                      <img 
                        src={viewingPurchase.invoiceData} 
                        alt="Invoice" 
                        className="max-h-64 rounded cursor-pointer"
                        onClick={() => window.open(viewingPurchase.invoiceData, '_blank')}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              handleOpenDialog(viewingPurchase);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
