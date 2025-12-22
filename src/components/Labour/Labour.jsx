import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function Labour() {
  const { state, actions } = useApp();
  const [labourers, setLabourers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedLabourer, setSelectedLabourer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    dailyWage: '',
    specialization: '',
    joinDate: new Date().toISOString().split('T')[0]
  });
  const [attendanceData, setAttendanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    hoursWorked: '8',
    notes: ''
  });

  useEffect(() => {
    loadLabourers();
  }, []);

  const loadLabourers = async () => {
    // In a real app, this would fetch from database
    // For now, using mock data
    const mockLabourers = [
      {
        id: '1',
        name: 'Ram Bahadur',
        phone: '9841234567',
        address: 'Kathmandu',
        dailyWage: 1500,
        specialization: 'Carpenter',
        joinDate: '2024-01-15',
        status: 'active'
      }
    ];
    setLabourers(mockLabourers);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAttendanceChange = (e) => {
    const { name, value } = e.target;
    setAttendanceData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddLabourer = async (e) => {
    e.preventDefault();
    const newLabourer = {
      id: Date.now().toString(),
      ...formData,
      dailyWage: parseFloat(formData.dailyWage),
      status: 'active'
    };
    setLabourers(prev => [...prev, newLabourer]);
    setShowAddModal(false);
    setFormData({
      name: '',
      phone: '',
      address: '',
      dailyWage: '',
      specialization: '',
      joinDate: new Date().toISOString().split('T')[0]
    });
    alert('Labourer added successfully!');
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    alert(`Attendance marked for ${selectedLabourer.name}`);
    setShowAttendanceModal(false);
    setSelectedLabourer(null);
  };

  const filteredLabourers = labourers.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone.includes(searchTerm) ||
    l.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Labour Management</h1>
        <p className="text-gray-600">Track labour attendance, payments, and performance</p>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search labourers..."
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
          Add Labourer
        </button>
      </div>

      {/* Labourers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Wage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLabourers.map(labourer => (
              <tr key={labourer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{labourer.name}</div>
                  <div className="text-sm text-gray-500">{labourer.address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{labourer.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{labourer.specialization}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">रू {labourer.dailyWage}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    labourer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {labourer.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedLabourer(labourer);
                      setShowAttendanceModal(true);
                    }}
                    className="text-slate-600 hover:text-slate-900 mr-3"
                  >
                    Mark Attendance
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Labourer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Labourer</h2>
            <form onSubmit={handleAddLabourer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="">Select...</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Upholsterer">Upholsterer</option>
                    <option value="Painter">Painter</option>
                    <option value="Helper">Helper</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Wage (रू) *</label>
                  <input
                    type="number"
                    name="dailyWage"
                    value={formData.dailyWage}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                  <input
                    type="date"
                    name="joinDate"
                    value={formData.joinDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                >
                  Add Labourer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showAttendanceModal && selectedLabourer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Mark Attendance - {selectedLabourer.name}</h2>
            <form onSubmit={handleMarkAttendance}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={attendanceData.date}
                    onChange={handleAttendanceChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={attendanceData.status}
                    onChange={handleAttendanceChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
                  <input
                    type="number"
                    name="hoursWorked"
                    value={attendanceData.hoursWorked}
                    onChange={handleAttendanceChange}
                    min="0"
                    max="24"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={attendanceData.notes}
                    onChange={handleAttendanceChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAttendanceModal(false);
                    setSelectedLabourer(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                >
                  Mark Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
