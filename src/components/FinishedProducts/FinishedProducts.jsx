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
    estimatedDays: '',
    stockQuantity: '',
    billOfMaterials: [], // Array of {materialId, materialName, quantity, unit, costPerUnit, totalCost}
    images: [], // Array of {id, data (base64), isPrimary}
    primaryImageId: null
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
        estimatedDays: product.estimatedDays || '',
        stockQuantity: product.stockQuantity || '0',
        billOfMaterials: product.billOfMaterials || [],
        images: product.images || [],
        primaryImageId: product.primaryImageId || null
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        materialCost: '',
        laborCost: '',
        sellingPrice: '',
        estimatedDays: '',
        stockQuantity: '',
        billOfMaterials: []
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
      estimatedDays: '',
      stockQuantity: '',
      billOfMaterials: [],
      images: [],
      primaryImageId: null
    });
  };

  const calculateTotalCost = () => {
    // Calculate material cost from BOM if available, otherwise use manual input
    let materialCost = 0;
    if (formData.billOfMaterials && formData.billOfMaterials.length > 0) {
      materialCost = formData.billOfMaterials.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    } else {
      materialCost = parseFloat(formData.materialCost) || 0;
    }
    const labor = parseFloat(formData.laborCost) || 0;
    return materialCost + labor;
  };

  const calculateMaterialCostFromBOM = () => {
    if (formData.billOfMaterials && formData.billOfMaterials.length > 0) {
      return formData.billOfMaterials.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    }
    return 0;
  };

  const calculateProfit = () => {
    const totalCost = calculateTotalCost();
    const selling = parseFloat(formData.sellingPrice) || 0;
    return selling - totalCost;
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;

    const maxImages = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const remainingSlots = maxImages - formData.images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    for (const file of filesToProcess) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }

      // Validate file size
      if (file.size > maxSize) {
        alert(`${file.name} is too large (max 5MB)`);
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageId = Date.now() + Math.random();
        const newImage = {
          id: imageId,
          data: e.target.result,
          name: file.name
        };

        setFormData(prev => {
          const newImages = [...prev.images, newImage];
          return {
            ...prev,
            images: newImages,
            // Set as primary if it's the first image
            primaryImageId: prev.primaryImageId || imageId
          };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (imageId) => {
    setFormData(prev => {
      const newImages = prev.images.filter(img => img.id !== imageId);
      let newPrimaryId = prev.primaryImageId;
      
      // If removing the primary image, set the first remaining image as primary
      if (imageId === prev.primaryImageId && newImages.length > 0) {
        newPrimaryId = newImages[0].id;
      } else if (newImages.length === 0) {
        newPrimaryId = null;
      }

      return {
        ...prev,
        images: newImages,
        primaryImageId: newPrimaryId
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Please enter product name');
      return;
    }

    try {
      // Calculate material cost from BOM or use manual input
      const bomMaterialCost = calculateMaterialCostFromBOM();
      const finalMaterialCost = bomMaterialCost > 0 ? bomMaterialCost : (parseFloat(formData.materialCost) || 0);
      
      const productData = {
        name: formData.name,
        description: formData.description,
        billOfMaterials: formData.billOfMaterials || [],
        images: formData.images || [],
        primaryImageId: formData.primaryImageId || null,
        materialCost: finalMaterialCost,
        laborCost: parseFloat(formData.laborCost) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        estimatedDays: parseInt(formData.estimatedDays) || 0,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
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
              {/* Product Image */}
              {product.images && product.images.length > 0 && (
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={product.images.find(img => img.id === product.primaryImageId)?.data || product.images[0].data}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.images.length > 1 && (
                    <Badge className="absolute top-2 right-2 bg-black bg-opacity-70">
                      +{product.images.length - 1} more
                    </Badge>
                  )}
                </div>
              )}
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

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Stock Quantity</span>
                      <Badge variant={(product.stockQuantity || 0) > 0 ? 'default' : 'destructive'}>
                        {product.stockQuantity || 0} units
                      </Badge>
                    </div>
                  </div>
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

              {/* Product Images Section */}
              <div className="space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div>
                  <Label className="text-base font-semibold">Product Images</Label>
                  <p className="text-xs text-gray-500 mt-1">Upload up to 5 images (Click or drag & drop)</p>
                </div>
                
                {/* Image Upload Area */}
                <div className="space-y-3">
                  {formData.images.length < 5 && (
                    <div
                      className="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('imageUpload').click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const files = Array.from(e.dataTransfer.files);
                        handleImageUpload(files);
                      }}
                    >
                      <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 5MB</p>
                      <input
                        id="imageUpload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        multiple
                        className="hidden"
                        onChange={(e) => handleImageUpload(Array.from(e.target.files))}
                      />
                    </div>
                  )}

                  {/* Image Preview Grid */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {formData.images.map((image) => (
                        <div
                          key={image.id}
                          className={`relative group border-2 rounded-lg overflow-hidden ${
                            image.id === formData.primaryImageId
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-300'
                          }`}
                        >
                          <img
                            src={image.data}
                            alt="Product"
                            className="w-full h-32 object-cover"
                          />
                          {image.id === formData.primaryImageId && (
                            <Badge className="absolute top-2 left-2 bg-blue-500">Primary</Badge>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2">
                            {image.id !== formData.primaryImageId && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setFormData({ ...formData, primaryImageId: image.id })}
                              >
                                Set Primary
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(image.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bill of Materials Section */}
              <div className="space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Bill of Materials (BOM)</Label>
                    <p className="text-xs text-gray-500 mt-1">Add materials needed to produce this product</p>
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
                    No materials added yet. Click "Add Material" to start building your BOM.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.billOfMaterials.map((material, index) => {
                      const rawMaterial = state.rawMaterials.find(rm => rm.id === parseInt(material.materialId));
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
                                  const selectedMaterial = state.rawMaterials.find(rm => rm.id === parseInt(e.target.value));
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
                                {state.rawMaterials.map(rm => (
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
                              <div className="flex-1">
                                <Label className="text-xs">Total Cost</Label>
                                <Input
                                  type="text"
                                  className="mt-1 bg-gray-100 font-semibold"
                                  value={formatCurrency(totalCost)}
                                  readOnly
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    billOfMaterials: formData.billOfMaterials.filter((_, i) => i !== index)
                                  });
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
                        <span className="text-sm font-medium text-blue-900">Total Material Cost (from BOM)</span>
                        <span className="text-lg font-bold text-blue-900">
                          {formatCurrency(calculateMaterialCostFromBOM())}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Material Cost (only if no BOM) */}
              {formData.billOfMaterials.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 mb-2">💡 <strong>Tip:</strong> Use Bill of Materials above for accurate material tracking, or enter manual cost below.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="materialCost">
                    Material Cost (NPR)
                    {formData.billOfMaterials.length > 0 && (
                      <span className="text-xs text-blue-600 ml-2">(Auto-calculated from BOM)</span>
                    )}
                  </Label>
                  <Input
                    id="materialCost"
                    type="number"
                    step="0.01"
                    value={formData.billOfMaterials.length > 0 ? calculateMaterialCostFromBOM() : formData.materialCost}
                    onChange={(e) => setFormData({ ...formData, materialCost: e.target.value })}
                    placeholder="0.00"
                    disabled={formData.billOfMaterials.length > 0}
                    className={formData.billOfMaterials.length > 0 ? 'bg-gray-100 font-semibold' : ''}
                  />
                  {formData.billOfMaterials.length === 0 && (
                    <p className="text-xs text-gray-500">Or use Bill of Materials above for detailed tracking</p>
                  )}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">
                    Stock Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="0"
                    required
                  />
                  <p className="text-xs text-gray-500">Available units in stock</p>
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
