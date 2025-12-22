import React, { useState } from 'react';

export default function Purchases() {
  const [purchases, setPurchases] = useState([
    { id: '1', date: '2025-12-20', supplier: 'Timber Traders Ltd', items: 'Teak Wood - 50kg', amount: 40000, status: 'completed' },
    { id: '2', date: '2025-12-22', supplier: 'Fabric World', items: 'Blue Velvet - 30m', amount: 36000, status: 'pending' },
    { id: '3', date: '2025-12-23', supplier: 'Foam Industries', items: 'Foam Cushions - 20pcs', amount: 10000, status: 'completed' }
  ]);
  const [showAddModal, setShowAddModal] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
        <p className="text-gray-600">Track purchase orders and expenses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Purchases</p>
          <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">रू {totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
          <p className="text-2xl font-bold text-gray-900">{purchases.filter(p => p.status === 'pending').length}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Purchase
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchases.map(purchase => (
              <tr key={purchase.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.supplier}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{purchase.items}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">रू {purchase.amount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(purchase.status)}`}>
                    {purchase.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-slate-600 hover:text-slate-900 mr-3">View</button>
                  <button className="text-slate-600 hover:text-slate-900">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">New Purchase Order</h2>
            <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); alert('Purchase order created!'); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                  <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500">
                    <option value="">Select supplier...</option>
                    <option>Timber Traders Ltd</option>
                    <option>Fabric World</option>
                    <option>Foam Industries</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Items *</label>
                  <textarea required rows="3" placeholder="Describe items..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (रू) *</label>
                  <input type="number" required min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500">
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Create Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
