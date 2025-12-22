import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import database from '../../lib/database';

export default function Financials() {
  const { state, actions } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [labourPayments, setLabourPayments] = useState([]);
  const [cleaningServices, setCleaningServices] = useState([]);

  useEffect(() => {
    loadData();
  }, [actions]);

  const loadData = async () => {
    try {
      console.log('Financials: Loading data...');
      
      // Load each table separately to handle missing tables gracefully
      const salesData = await (actions.getAllSales ? actions.getAllSales() : database.getAll('sales')).catch(err => {
        console.warn('Failed to load sales:', err);
        return [];
      });
      
      const purchasesData = await database.getAll('purchases').catch(err => {
        console.warn('Failed to load purchases:', err);
        return [];
      });
      
      const labourData = await database.getAll('labourPayments').catch(err => {
        console.warn('Failed to load labour payments (table may not exist yet):', err.message);
        return [];
      });
      
      const cleaningData = await database.getAll('cleaningServices').catch(err => {
        console.warn('Failed to load cleaning services:', err);
        return [];
      });
      
      console.log('Financials: Loaded sales:', salesData?.length || 0);
      console.log('Financials: Loaded purchases:', purchasesData?.length || 0);
      console.log('Financials: Loaded labour:', labourData?.length || 0);
      console.log('Financials: Loaded cleaning:', cleaningData?.length || 0);
      
      setSales(salesData || []);
      setPurchases(purchasesData || []);
      setLabourPayments(labourData || []);
      setCleaningServices(cleaningData || []);
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  // Filter data by period
  const filterByPeriod = (data, dateField = 'date') => {
    const now = new Date();
    const startDate = new Date();

    switch (selectedPeriod) {
      case 'week':
        // Start of this week (Sunday)
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        // Start of this month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        // Start of this quarter
        const currentMonth = now.getMonth();
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
        startDate.setMonth(quarterStartMonth);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        // Start of this year
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        // Default to this month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
    }

    return data.filter(item => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField]);
      // Check if date is valid
      if (isNaN(itemDate.getTime())) return false;
      return itemDate >= startDate && itemDate <= now;
    });
  };

  // Calculate revenue
  const filteredSales = filterByPeriod(sales.filter(s => s.approvalStatus === 'approved'));
  const filteredCleaning = filterByPeriod(cleaningServices.filter(s => s.status === 'completed'));
  
  const salesRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const cleaningRevenue = filteredCleaning.reduce((sum, service) => sum + (service.price || 0), 0);
  const totalRevenue = salesRevenue + cleaningRevenue;

  // Calculate expenses
  const filteredPurchases = filterByPeriod(purchases);
  const filteredLabour = filterByPeriod(labourPayments);
  
  const purchaseExpenses = filteredPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
  const labourExpenses = filteredLabour.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const totalExpenses = purchaseExpenses + labourExpenses;

  // Calculate profit
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Expense breakdown
  const expenseBreakdown = [
    {
      category: 'Raw Materials',
      amount: purchaseExpenses,
      percentage: totalExpenses > 0 ? ((purchaseExpenses / totalExpenses) * 100).toFixed(1) : 0,
      color: 'bg-blue-600'
    },
    {
      category: 'Labour Costs',
      amount: labourExpenses,
      percentage: totalExpenses > 0 ? ((labourExpenses / totalExpenses) * 100).toFixed(1) : 0,
      color: 'bg-green-600'
    }
  ];

  // Revenue breakdown
  const revenueBreakdown = [
    {
      category: 'Sales',
      amount: salesRevenue,
      percentage: totalRevenue > 0 ? ((salesRevenue / totalRevenue) * 100).toFixed(1) : 0,
      color: 'bg-purple-600'
    },
    {
      category: 'Cleaning Services',
      amount: cleaningRevenue,
      percentage: totalRevenue > 0 ? ((cleaningRevenue / totalRevenue) * 100).toFixed(1) : 0,
      color: 'bg-orange-600'
    }
  ];

  // Recent transactions (combined sales, purchases, labour payments)
  const recentTransactions = [
    ...filteredSales.map(sale => ({
      id: `sale-${sale.id}`,
      date: sale.date,
      type: 'income',
      description: `Sale to ${sale.customerName} - ${sale.productName}`,
      amount: sale.totalAmount
    })),
    ...filteredCleaning.map(service => ({
      id: `cleaning-${service.id}`,
      date: service.date,
      type: 'income',
      description: `Cleaning Service - ${service.customerName}`,
      amount: service.price
    })),
    ...filteredPurchases.map(purchase => ({
      id: `purchase-${purchase.id}`,
      date: purchase.date,
      type: 'expense',
      description: `Purchase - ${purchase.materialName} from ${purchase.supplierName}`,
      amount: purchase.totalAmount
    })),
    ...filteredLabour.map(payment => ({
      id: `labour-${payment.id}`,
      date: payment.date,
      type: 'expense',
      description: `Labour Payment - ${payment.labourerName}`,
      amount: payment.amount
    }))
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      default: return 'This Month';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financials</h1>
          <p className="text-gray-600 mt-1">Track revenue, expenses, and profitability</p>
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

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Revenue</CardDescription>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">NPR {totalRevenue.toLocaleString()}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Expenses</CardDescription>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">NPR {totalExpenses.toLocaleString()}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Net Profit</CardDescription>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                <DollarSign className={`w-5 h-5 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className={`text-2xl ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              NPR {netProfit.toLocaleString()}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Profit Margin</CardDescription>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{profitMargin}%</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{getPeriodLabel()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>{getPeriodLabel()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {revenueBreakdown.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.category}</span>
                      <span className="text-sm font-medium text-gray-900">NPR {item.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.percentage}% of total revenue</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>{getPeriodLabel()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expenseBreakdown.map((expense, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{expense.category}</span>
                      <span className="text-sm font-medium text-gray-900">NPR {expense.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${expense.color} h-2 rounded-full`}
                        style={{ width: `${expense.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{expense.percentage}% of total expenses</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Revenue</CardTitle>
                <CardDescription>{filteredSales.length} approved sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">NPR {salesRevenue.toLocaleString()}</div>
                <p className="text-sm text-gray-600 mt-2">
                  {totalRevenue > 0 ? ((salesRevenue / totalRevenue) * 100).toFixed(1) : 0}% of total revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cleaning Services Revenue</CardTitle>
                <CardDescription>{filteredCleaning.length} completed services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">NPR {cleaningRevenue.toLocaleString()}</div>
                <p className="text-sm text-gray-600 mt-2">
                  {totalRevenue > 0 ? ((cleaningRevenue / totalRevenue) * 100).toFixed(1) : 0}% of total revenue
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Raw Material Purchases</CardTitle>
                <CardDescription>{filteredPurchases.length} purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">NPR {purchaseExpenses.toLocaleString()}</div>
                <p className="text-sm text-gray-600 mt-2">
                  {totalExpenses > 0 ? ((purchaseExpenses / totalExpenses) * 100).toFixed(1) : 0}% of total expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Labour Payments</CardTitle>
                <CardDescription>{filteredLabour.length} payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">NPR {labourExpenses.toLocaleString()}</div>
                <p className="text-sm text-gray-600 mt-2">
                  {totalExpenses > 0 ? ((labourExpenses / totalExpenses) * 100).toFixed(1) : 0}% of total expenses
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Last 10 transactions from {getPeriodLabel().toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}NPR {transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No transactions in this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
