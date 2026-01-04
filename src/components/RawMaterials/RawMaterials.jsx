import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RawMaterials() {
  const { state, actions } = useApp();
  const { rawMaterials = [] } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Wood',
    quantity: '',
    unit: 'meters',
    pricePerUnit: '',
    minStock: '',
    supplier: '',
    description: ''
  });

  const filteredMaterials = rawMaterials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (material.category && material.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (material.supplier && material.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getLowStockStatus = (quantity, minStock) => {
    const qty = parseFloat(quantity) || 0;
    const min = parseFloat(minStock) || 0;
    
    if (qty === 0) return { label: 'Out of Stock', variant: 'destructive' };
    if (qty <= min) return { label: 'Low Stock', variant: 'warning' };
    return { label: 'In Stock', variant: 'success' };
  };

  const handleOpenDialog = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        category: material.category || 'Wood',
        quantity: material.quantity?.toString() || '',
        unit: material.unit || 'meters',
        pricePerUnit: material.pricePerUnit?.toString() || '',
        minStock: material.minStock?.toString() || '',
        supplier: material.supplier || '',
        description: material.description || ''
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        name: '',
        category: 'Wood',
        quantity: '',
        unit: 'meters',
        pricePerUnit: '',
        minStock: '',
        supplier: '',
        description: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMaterial(null);
    setFormData({
      name: '',
      category: 'Wood',
      quantity: '',
      unit: 'meters',
      pricePerUnit: '',
      minStock: '',
      supplier: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.quantity || !formData.pricePerUnit) {
      alert('Please fill in required fields (Name, Quantity, Price)');
      return;
    }

    try {
      const materialData = {
        name: formData.name,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        pricePerUnit: parseFloat(formData.pricePerUnit),
        minStock: parseFloat(formData.minStock) || 0,
        supplier: formData.supplier,
        description: formData.description,
        createdAt: editingMaterial?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingMaterial) {
        await actions.updateItem('rawMaterials', { ...materialData, id: editingMaterial.id });
        alert('Material updated successfully!');
      } else {
        await actions.addItem('rawMaterials', materialData);
        alert('Material added successfully!');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving material:', error);
      alert('Failed to save material. Please try again.');
    }
  };

  const handleDelete = async (material) => {
    if (!window.confirm(`Are you sure you want to delete ${material.name}?`)) {
      return;
    }

    try {
      await actions.deleteItem('rawMaterials', material.id);
      alert('Material deleted successfully!');
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Failed to delete material. Please try again.');
    }
  };

  const totalValue = rawMaterials.reduce((sum, material) => {
    return sum + ((material.quantity || 0) * (material.pricePerUnit || 0));
  }, 0);

  const lowStockCount = rawMaterials.filter(material => {
    const qty = parseFloat(material.quantity) || 0;
    const min = parseFloat(material.minStock) || 0;
    return qty <= min;
  }).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Raw Materials</h1>
        <p className="text-gray-600 mt-1">Track and manage raw materials inventory</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Materials</CardDescription>
            <CardTitle className="text-2xl">{rawMaterials.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Inventory Value</CardDescription>
            <CardTitle className="text-2xl">NPR {totalValue.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Low Stock Items</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{lowStockCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map(material => {
            const status = getLowStockStatus(material.quantity, material.minStock);
            const totalValue = (material.quantity || 0) * (material.pricePerUnit || 0);
            
            return (
              <Card key={material.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{material.name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        {material.category && (
                          <Badge variant="outline">{material.category}</Badge>
                        )}
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{material.quantity} {material.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price/Unit:</span>
                      <span className="font-medium">NPR {(material.pricePerUnit || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Min Stock:</span>
                      <span className="font-medium">{material.minStock || 0} {material.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-semibold">NPR {totalValue.toLocaleString()}</span>
                    </div>
                    {material.purchaseDate && (
                      <div className="text-xs text-gray-500">
                        Purchased: {new Date(material.purchaseDate).toLocaleDateString()}
                      </div>
                    )}
                    {(material.supplier || material.supplierName) && (
                      <div className="text-sm text-gray-600 pt-2">
                        <span className="font-medium">Supplier:</span> {material.supplier || material.supplierName}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleOpenDialog(material)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(material)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No materials found' : 'No materials yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Add your first material to get started'}
            </p>
            {!searchTerm && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Material
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Material Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </DialogTitle>
            <DialogDescription>
              {editingMaterial 
                ? 'Update material information below' 
                : 'Enter material details to add to your inventory'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Material Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Teak Wood"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wood">Wood</SelectItem>
                      <SelectItem value="Fabric">Fabric</SelectItem>
                      <SelectItem value="Foam">Foam</SelectItem>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Cushioning">Cushioning</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g., 150"
                    required
                  />
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
                      <SelectItem value="meters">meters</SelectItem>
                      <SelectItem value="pieces">pieces</SelectItem>
                      <SelectItem value="sheets">sheets</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="liters">liters</SelectItem>
                      <SelectItem value="boxes">boxes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">
                    Price per Unit (NPR) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                    placeholder="e.g., 800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minStock">Minimum Stock Level</Label>
                  <Input
                    id="minStock"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    placeholder="e.g., 50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="e.g., Timber Traders Ltd"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes about this material"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingMaterial ? 'Update Material' : 'Add Material'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
