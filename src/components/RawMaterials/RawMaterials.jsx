import React, { useState } from 'react';

export default function RawMaterials() {
  const [materials, setMaterials] = useState([
    { id: '1', name: 'Teak Wood', quantity: 150, unit: 'kg', price: 800, minStock: 50, category: 'Wood' },
    { id: '2', name: 'Fabric - Blue Velvet', quantity: 80, unit: 'm', price: 1200, minStock: 30, category: 'Fabric' },
    { id: '3', name: 'Foam Cushion', quantity: 45, unit: 'pcs', price: 500, minStock: 20, category: 'Cushioning' },
    { id: '4', name: 'Screws & Nails', quantity: 500, unit: 'pcs', price: 5, minStock: 200, category: 'Hardware' }
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLowStockStatus = (quantity, minStock) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (quantity <= minStock) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Raw Materials</h1>
        <p className="text-gray-600">Track and manage raw materials stock levels</p>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="ml-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Material
        </button>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map(material => {
          const status = getLowStockStatus(material.quantity, material.minStock);
          return (
            <div key={material.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{material.name}</h3>
                  <p className="text-sm text-gray-500">{material.category}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quantity:</span>
                  <span className="text-sm font-medium text-gray-900">{material.quantity} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Price per unit:</span>
                  <span className="text-sm font-medium text-gray-900">रू {material.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Min Stock:</span>
                  <span className="text-sm font-medium text-gray-900">{material.minStock} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Value:</span>
                  <span className="text-sm font-medium text-gray-900">रू {(material.quantity * material.price).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                <button className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200">
                  Update Stock
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200">
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New Material</h2>
            <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); alert('Material added!'); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
                  <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500">
                    <option>Wood</option>
                    <option>Fabric</option>
                    <option>Cushioning</option>
                    <option>Hardware</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input type="number" required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500">
                      <option>kg</option>
                      <option>m</option>
                      <option>pcs</option>
                      <option>L</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per unit (रू)</label>
                    <input type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                    <input type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Add Material</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
