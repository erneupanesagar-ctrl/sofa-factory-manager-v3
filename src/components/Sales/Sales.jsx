import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Search, Eye, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function Sales() {
  const { state, actions } = useApp();
  const { customers, sofaModels, sales } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    productId: '',
    quantity: '1',
    unitPrice: '',
    discount: '0',
    paymentMethod: 'cash',
    notes: ''
  });

  const filteredSales = sales.filter(sale =>
    sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.saleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });
  const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

  const handleOpenDialog = () => {
    setFormData({
      customerId: '',
      productId: '',
      quantity: '1',
      unitPrice: '',
      discount: '0',
      paymentMethod: 'cash',
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      customerId: '',
      productId: '',
      quantity: '1',
      unitPrice: '',
      discount: '0',
      paymentMethod: 'cash',
      notes: ''
    });
  };

  const handleProductSelect = (productId) => {
    const product = sofaModels.find(p => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        productId,
        unitPrice: product.sellingPrice.toString()
      });
    }
  };

  const calculateTotal = () => {
    const quantity = parseInt(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const subtotal = quantity * unitPrice;
    return subtotal - discount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if customers and products exist
    if (customers.length === 0) {
      alert('No customers found! Please add customers first from the Customers page.');
      return;
    }
    
    if (sofaModels.length === 0) {
      alert('No products found! Please add finished products first from the Inventory page.');
      return;
    }
    
    if (!formData.customerId || !formData.productId) {
      alert('Please select customer and product');
      return;
    }

    try {
      const customer = customers.find(c => c.id === formData.customerId);
      const product = sofaModels.find(p => p.id === formData.productId);
      
      if (!customer || !product) {
        alert('Invalid customer or product selection. Please try again.');
        return;
      }

      const quantity = parseInt(formData.quantity) || 1;
      const unitPrice = parseFloat(formData.unitPrice) || 0;
      const discount = parseFloat(formData.discount) || 0;
      const saleNumber = `SAL-${Date.now().toString().slice(-6)}`;

      const saleData = {
        saleNumber,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice,
        discount,
        subtotal: quantity * unitPrice,
        totalAmount: calculateTotal(),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        status: 'complete',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await actions.addItem('sales', saleData);
      alert('Sale recorded successfully!');
      handleCloseDialog();
    } catch (error) {
      console.error('Error recording sale:', error);
      alert('Failed to record sale. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        <p className="text-gray-600 mt-1">Track and manage your sales transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
            <p className="text-xs text-muted-foreground">All time transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySales.length}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(todayRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All time revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search sales by number, customer, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleOpenDialog} className="whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" />
          Record Sale
        </Button>
      </div>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No sales found' : 'No sales yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Record your first sale to get started'}
            </p>
            {!searchTerm && (
              <Button onClick={handleOpenDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Record Sale
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{sale.saleNumber}</h3>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {sale.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium">{sale.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Product</p>
                        <p className="font-medium">{sale.productName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="font-medium">{sale.quantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="font-medium text-green-600">{formatCurrency(sale.totalAmount)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span>Payment: {sale.paymentMethod}</span>
                      <span>•</span>
                      <span>{formatDate(sale.createdAt)}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingSale(sale)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Record Sale Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record New Sale</DialogTitle>
            <DialogDescription>
              Enter sale details to record a new transaction
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">
                    Customer <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productId">
                    Product <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.productId} onValueChange={handleProductSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {sofaModels.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.sellingPrice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price (NPR)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (NPR)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Amount</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">Record Sale</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Sale Dialog */}
      {viewingSale && (
        <Dialog open={!!viewingSale} onOpenChange={() => setViewingSale(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sale Details - {viewingSale.saleNumber}</DialogTitle>
              <DialogDescription>
                Recorded on {formatDate(viewingSale.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="font-medium">{viewingSale.customerName}</p>
                  <p className="text-sm text-gray-500">{viewingSale.customerPhone}</p>
                </div>
                <div>
                  <Label>Product</Label>
                  <p className="font-medium">{viewingSale.productName}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <p className="font-medium">{viewingSale.quantity}</p>
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <p className="font-medium">{formatCurrency(viewingSale.unitPrice)}</p>
                </div>
                <div>
                  <Label>Subtotal</Label>
                  <p className="font-medium">{formatCurrency(viewingSale.subtotal)}</p>
                </div>
              </div>

              {viewingSale.discount > 0 && (
                <div>
                  <Label>Discount</Label>
                  <p className="font-medium text-red-600">- {formatCurrency(viewingSale.discount)}</p>
                </div>
              )}

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total Amount</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(viewingSale.totalAmount)}
                  </span>
                </div>
              </div>

              <div>
                <Label>Payment Method</Label>
                <p className="font-medium capitalize">{viewingSale.paymentMethod.replace('_', ' ')}</p>
              </div>

              {viewingSale.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-gray-700">{viewingSale.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingSale(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
