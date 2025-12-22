import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  AlertTriangle,
  ShoppingCart,
  Truck,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useApp } from '../../contexts/AppContext';
import database from '../../lib/database';

export default function Dashboard() {
  const { state } = useApp();
  const { user } = state;
  const [dashboardData, setDashboardData] = useState({
    sales: [],
    purchases: [],
    rawMaterials: [],
    products: [],
    customers: [],
    suppliers: [],
    loading: true
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [sales, purchases, rawMaterials, products, customers, suppliers] = await Promise.all([
        database.getAll('sales'),
        database.getAll('purchases'),
        database.getAll('rawMaterials'),
        database.getAll('sofaModels'), // Fixed: use sofaModels instead of products
        database.getAll('customers'),
        database.getAll('suppliers')
      ]);

      console.log('Dashboard data loaded:', {
        sales: sales?.length || 0,
        purchases: purchases?.length || 0,
        rawMaterials: rawMaterials?.length || 0,
        products: products?.length || 0,
        customers: customers?.length || 0,
        suppliers: suppliers?.length || 0
      });

      // Filter by location if user is not admin (but not for customers/suppliers)
      const filterByLocation = (items) => {
        if (user?.role === 'admin') return items;
        return items.filter(item => item.location === user?.location);
      };

      setDashboardData({
        sales: filterByLocation(sales || []),
        purchases: filterByLocation(purchases || []),
        rawMaterials: filterByLocation(rawMaterials || []),
        products: products || [], // Don't filter products by location
        customers: customers || [], // Don't filter customers by location
        suppliers: suppliers || [], // Don't filter suppliers by location
        loading: false
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  if (dashboardData.loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalSales = dashboardData.sales.filter(sale => sale.approvalStatus === 'approved').length;
  const pendingSales = dashboardData.sales.filter(sale => sale.approvalStatus === 'pending').length;
  const totalRevenue = dashboardData.sales
    .filter(sale => sale.approvalStatus === 'approved')
    .reduce((sum, sale) => sum + (parseFloat(sale.totalAmount) || parseFloat(sale.salePrice) || 0), 0);
  
  const lowStockItems = dashboardData.rawMaterials.filter(material => 
    (material.currentStock || 0) <= (material.minStock || 10)
  ).length;

  const StatCard = ({ title, value, icon: Icon, color = "blue", description }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Welcome section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your factory today
          </p>
        </div>
        {user?.location && (
          <Badge variant="outline" className="text-sm">
            {user.location}
          </Badge>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={totalSales}
          icon={ShoppingCart}
          color="blue"
          description={`${pendingSales} pending approval`}
        />
        
        <StatCard
          title="Revenue"
          value={`NPR ${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
          description="From completed sales"
        />

        <StatCard
          title="Customers"
          value={dashboardData.customers.length}
          icon={Users}
          color="purple"
          description="Active customers"
        />

        <StatCard
          title="Suppliers"
          value={dashboardData.suppliers.length}
          icon={Truck}
          color="orange"
          description="Active suppliers"
        />
      </div>

      {/* Alerts */}
      {(pendingSales > 0 || lowStockItems > 0) && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts & Notifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingSales > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-orange-100">
                      <ShoppingCart className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pending Sales</p>
                      <p className="text-xs text-gray-500">{pendingSales} sales need approval</p>
                    </div>
                    <Badge variant="secondary">{pendingSales}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {lowStockItems > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-red-100">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Low Stock</p>
                      <p className="text-xs text-gray-500">{lowStockItems} items need restocking</p>
                    </div>
                    <Badge variant="destructive">{lowStockItems}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Quick overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Inventory Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Raw Materials</span>
                <span className="font-medium">{dashboardData.rawMaterials.length} types</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Finished Products</span>
                <span className="font-medium">{dashboardData.products.length} models</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Low Stock Alerts</span>
                <Badge variant={lowStockItems > 0 ? "destructive" : "secondary"}>
                  {lowStockItems}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Sales Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Sales</span>
                <span className="font-medium">{totalSales}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Approval</span>
                <Badge variant={pendingSales > 0 ? "secondary" : "outline"}>
                  {pendingSales}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="font-medium text-green-600">NPR {totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            // Combine and sort recent activities
            const activities = [];
            
            // Add recent sales
            dashboardData.sales.slice(0, 5).forEach(sale => {
              activities.push({
                type: 'sale',
                icon: '💰',
                title: `Sale ${sale.saleNumber}`,
                description: `${sale.customerName} - ${sale.productName}`,
                amount: `NPR ${sale.totalAmount?.toLocaleString() || 0}`,
                status: sale.approvalStatus || 'pending',
                date: sale.createdAt
              });
            });
            
            // Add recent purchases
            dashboardData.purchases.slice(0, 3).forEach(purchase => {
              activities.push({
                type: 'purchase',
                icon: '📦',
                title: `Purchase #${purchase.id}`,
                description: purchase.supplierName || 'Raw materials',
                amount: `NPR ${purchase.totalAmount?.toLocaleString() || 0}`,
                status: 'completed',
                date: purchase.createdAt
              });
            });
            
            // Sort by date (most recent first)
            activities.sort((a, b) => new Date(b.date) - new Date(a.date));
            const recentActivities = activities.slice(0, 8);
            
            return recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-2xl">{activity.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-green-600">{activity.amount}</p>
                      {activity.status === 'pending' && (
                        <Badge className="bg-orange-500 text-white text-xs mt-1">Pending</Badge>
                      )}
                      {activity.status === 'approved' && (
                        <Badge className="bg-green-500 text-white text-xs mt-1">Approved</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activities</p>
                <p className="text-sm">Sales and purchases will appear here</p>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}

