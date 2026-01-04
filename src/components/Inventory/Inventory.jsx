import React, { useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Package, Boxes, AlertTriangle, XCircle } from 'lucide-react';

export default function Inventory() {
  const { state, actions } = useApp();
  const { rawMaterials = [], sofaModels = [] } = state;

  // Calculate real stats from database
  const inventoryStats = useMemo(() => {
    // Raw Materials stats
    const rawMaterialCount = rawMaterials.length;
    const rawMaterialValue = rawMaterials.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);

    // Finished Products stats (sofaModels with stock)
    const finishedProductCount = sofaModels.length;
    const finishedProductValue = sofaModels.reduce((sum, item) => {
      const stock = parseFloat(item.stock) || 0;
      const price = parseFloat(item.sellingPrice) || parseFloat(item.basePrice) || 0;
      return sum + (stock * price);
    }, 0);

    // Low stock items (raw materials with quantity < minStock or < 10)
    const lowStockItems = rawMaterials.filter(item => {
      const qty = parseFloat(item.quantity) || 0;
      const minStock = parseFloat(item.minStock) || 10;
      return qty > 0 && qty < minStock;
    });

    // Out of stock items (raw materials with quantity = 0)
    const outOfStockItems = rawMaterials.filter(item => {
      const qty = parseFloat(item.quantity) || 0;
      return qty <= 0;
    });

    return [
      { 
        label: 'Raw Materials', 
        count: rawMaterialCount, 
        value: `रू ${rawMaterialValue.toLocaleString()}`, 
        color: 'bg-blue-500',
        icon: Package
      },
      { 
        label: 'Finished Products', 
        count: finishedProductCount, 
        value: `रू ${finishedProductValue.toLocaleString()}`, 
        color: 'bg-green-500',
        icon: Boxes
      },
      { 
        label: 'Low Stock Items', 
        count: lowStockItems.length, 
        color: 'bg-yellow-500',
        icon: AlertTriangle
      },
      { 
        label: 'Out of Stock', 
        count: outOfStockItems.length, 
        color: 'bg-red-500',
        icon: XCircle
      }
    ];
  }, [rawMaterials, sofaModels]);

  // Get recent activity from actual data
  const recentActivity = useMemo(() => {
    const activities = [];

    // Recent raw materials (last 5 added/updated)
    const recentRawMaterials = [...rawMaterials]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 3);

    recentRawMaterials.forEach(item => {
      activities.push({
        text: `${item.name} - ${item.quantity} ${item.unit || 'units'} in stock`,
        time: item.updatedAt || item.createdAt,
        color: 'bg-green-500'
      });
    });

    // Recent finished products
    const recentProducts = [...sofaModels]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 2);

    recentProducts.forEach(item => {
      activities.push({
        text: `${item.name} - ${item.stock || 0} units in stock`,
        time: item.updatedAt || item.createdAt,
        color: 'bg-blue-500'
      });
    });

    // Low stock alerts
    rawMaterials
      .filter(item => {
        const qty = parseFloat(item.quantity) || 0;
        const minStock = parseFloat(item.minStock) || 10;
        return qty > 0 && qty < minStock;
      })
      .slice(0, 2)
      .forEach(item => {
        activities.push({
          text: `Low stock alert: ${item.name}`,
          time: new Date().toISOString(),
          color: 'bg-yellow-500'
        });
      });

    return activities.slice(0, 5);
  }, [rawMaterials, sofaModels]);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600">Overview of raw materials and finished products inventory</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {inventoryStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  {stat.value && <p className="text-sm text-gray-500 mt-1">{stat.value}</p>}
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => actions.setCurrentView('raw-materials')}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left rounded-lg transition-colors flex items-center justify-between"
            >
              <span className="text-gray-900">Manage Raw Materials</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => actions.setCurrentView('finished-products')}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left rounded-lg transition-colors flex items-center justify-between"
            >
              <span className="text-gray-900">Manage Finished Products</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => actions.setCurrentView('suppliers')}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left rounded-lg transition-colors flex items-center justify-between"
            >
              <span className="text-gray-900">View Suppliers</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start">
                  <div className={`w-2 h-2 ${activity.color} rounded-full mt-2 mr-3`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.text}</p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No recent activity</p>
              <p className="text-gray-400 text-xs mt-1">Add raw materials or products to see activity here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
