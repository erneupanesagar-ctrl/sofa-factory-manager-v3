import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Search, Edit, Trash2, UserCheck, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import database from '../../lib/database';

export default function Labour() {
  const { state, actions } = useApp();
  
  const [labourers, setLabourers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isLabourerDialogOpen, setIsLabourerDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  const [editingLabourer, setEditingLabourer] = useState(null);
  const [selectedLabourer, setSelectedLabourer] = useState(null);
  
  const [labourerFormData, setLabourerFormData] = useState({
    name: '',
    phone: '',
    address: '',
    dailyWage: '',
    specialization: 'Carpenter',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  const [attendanceFormData, setAttendanceFormData] = useState({
    labourerId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    hoursWorked: '8',
    notes: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    labourerId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'Cash',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [labourersData, attendanceData, paymentsData] = await Promise.all([
        database.getAll('labourers'),
        database.getAll('attendance'),
        database.getAll('labourPayments')
      ]);
      
      setLabourers(labourersData || []);
      setAttendance(attendanceData || []);
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error loading labour data:', error);
    }
  };

  const filteredLabourers = labourers.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.phone && l.phone.includes(searchTerm)) ||
    (l.specialization && l.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Labourer Management
  const handleOpenLabourerDialog = (labourer = null) => {
    if (labourer) {
      setEditingLabourer(labourer);
      setLabourerFormData({
        name: labourer.name,
        phone: labourer.phone || '',
        address: labourer.address || '',
        dailyWage: labourer.dailyWage?.toString() || '',
        specialization: labourer.specialization || 'Carpenter',
        joinDate: labourer.joinDate || new Date().toISOString().split('T')[0],
        status: labourer.status || 'active'
      });
    } else {
      setEditingLabourer(null);
      setLabourerFormData({
        name: '',
        phone: '',
        address: '',
        dailyWage: '',
        specialization: 'Carpenter',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active'
      });
    }
    setIsLabourerDialogOpen(true);
  };

  const handleCloseLabourerDialog = () => {
    setIsLabourerDialogOpen(false);
    setEditingLabourer(null);
  };

  const handleSubmitLabourer = async (e) => {
    e.preventDefault();
    
    if (!labourerFormData.name || !labourerFormData.dailyWage) {
      alert('Please fill in required fields (Name and Daily Wage)');
      return;
    }

    try {
      const labourerData = {
        name: labourerFormData.name,
        phone: labourerFormData.phone,
        address: labourerFormData.address,
        dailyWage: parseFloat(labourerFormData.dailyWage),
        specialization: labourerFormData.specialization,
        joinDate: labourerFormData.joinDate,
        status: labourerFormData.status,
        createdAt: editingLabourer?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingLabourer) {
        await database.update('labourers', { ...labourerData, id: editingLabourer.id });
        alert('Labourer updated successfully!');
      } else {
        await database.add('labourers', labourerData);
        alert('Labourer added successfully!');
      }
      
      await loadData();
      handleCloseLabourerDialog();
    } catch (error) {
      console.error('Error saving labourer:', error);
      alert('Failed to save labourer. Please try again.');
    }
  };

  const handleDeleteLabourer = async (labourer) => {
    if (!window.confirm(`Are you sure you want to delete ${labourer.name}?`)) {
      return;
    }

    try {
      await database.delete('labourers', labourer.id);
      alert('Labourer deleted successfully!');
      await loadData();
    } catch (error) {
      console.error('Error deleting labourer:', error);
      alert('Failed to delete labourer. Please try again.');
    }
  };

  // Attendance Management
  const handleOpenAttendanceDialog = (labourer = null) => {
    if (labourer) {
      setSelectedLabourer(labourer);
      setAttendanceFormData({
        labourerId: labourer.id.toString(),
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        hoursWorked: '8',
        notes: ''
      });
    } else {
      setSelectedLabourer(null);
      setAttendanceFormData({
        labourerId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        hoursWorked: '8',
        notes: ''
      });
    }
    setIsAttendanceDialogOpen(true);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    
    if (!attendanceFormData.labourerId) {
      alert('Please select a labourer');
      return;
    }

    try {
      const labourer = labourers.find(l => l.id === parseInt(attendanceFormData.labourerId));
      
      const attendanceData = {
        labourerId: parseInt(attendanceFormData.labourerId),
        labourerName: labourer?.name || '',
        date: attendanceFormData.date,
        status: attendanceFormData.status,
        hoursWorked: parseFloat(attendanceFormData.hoursWorked) || 0,
        notes: attendanceFormData.notes,
        createdAt: new Date().toISOString()
      };

      await database.add('attendance', attendanceData);
      alert('Attendance marked successfully!');
      
      await loadData();
      setIsAttendanceDialogOpen(false);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    }
  };

  // Payment Management
  const handleOpenPaymentDialog = (labourer = null) => {
    if (labourer) {
      setSelectedLabourer(labourer);
      setPaymentFormData({
        labourerId: labourer.id.toString(),
        date: new Date().toISOString().split('T')[0],
        amount: labourer.dailyWage?.toString() || '',
        paymentMethod: 'Cash',
        notes: ''
      });
    } else {
      setSelectedLabourer(null);
      setPaymentFormData({
        labourerId: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMethod: 'Cash',
        notes: ''
      });
    }
    setIsPaymentDialogOpen(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentFormData.labourerId || !paymentFormData.amount) {
      alert('Please fill in required fields');
      return;
    }

    try {
      const labourer = labourers.find(l => l.id === parseInt(paymentFormData.labourerId));
      
      const paymentData = {
        labourerId: parseInt(paymentFormData.labourerId),
        labourerName: labourer?.name || '',
        date: paymentFormData.date,
        amount: parseFloat(paymentFormData.amount),
        paymentMethod: paymentFormData.paymentMethod,
        notes: paymentFormData.notes,
        createdAt: new Date().toISOString()
      };

      await database.add('labourPayments', paymentData);
      alert('Payment recorded successfully!');
      
      await loadData();
      setIsPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment. Please try again.');
    }
  };

  // Calculate metrics
  const activeLabourers = labourers.filter(l => l.status === 'active').length;
  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const thisMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.date);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + (p.amount || 0), 0);

  const todayAttendance = attendance.filter(a => a.date === new Date().toISOString().split('T')[0]);
  const presentToday = todayAttendance.filter(a => a.status === 'present').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Labour Management</h1>
        <p className="text-gray-600 mt-1">Manage labourers, track attendance, and record payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Labourers</CardDescription>
            <CardTitle className="text-2xl">{activeLabourers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Present Today</CardDescription>
            <CardTitle className="text-2xl text-green-600">{presentToday}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month Payments</CardDescription>
            <CardTitle className="text-2xl">NPR {thisMonthPayments.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Payments</CardDescription>
            <CardTitle className="text-2xl">NPR {totalPayments.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="labourers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="labourers">Labourers</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Labourers Tab */}
        <TabsContent value="labourers" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search labourers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => handleOpenLabourerDialog()} className="whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" />
              Add Labourer
            </Button>
          </div>

          {filteredLabourers.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Daily Wage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLabourers.map(labourer => (
                      <TableRow key={labourer.id}>
                        <TableCell>
                          <div className="font-medium">{labourer.name}</div>
                          {labourer.address && (
                            <div className="text-sm text-gray-500">{labourer.address}</div>
                          )}
                        </TableCell>
                        <TableCell>{labourer.phone}</TableCell>
                        <TableCell>{labourer.specialization}</TableCell>
                        <TableCell className="font-medium">NPR {labourer.dailyWage}</TableCell>
                        <TableCell>
                          <Badge variant={labourer.status === 'active' ? 'success' : 'default'}>
                            {labourer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenAttendanceDialog(labourer)}
                              title="Mark Attendance"
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenPaymentDialog(labourer)}
                              title="Record Payment"
                            >
                              <DollarSign className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenLabourerDialog(labourer)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteLabourer(labourer)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserCheck className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No labourers found' : 'No labourers yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Try adjusting your search' : 'Add your first labourer to get started'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenLabourerDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Labourer
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenAttendanceDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Mark Attendance
            </Button>
          </div>

          {attendance.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Labourer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.slice(0, 50).map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.labourerName}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'present' ? 'success' : record.status === 'absent' ? 'destructive' : 'warning'}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.hoursWorked} hrs</TableCell>
                        <TableCell className="text-sm text-gray-600">{record.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No attendance records</h3>
                <p className="text-gray-600 mb-4">Start marking attendance for your labourers</p>
                <Button onClick={() => handleOpenAttendanceDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Mark Attendance
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenPaymentDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>

          {payments.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Labourer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 50).map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell>{payment.labourerName}</TableCell>
                        <TableCell className="font-medium">NPR {payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell className="text-sm text-gray-600">{payment.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment records</h3>
                <p className="text-gray-600 mb-4">Start recording payments for your labourers</p>
                <Button onClick={() => handleOpenPaymentDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Labourer Dialog */}
      <Dialog open={isLabourerDialogOpen} onOpenChange={setIsLabourerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLabourer ? 'Edit Labourer' : 'Add New Labourer'}</DialogTitle>
            <DialogDescription>
              {editingLabourer ? 'Update labourer information' : 'Enter labourer details'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitLabourer}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={labourerFormData.name}
                    onChange={(e) => setLabourerFormData({ ...labourerFormData, name: e.target.value })}
                    placeholder="e.g., Ram Bahadur"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={labourerFormData.phone}
                    onChange={(e) => setLabourerFormData({ ...labourerFormData, phone: e.target.value })}
                    placeholder="e.g., 9841234567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={labourerFormData.address}
                  onChange={(e) => setLabourerFormData({ ...labourerFormData, address: e.target.value })}
                  placeholder="e.g., Kathmandu"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Select
                    value={labourerFormData.specialization}
                    onValueChange={(value) => setLabourerFormData({ ...labourerFormData, specialization: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Carpenter">Carpenter</SelectItem>
                      <SelectItem value="Upholsterer">Upholsterer</SelectItem>
                      <SelectItem value="Painter">Painter</SelectItem>
                      <SelectItem value="Helper">Helper</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyWage">
                    Daily Wage (NPR) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dailyWage"
                    type="number"
                    step="0.01"
                    min="0"
                    value={labourerFormData.dailyWage}
                    onChange={(e) => setLabourerFormData({ ...labourerFormData, dailyWage: e.target.value })}
                    placeholder="e.g., 1500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="joinDate">Join Date</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={labourerFormData.joinDate}
                    onChange={(e) => setLabourerFormData({ ...labourerFormData, joinDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={labourerFormData.status}
                    onValueChange={(value) => setLabourerFormData({ ...labourerFormData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseLabourerDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingLabourer ? 'Update Labourer' : 'Add Labourer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mark Attendance Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              {selectedLabourer ? `Mark attendance for ${selectedLabourer.name}` : 'Select a labourer and mark attendance'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitAttendance}>
            <div className="space-y-4 py-4">
              {!selectedLabourer && (
                <div className="space-y-2">
                  <Label htmlFor="labourerId">
                    Labourer <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={attendanceFormData.labourerId}
                    onValueChange={(value) => setAttendanceFormData({ ...attendanceFormData, labourerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select labourer" />
                    </SelectTrigger>
                    <SelectContent>
                      {labourers.filter(l => l.status === 'active').map(labourer => (
                        <SelectItem key={labourer.id} value={labourer.id.toString()}>
                          {labourer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="attendanceDate">Date</Label>
                <Input
                  id="attendanceDate"
                  type="date"
                  value={attendanceFormData.date}
                  onChange={(e) => setAttendanceFormData({ ...attendanceFormData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendanceStatus">Status</Label>
                <Select
                  value={attendanceFormData.status}
                  onValueChange={(value) => setAttendanceFormData({ ...attendanceFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half-day">Half Day</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hoursWorked">Hours Worked</Label>
                <Input
                  id="hoursWorked"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={attendanceFormData.hoursWorked}
                  onChange={(e) => setAttendanceFormData({ ...attendanceFormData, hoursWorked: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendanceNotes">Notes</Label>
                <Textarea
                  id="attendanceNotes"
                  value={attendanceFormData.notes}
                  onChange={(e) => setAttendanceFormData({ ...attendanceFormData, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Mark Attendance</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {selectedLabourer ? `Record payment for ${selectedLabourer.name}` : 'Select a labourer and record payment'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPayment}>
            <div className="space-y-4 py-4">
              {!selectedLabourer && (
                <div className="space-y-2">
                  <Label htmlFor="paymentLabourerId">
                    Labourer <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={paymentFormData.labourerId}
                    onValueChange={(value) => {
                      const labourer = labourers.find(l => l.id === parseInt(value));
                      setPaymentFormData({ 
                        ...paymentFormData, 
                        labourerId: value,
                        amount: labourer?.dailyWage?.toString() || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select labourer" />
                    </SelectTrigger>
                    <SelectContent>
                      {labourers.filter(l => l.status === 'active').map(labourer => (
                        <SelectItem key={labourer.id} value={labourer.id.toString()}>
                          {labourer.name} (NPR {labourer.dailyWage}/day)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentFormData.date}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount (NPR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  placeholder="e.g., 1500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={paymentFormData.paymentMethod}
                  onValueChange={(value) => setPaymentFormData({ ...paymentFormData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Mobile Payment">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentNotes">Notes</Label>
                <Textarea
                  id="paymentNotes"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
