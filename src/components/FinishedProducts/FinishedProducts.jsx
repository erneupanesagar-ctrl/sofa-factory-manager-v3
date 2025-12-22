import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Search, Edit, Trash2, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../../lib/utils';

export default function FinishedProducts() {
  const { state, actions } = useApp();
  const { sofaModels } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    materialCost: '',
    laborCost: '',
    sellingPrice: '',
    estimatedDays: ''
  });

  const filteredProducts = sofaModels.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        materialCost: product.materialCost || '',
        laborCost: product.laborCost || '',
        sellingPrice: product.sellingPrice || '',
        estimatedDays: product.estimatedDays || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        materialCost: '',
        laborCost: '',
        sellingPrice: '',
        estimatedDays: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      materialCost: '',
      laborCost: '',
      sellingPrice: '',
      estimatedDays: ''
    });
  };

  const calculateTotalCost = () => {
    const material = parseFloat(formData.materialCost) || 0;
    const labor = parseFloat(formData.laborCost) || 0;
    return material + labor;
  };

  const calculateProfit = () => {
    const totalCost = calculateTotalCost();
    const selling = parseFloat(formData.sellingPrice) || 0;
    return selling - totalCost;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Please enter product name');
      return;
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        materialCost: parseFloat(formData.materialCost) || 0,
        laborCost: parseFloat(formData.laborCost) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        estimatedDays: parseInt(formData.estimatedDays) || 0,
        totalCost: calculateTotalCost(),
        profit: calculateProfit(),
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        await actions.updateItem('sofaModels', { ...productData, id: editingProduct.id });
        alert('Product updated successfully!');
      } else {
        await actions.addItem('sofaModels', productData);
        alert('Product added successfully!');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await actions.deleteItem('sofaModels', product.id);
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Finished Products</h1>
        <p className="text-gray-600 mt-1">Manage your sofa models and product catalog</p>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search products by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first product'}
            </p>
            {!searchTerm && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                {product.description && (
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Material Cost</p>
                      <p className="font-semibold">{formatCurrency(product.materialCost)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Labor Cost</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(product.laborCost)}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Total Cost</p>
                        <p className="font-semibold">{formatCurrency(product.totalCost)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Selling Price</p>
                        <p className="font-semibold text-green-600">{formatCurrency(product.sellingPrice)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Profit Margin</span>
                      <Badge variant={product.profit > 0 ? 'default' : 'destructive'}>
                        {formatCurrency(product.profit)}
                      </Badge>
                    </div>
                  </div>

                  {product.estimatedDays > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-500">
                        Estimated Production: <span className="font-semibold text-gray-900">{product.estimatedDays} days</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(product)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Update product information below' 
                : 'Enter product details including labor cost for accurate pricing'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., L-Shape Sofa, 3-Seater Sofa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="materialCost">Material Cost (NPR)</Label>
                  <Input
                    id="materialCost"
                    type="number"
                    step="0.01"
                    value={formData.materialCost}
                    onChange={(e) => setFormData({ ...formData, materialCost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="laborCost" className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1 text-blue-600" />
                    Labor Cost (NPR)
                  </Label>
                  <Input
                    id="laborCost"
                    type="number"
                    step="0.01"
                    value={formData.laborCost}
                    onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500">Estimated labor cost for production</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Total Cost</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(calculateTotalCost())}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Material Cost + Labor Cost</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Selling Price (NPR)</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDays">Estimated Production (Days)</Label>
                  <Input
                    id="estimatedDays"
                    type="number"
                    value={formData.estimatedDays}
                    onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              {formData.sellingPrice && (
                <div className={`p-4 rounded-lg ${calculateProfit() >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <span className={`text-lg font-bold ${calculateProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculateProfit())}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {calculateProfit() >= 0 ? 'Profitable product' : 'Selling below cost'}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
