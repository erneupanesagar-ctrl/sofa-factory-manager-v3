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
import { sendOrderConfirmation, sendPaymentReminder } from '../../lib/notificationService';

export default function Sales() {
  const { state, actions } = useApp();
  const { customers, sofaModels, sales } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState(null);
  const [formData, setFormData] = useState({
    customerId: null,
    productId: null,
    quantity: '1',
    unitPrice: '',
    discount: '0',
    paymentMethod: 'cash',
    paidAmount: '',
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
      customerId: null,
      productId: null,
      quantity: '1',
      unitPrice: '',
      discount: '0',
      paymentMethod: 'cash',
      paidAmount: '',
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      customerId: null,
      productId: null,
      quantity: '1',
      unitPrice: '',
      discount: '0',
      paymentMethod: 'cash',
      paidAmount: '',
      notes: ''
    });
  };

  const handleProductSelect = (productId) => {
    console.log('Product selected:', productId);
    // Convert string ID to number for comparison
    const numericId = parseInt(productId);
    const product = sofaModels.find(p => p.id === numericId);
    console.log('Product details:', product);
    if (product) {
      const newFormData = {
        ...formData,
        productId: numericId,
        unitPrice: product.sellingPrice.toString()
      };
      console.log('Updated form data:', newFormData);
      setFormData(newFormData);
    } else {
      console.error('Product not found for ID:', productId);
    }
  };
  
  const handleCustomerSelect = (customerId) => {
    console.log('Customer selected:', customerId);
    // Convert string ID to number for comparison
    const numericId = parseInt(customerId);
    const customer = customers.find(c => c.id === numericId);
    console.log('Customer details:', customer);
    const newFormData = { ...formData, customerId: numericId };
    console.log('Updated form data:', newFormData);
    setFormData(newFormData);
  };

  const calculateTotal = () => {
    const quantity = parseInt(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const subtotal = quantity * unitPrice;
    return subtotal - discount;
  };

  const handleApproveSale = async (sale) => {
    if (!window.confirm(`Approve sale ${sale.saleNumber}? This will deduct ${sale.quantity} units from inventory.`)) {
      return;
    }

    try {
      // Update sale status
      const updatedSale = {
        ...sale,
        approvalStatus: 'approved',
        status: 'completed',
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await actions.updateItem('sales', updatedSale);

      // Deduct stock from product
      const product = sofaModels.find(p => p.id === sale.productId);
      if (product) {
        const updatedProduct = {
          ...product,
          stockQuantity: (product.stockQuantity || 0) - sale.quantity,
          updatedAt: new Date().toISOString()
        };
        await actions.updateItem('sofaModels', updatedProduct);
      }

      alert('Sale approved successfully! Stock has been updated.');
    } catch (error) {
      console.error('Error approving sale:', error);
      alert('Failed to approve sale. Please try again.');
    }
  };

  const handleRejectSale = async (sale) => {
    const reason = window.prompt(`Reject sale ${sale.saleNumber}? Please enter reason:`);
    if (!reason) return;

    try {
      const updatedSale = {
        ...sale,
        approvalStatus: 'rejected',
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await actions.updateItem('sales', updatedSale);
      alert('Sale rejected successfully.');
    } catch (error) {
      console.error('Error rejecting sale:', error);
      alert('Failed to reject sale. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== SALES FORM SUBMISSION DEBUG ===');
    console.log('Form Data:', formData);
    console.log('Customers available:', customers.length);
    console.log('Products available:', sofaModels.length);
    console.log('All customers:', customers);
    console.log('All products:', sofaModels);
    
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
      console.error('Missing selection - Customer ID:', formData.customerId, 'Product ID:', formData.productId);
      alert('Please select both customer and product from the dropdowns');
      return;
    }

    try {
      const customer = customers.find(c => c.id === formData.customerId);
      const product = sofaModels.find(p => p.id === formData.productId);
      
      console.log('Found customer:', customer);
      console.log('Found product:', product);
      
      if (!customer || !product) {
        console.error('Validation failed - Customer found:', !!customer, 'Product found:', !!product);
        alert(`Invalid selection. Customer: ${customer ? 'OK' : 'NOT FOUND'}, Product: ${product ? 'OK' : 'NOT FOUND'}`);
        return;
      }

      const quantity = parseInt(formData.quantity) || 1;
      const unitPrice = parseFloat(formData.unitPrice) || 0;
      const discount = parseFloat(formData.discount) || 0;
      const totalAmount = calculateTotal();
      const paidAmount = parseFloat(formData.paidAmount) || 0;
      const dueAmount = totalAmount - paidAmount;
      const saleNumber = `SAL-${Date.now().toString().slice(-6)}`;
      
      // Check stock availability
      if ((product.stockQuantity || 0) < quantity) {
        alert(`Insufficient stock! Available: ${product.stockQuantity || 0} units, Requested: ${quantity} units`);
        return;
      }
      
      // Determine payment status
      let paymentStatus = 'unpaid';
      if (paidAmount >= totalAmount) {
        paymentStatus = 'paid';
      } else if (paidAmount > 0) {
        paymentStatus = 'partial';
      }

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
        totalAmount,
        paidAmount,
        dueAmount,
        paymentStatus,
        paymentMethod: formData.paymentMethod,
        paymentHistory: [
          {
            amount: paidAmount,
            method: formData.paymentMethod,
            date: new Date().toISOString(),
            note: 'Initial payment'
          }
        ],
        notes: formData.notes,
        status: 'pending',
        approvalStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newSale = await actions.addItem('sales', saleData);
      
      // Send order confirmation notification
      try {
        await sendOrderConfirmation(actions, saleData, customer, product);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
      
      alert('Sale recorded successfully! Waiting for admin approval.');
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
                      {sale.approvalStatus === 'pending' && (
                        <Badge className="bg-orange-500 text-white">Pending Approval</Badge>
                      )}
                      {sale.approvalStatus === 'approved' && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Approved
                        </Badge>
                      )}
                      {sale.approvalStatus === 'rejected' && (
                        <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                      )}
                      {sale.paymentStatus === 'paid' && (
                        <Badge className="bg-green-500 text-white">Paid</Badge>
                      )}
                      {sale.paymentStatus === 'partial' && (
                        <Badge className="bg-yellow-500 text-white">Partial Payment</Badge>
                      )}
                      {sale.paymentStatus === 'unpaid' && (
                        <Badge className="bg-red-500 text-white">Unpaid</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
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
                      <div>
                        <p className="text-sm text-gray-500">Due Amount</p>
                        <p className="font-medium text-red-600">
                          {sale.dueAmount > 0 ? formatCurrency(sale.dueAmount) : 'NPR 0'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span>Payment: {sale.paymentMethod}</span>
                      <span>•</span>
                      <span>{formatDate(sale.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {sale.approvalStatus === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveSale(sale)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRejectSale(sale)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingSale(sale)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
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
                  <Select value={formData.customerId?.toString() || ''} onValueChange={handleCustomerSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
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
                  <Select value={formData.productId?.toString() || ''} onValueChange={handleProductSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {sofaModels.map(product => (
                        <SelectItem key={product.id} value={product.id.toString()}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="paidAmount">Paid Amount (NPR)</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter amount paid"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty or enter 0 for unpaid. Total: {formatCurrency(calculateTotal())}
                  </p>
                </div>
              </div>

              {formData.paidAmount && parseFloat(formData.paidAmount) < calculateTotal() && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-yellow-800">Due Amount:</span>
                    <span className="text-lg font-bold text-yellow-900">
                      {formatCurrency(calculateTotal() - parseFloat(formData.paidAmount || 0))}
                    </span>
                  </div>
                </div>
              )}

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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Paid Amount</Label>
                  <p className="font-medium text-green-600">
                    {formatCurrency(viewingSale.paidAmount || 0)}
                  </p>
                </div>
                <div>
                  <Label>Due Amount</Label>
                  <p className="font-medium text-red-600">
                    {formatCurrency(viewingSale.dueAmount || 0)}
                  </p>
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <div>
                    {viewingSale.paymentStatus === 'paid' && (
                      <Badge className="bg-green-500 text-white">Paid</Badge>
                    )}
                    {viewingSale.paymentStatus === 'partial' && (
                      <Badge className="bg-yellow-500 text-white">Partial</Badge>
                    )}
                    {viewingSale.paymentStatus === 'unpaid' && (
                      <Badge className="bg-red-500 text-white">Unpaid</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label>Payment Method</Label>
                <p className="font-medium capitalize">{viewingSale.paymentMethod.replace('_', ' ')}</p>
              </div>

              {viewingSale.paymentHistory && viewingSale.paymentHistory.length > 0 && (
                <div>
                  <Label>Payment History</Label>
                  <div className="mt-2 space-y-2">
                    {viewingSale.paymentHistory.map((payment, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-gray-500">
                            {payment.method.replace('_', ' ')} • {formatDate(payment.date)}
                          </p>
                          {payment.note && (
                            <p className="text-xs text-gray-600 mt-1">{payment.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
