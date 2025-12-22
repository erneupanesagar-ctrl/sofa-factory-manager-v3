import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Building2, MapPin, Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';


export default function Settings() {
  const { state, actions } = useApp();
  const { company, locations } = state;


  // Company Profile State
  const [companyData, setCompanyData] = useState({
    name: company?.name || '',
    address: company?.address || '',
    phone: company?.phone || '',
    email: company?.email || '',
    labourManagerName: company?.labourManagerName || '',
    labourManagerPhone: company?.labourManagerPhone || ''
  });

  // Locations State
  const [locationsList, setLocationsList] = useState(
    locations && locations.length > 0
      ? locations
      : [{ name: '', address: '' }]
  );

  const handleCompanyChange = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCompany = async () => {
    try {
      // Validate required fields
      if (!companyData.name || !companyData.address || !companyData.phone) {
      alert("Please fill in all required fields (Name, Address, Phone)");
        return;
      }

      // Save company profile
      await actions.updateCompany(companyData);

      alert("Company profile updated successfully!");
    } catch (error) {
      console.error('Error saving company profile:', error);
      alert("Failed to save company profile. Please try again.");
    }
  };

  const handleLocationChange = (index, field, value) => {
    const updated = [...locationsList];
    updated[index] = { ...updated[index], [field]: value };
    setLocationsList(updated);
  };

  const handleAddLocation = () => {
    setLocationsList([...locationsList, { name: '', address: '' }]);
  };

  const handleRemoveLocation = (index) => {
    if (locationsList.length > 1) {
      setLocationsList(locationsList.filter((_, i) => i !== index));
    }
  };

  const handleSaveLocations = async () => {
    try {
      // Validate locations
      const validLocations = locationsList.filter(loc => loc.name && loc.address);
      
      if (validLocations.length === 0) {
      alert("Please add at least one location with name and address");
        return;
      }

      // Save locations
      await actions.updateLocations(validLocations);

      alert("Locations updated successfully!");
    } catch (error) {
      console.error('Error saving locations:', error);
      alert("Failed to save locations. Please try again.");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your application settings and preferences</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company" className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Company Profile</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>Locations</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Data Management</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Profile Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>
                Update your company information that appears in notifications and reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={companyData.name}
                    onChange={(e) => handleCompanyChange('name', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPhone">
                    Company Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyPhone"
                    value={companyData.phone}
                    onChange={(e) => handleCompanyChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => handleCompanyChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="labourManagerName">Labour Manager Name</Label>
                  <Input
                    id="labourManagerName"
                    value={companyData.labourManagerName}
                    onChange={(e) => handleCompanyChange('labourManagerName', e.target.value)}
                    placeholder="Enter labour manager name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="labourManagerPhone">Labour Manager Phone</Label>
                  <Input
                    id="labourManagerPhone"
                    value={companyData.labourManagerPhone}
                    onChange={(e) => handleCompanyChange('labourManagerPhone', e.target.value)}
                    placeholder="Enter labour manager phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">
                  Company Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="companyAddress"
                  value={companyData.address}
                  onChange={(e) => handleCompanyChange('address', e.target.value)}
                  placeholder="Enter complete company address"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} className="px-6">
                  <Building2 className="w-4 h-4 mr-2" />
                  Save Company Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Factory Locations</CardTitle>
              <CardDescription>
                Manage your factory locations and addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {locationsList.map((location, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Location {index + 1}</h3>
                    {locationsList.length > 1 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveLocation(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`locationName${index}`}>
                        Location Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`locationName${index}`}
                        value={location.name}
                        onChange={(e) => handleLocationChange(index, 'name', e.target.value)}
                        placeholder="e.g., Main Factory, Warehouse 1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`locationAddress${index}`}>
                        Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`locationAddress${index}`}
                        value={location.address}
                        onChange={(e) => handleLocationChange(index, 'address', e.target.value)}
                        placeholder="Enter location address"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-4">
                <Button variant="outline" onClick={handleAddLocation}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Add Location
                </Button>

                <Button onClick={handleSaveLocations} className="px-6">
                  <MapPin className="w-4 h-4 mr-2" />
                  Save Locations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export, import, or reset your application data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Export Data</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Download all your application data as a backup
                  </p>
                  <Button variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Import Data</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Restore data from a previous backup
                  </p>
                  <Button variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                </div>

                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-semibold text-red-700 mb-2">Reset Application</h3>
                  <p className="text-sm text-red-600 mb-4">
                    Clear all data and return to first-time setup
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={() => window.location.href = '/reset.html'}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Reset Application
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
