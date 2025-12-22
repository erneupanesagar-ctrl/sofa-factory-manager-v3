import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { FileText, Download, Calendar, TrendingUp, Package, DollarSign, Users, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import database from '../../lib/database';

export default function Reports() {
  const { state } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    {
      id: 'sales',
      name: 'Sales Report',
      description: 'Detailed sales analysis and trends',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      id: 'inventory',
      name: 'Inventory Report',
      description: 'Stock levels and inventory valuation',
      icon: <Package className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      id: 'financial',
      name: 'Financial Report',
      description: 'Profit & loss, revenue, and expenses',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-purple-500'
    },
    {
      id: 'labour',
      name: 'Labour Report',
      description: 'Attendance, payments, and productivity',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-yellow-500'
    },
    {
      id: 'orders',
      name: 'Orders Report',
      description: 'Order status, completion rates',
      icon: <ClipboardList className="w-6 h-6" />,
      color: 'bg-red-500'
    },
    {
      id: 'customers',
      name: 'Customer Report',
      description: 'Customer insights and purchase history',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-indigo-500'
    }
  ];

  const filterByPeriod = (data, dateField = 'date') => {
    const now = new Date();
    const startDate = new Date();

    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= now;
    });
  };

  const generateReport = async (reportType) => {
    setLoading(true);
    setSelectedReport(reportType);

    try {
      let data = {};

      switch (reportType) {
        case 'sales':
          data = await generateSalesReport();
          break;
        case 'inventory':
          data = await generateInventoryReport();
          break;
        case 'financial':
          data = await generateFinancialReport();
          break;
        case 'labour':
          data = await generateLabourReport();
          break;
        case 'orders':
          data = await generateOrdersReport();
          break;
        case 'customers':
          data = await generateCustomersReport();
          break;
        default:
          data = {};
      }

      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateSalesReport = async () => {
    const sales = await database.getAll('sales');
    const filteredSales = filterByPeriod(sales.filter(s => s.approvalStatus === 'approved'));

    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top products
    const productSales = {};
    filteredSales.forEach(sale => {
      const key = sale.productName;
      if (!productSales[key]) {
        productSales[key] = { name: key, quantity: 0, revenue: 0 };
      }
      productSales[key].quantity += sale.quantity || 0;
      productSales[key].revenue += sale.totalAmount || 0;
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalSales,
      totalRevenue,
      averageSale,
      topProducts,
      salesList: filteredSales
    };
  };

  const generateInventoryReport = async () => {
    const rawMaterials = await database.getAll('rawMaterials');
    const finishedProducts = await database.getAll('sofaModels');

    const totalRawMaterialValue = rawMaterials.reduce((sum, m) => 
      sum + (m.quantity * m.pricePerUnit || 0), 0
    );

    const totalFinishedValue = finishedProducts.reduce((sum, p) => 
      sum + ((p.stockQuantity || 0) * (p.sellingPrice || 0)), 0
    );

    const lowStockMaterials = rawMaterials.filter(m => 
      m.quantity < (m.minimumStock || 10)
    );

    const lowStockProducts = finishedProducts.filter(p => 
      (p.stockQuantity || 0) === 0
    );

    return {
      rawMaterials,
      finishedProducts,
      totalRawMaterialValue,
      totalFinishedValue,
      lowStockMaterials,
      lowStockProducts
    };
  };

  const generateFinancialReport = async () => {
    const sales = await database.getAll('sales');
    const purchases = await database.getAll('purchases');
    const labourPayments = await database.getAll('labourPayments');
    const cleaningServices = await database.getAll('cleaningServices');

    const filteredSales = filterByPeriod(sales.filter(s => s.approvalStatus === 'approved'));
    const filteredPurchases = filterByPeriod(purchases);
    const filteredLabour = filterByPeriod(labourPayments);
    const filteredCleaning = filterByPeriod(cleaningServices.filter(s => s.status === 'completed'));

    const salesRevenue = filteredSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const cleaningRevenue = filteredCleaning.reduce((sum, s) => sum + (s.price || 0), 0);
    const totalRevenue = salesRevenue + cleaningRevenue;

    const purchaseExpenses = filteredPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const labourExpenses = filteredLabour.reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalExpenses = purchaseExpenses + labourExpenses;

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    return {
      totalRevenue,
      salesRevenue,
      cleaningRevenue,
      totalExpenses,
      purchaseExpenses,
      labourExpenses,
      netProfit,
      profitMargin
    };
  };

  const generateLabourReport = async () => {
    const labourers = await database.getAll('labourers');
    const attendance = await database.getAll('attendance');
    const payments = await database.getAll('labourPayments');

    const filteredAttendance = filterByPeriod(attendance);
    const filteredPayments = filterByPeriod(payments);

    const totalPayments = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const activeLabourers = labourers.filter(l => l.status === 'active').length;

    const labourerStats = labourers.map(labourer => {
      const labourerAttendance = filteredAttendance.filter(a => a.labourerId === labourer.id);
      const labourerPayments = filteredPayments.filter(p => p.labourerId === labourer.id);
      
      const presentDays = labourerAttendance.filter(a => a.status === 'present').length;
      const totalPaid = labourerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        name: labourer.name,
        specialization: labourer.specialization,
        presentDays,
        totalPaid
      };
    });

    return {
      activeLabourers,
      totalPayments,
      labourerStats,
      attendanceRecords: filteredAttendance
    };
  };

  const generateOrdersReport = async () => {
    const orders = await database.getAll('orders');
    const filteredOrders = filterByPeriod(orders);

    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
    const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;

    return {
      totalOrders,
      completedOrders,
      pendingOrders,
      completionRate,
      ordersList: filteredOrders
    };
  };

  const generateCustomersReport = async () => {
    const customers = await database.getAll('customers');
    const sales = await database.getAll('sales');

    const filteredSales = filterByPeriod(sales.filter(s => s.approvalStatus === 'approved'));

    const customerStats = customers.map(customer => {
      const customerSales = filteredSales.filter(s => s.customerId === customer.id);
      const totalPurchases = customerSales.length;
      const totalSpent = customerSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      return {
        name: customer.name,
        phone: customer.phone,
        totalPurchases,
        totalSpent
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    const topCustomers = customerStats.slice(0, 10);

    return {
      totalCustomers: customers.length,
      activeCustomers: customerStats.filter(c => c.totalPurchases > 0).length,
      topCustomers,
      customerStats
    };
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      default: return 'This Month';
    }
  };

  const downloadReport = () => {
    if (!reportData || !selectedReport) return;

    const reportType = reportTypes.find(r => r.id === selectedReport);
    const reportContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType.name.replace(' ', '_')}_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view business reports</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report Types Grid */}
      {!selectedReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => generateReport(report.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`${report.color} text-white p-3 rounded-lg`}>
                    {report.icon}
                  </div>
                </div>
                <CardTitle className="mt-4">{report.name}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Report View */}
      {selectedReport && reportData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => { setSelectedReport(null); setReportData(null); }}>
              ← Back to Reports
            </Button>
            <Button onClick={downloadReport}>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>

          {/* Sales Report */}
          {selectedReport === 'sales' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Sales</CardDescription>
                    <CardTitle className="text-2xl">{reportData.totalSales}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Revenue</CardDescription>
                    <CardTitle className="text-2xl">NPR {reportData.totalRevenue.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Average Sale</CardDescription>
                    <CardTitle className="text-2xl">NPR {reportData.averageSale.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity Sold</TableHead>
                        <TableHead>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.topProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>NPR {product.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Inventory Report */}
          {selectedReport === 'inventory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Raw Materials Value</CardDescription>
                    <CardTitle className="text-2xl">NPR {reportData.totalRawMaterialValue.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Finished Products Value</CardDescription>
                    <CardTitle className="text-2xl">NPR {reportData.totalFinishedValue.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Low Stock Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">Raw Materials ({reportData.lowStockMaterials.length})</p>
                    {reportData.lowStockMaterials.map((material, index) => (
                      <div key={index} className="text-sm text-red-600">
                        {material.name}: {material.quantity} {material.unit}
                      </div>
                    ))}
                    <p className="font-medium mt-4">Finished Products ({reportData.lowStockProducts.length})</p>
                    {reportData.lowStockProducts.map((product, index) => (
                      <div key={index} className="text-sm text-red-600">
                        {product.name}: Out of stock
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Financial Report */}
          {selectedReport === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Revenue</CardDescription>
                    <CardTitle className="text-2xl text-green-600">NPR {reportData.totalRevenue.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Expenses</CardDescription>
                    <CardTitle className="text-2xl text-red-600">NPR {reportData.totalExpenses.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Net Profit</CardDescription>
                    <CardTitle className="text-2xl text-blue-600">NPR {reportData.netProfit.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Profit Margin</CardDescription>
                    <CardTitle className="text-2xl">{reportData.profitMargin}%</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Sales</span>
                        <span className="font-medium">NPR {reportData.salesRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cleaning Services</span>
                        <span className="font-medium">NPR {reportData.cleaningRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Raw Materials</span>
                        <span className="font-medium">NPR {reportData.purchaseExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labour</span>
                        <span className="font-medium">NPR {reportData.labourExpenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Labour Report */}
          {selectedReport === 'labour' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Active Labourers</CardDescription>
                    <CardTitle className="text-2xl">{reportData.activeLabourers}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Payments ({getPeriodLabel()})</CardDescription>
                    <CardTitle className="text-2xl">NPR {reportData.totalPayments.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Labourer Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Present Days</TableHead>
                        <TableHead>Total Paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.labourerStats.map((labourer, index) => (
                        <TableRow key={index}>
                          <TableCell>{labourer.name}</TableCell>
                          <TableCell>{labourer.specialization}</TableCell>
                          <TableCell>{labourer.presentDays}</TableCell>
                          <TableCell>NPR {labourer.totalPaid.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders Report */}
          {selectedReport === 'orders' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Orders</CardDescription>
                    <CardTitle className="text-2xl">{reportData.totalOrders}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Completed</CardDescription>
                    <CardTitle className="text-2xl text-green-600">{reportData.completedOrders}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Pending</CardDescription>
                    <CardTitle className="text-2xl text-orange-600">{reportData.pendingOrders}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Completion Rate</CardDescription>
                    <CardTitle className="text-2xl">{reportData.completionRate}%</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>
          )}

          {/* Customers Report */}
          {selectedReport === 'customers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Customers</CardDescription>
                    <CardTitle className="text-2xl">{reportData.totalCustomers}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Active Customers ({getPeriodLabel()})</CardDescription>
                    <CardTitle className="text-2xl">{reportData.activeCustomers}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Purchases</TableHead>
                        <TableHead>Total Spent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.topCustomers.map((customer, index) => (
                        <TableRow key={index}>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{customer.totalPurchases}</TableCell>
                          <TableCell>NPR {customer.totalSpent.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating report...</p>
          </div>
        </div>
      )}
    </div>
  );
}
