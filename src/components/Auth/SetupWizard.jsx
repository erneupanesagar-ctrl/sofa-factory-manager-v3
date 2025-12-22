// Initial setup wizard for first-time users
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Factory, Building, User, MapPin, Phone, Mail } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { isValidEmail, isValidPhone } from '../../lib/utils';

const steps = [
  {
    id: 'admin',
    title: 'Create Admin Account',
    description: 'Set up your administrator account',
    icon: User
  },
  {
    id: 'company',
    title: 'Company Profile',
    description: 'Enter your company information',
    icon: Building
  },
  {
    id: 'locations',
    title: 'Factory Locations',
    description: 'Add your factory locations',
    icon: MapPin
  }
];

export default function SetupWizard() {
  const { actions } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form data
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    securityQuestion1: 'What is your mother\'s maiden name?',
    securityAnswer1: '',
    securityQuestion2: 'What was the name of your first pet?',
    securityAnswer2: ''
  });

  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  const [locations, setLocations] = useState([
    { name: '', address: '' }
  ]);

  const validateStep = (stepIndex) => {
    const newErrors = {};

    switch (stepIndex) {
      case 0: // Admin account
        if (!adminData.name.trim()) {
          newErrors.adminName = 'Name is required';
        }
        if (!adminData.email.trim()) {
          newErrors.adminEmail = 'Email is required';
        } else if (!isValidEmail(adminData.email)) {
          newErrors.adminEmail = 'Invalid email format';
        }
        if (!adminData.phone.trim()) {
          newErrors.adminPhone = 'Phone is required';
        } else if (!isValidPhone(adminData.phone)) {
          newErrors.adminPhone = 'Invalid phone format';
        }
        if (!adminData.username.trim()) {
          newErrors.adminUsername = 'Username is required';
        } else if (adminData.username.length < 4) {
          newErrors.adminUsername = 'Username must be at least 4 characters';
        }
        if (!adminData.password.trim()) {
          newErrors.adminPassword = 'Password is required';
        } else if (adminData.password.length < 6) {
          newErrors.adminPassword = 'Password must be at least 6 characters';
        }
        if (adminData.password !== adminData.confirmPassword) {
          newErrors.adminConfirmPassword = 'Passwords do not match';
        }
        if (!adminData.securityAnswer1.trim()) {
          newErrors.securityAnswer1 = 'Security answer is required';
        }
        if (!adminData.securityAnswer2.trim()) {
          newErrors.securityAnswer2 = 'Security answer is required';
        }
        break;

      case 1: // Company profile
        if (!companyData.name.trim()) {
          newErrors.companyName = 'Company name is required';
        }
        if (!companyData.address.trim()) {
          newErrors.companyAddress = 'Company address is required';
        }
        if (!companyData.phone.trim()) {
          newErrors.companyPhone = 'Company phone is required';
        } else if (!isValidPhone(companyData.phone)) {
          newErrors.companyPhone = 'Invalid phone format';
        }
        if (companyData.email && !isValidEmail(companyData.email)) {
          newErrors.companyEmail = 'Invalid email format';
        }
        break;

      case 2: // Locations
        locations.forEach((location, index) => {
          if (!location.name.trim()) {
            newErrors[`location${index}Name`] = 'Location name is required';
          }
          if (!location.address.trim()) {
            newErrors[`location${index}Address`] = 'Location address is required';
          }
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const addLocation = () => {
    setLocations([...locations, { name: '', address: '' }]);
  };

  const removeLocation = (index) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  const updateLocation = (index, field, value) => {
    const updatedLocations = locations.map((location, i) => 
      i === index ? { ...location, [field]: value } : location
    );
    setLocations(updatedLocations);
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      // Create admin account
      const admin = await actions.createAdminAccount(adminData);

      // Save company profile
      await actions.addItem('company', {
        id: 'profile',
        ...companyData
      });

      // Save locations
      for (const location of locations) {
        await actions.addItem('locations', location);
      }

      // Refresh data
      await actions.refreshData();
    } catch (error) {
      console.error('Setup failed:', error);
      setErrors({ general: 'Setup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminName">Full Name</Label>
              <Input
                id="adminName"
                value={adminData.name}
                onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                placeholder="Enter your full name"
                className={errors.adminName ? 'border-red-500' : ''}
              />
              {errors.adminName && (
                <p className="text-sm text-red-500 mt-1">{errors.adminName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="adminEmail">Email Address</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminData.email}
                onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                placeholder="Enter your email address"
                className={errors.adminEmail ? 'border-red-500' : ''}
              />
              {errors.adminEmail && (
                <p className="text-sm text-red-500 mt-1">{errors.adminEmail}</p>
              )}
            </div>

            <div>
              <Label htmlFor="adminPhone">Phone Number</Label>
              <Input
                id="adminPhone"
                value={adminData.phone}
                onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                placeholder="Enter your phone number"
                className={errors.adminPhone ? 'border-red-500' : ''}
              />
              {errors.adminPhone && (
                <p className="text-sm text-red-500 mt-1">{errors.adminPhone}</p>
              )}
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Login Credentials</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adminUsername">Username</Label>
                  <Input
                    id="adminUsername"
                    value={adminData.username}
                    onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                    placeholder="Choose a username (min 4 characters)"
                    className={errors.adminUsername ? 'border-red-500' : ''}
                  />
                  {errors.adminUsername && (
                    <p className="text-sm text-red-500 mt-1">{errors.adminUsername}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminData.password}
                    onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                    placeholder="Choose a password (min 6 characters)"
                    className={errors.adminPassword ? 'border-red-500' : ''}
                  />
                  {errors.adminPassword && (
                    <p className="text-sm text-red-500 mt-1">{errors.adminPassword}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="adminConfirmPassword">Confirm Password</Label>
                  <Input
                    id="adminConfirmPassword"
                    type="password"
                    value={adminData.confirmPassword}
                    onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                    placeholder="Re-enter your password"
                    className={errors.adminConfirmPassword ? 'border-red-500' : ''}
                  />
                  {errors.adminConfirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{errors.adminConfirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Security Questions</h3>
              <p className="text-xs text-gray-500 mb-3">These will help you recover your password if you forget it</p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="securityAnswer1">{adminData.securityQuestion1}</Label>
                  <Input
                    id="securityAnswer1"
                    value={adminData.securityAnswer1}
                    onChange={(e) => setAdminData({ ...adminData, securityAnswer1: e.target.value })}
                    placeholder="Enter your answer"
                    className={errors.securityAnswer1 ? 'border-red-500' : ''}
                  />
                  {errors.securityAnswer1 && (
                    <p className="text-sm text-red-500 mt-1">{errors.securityAnswer1}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="securityAnswer2">{adminData.securityQuestion2}</Label>
                  <Input
                    id="securityAnswer2"
                    value={adminData.securityAnswer2}
                    onChange={(e) => setAdminData({ ...adminData, securityAnswer2: e.target.value })}
                    placeholder="Enter your answer"
                    className={errors.securityAnswer2 ? 'border-red-500' : ''}
                  />
                  {errors.securityAnswer2 && (
                    <p className="text-sm text-red-500 mt-1">{errors.securityAnswer2}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                placeholder="Enter your company name"
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="companyAddress">Company Address</Label>
              <Textarea
                id="companyAddress"
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                placeholder="Enter your company address"
                className={errors.companyAddress ? 'border-red-500' : ''}
                rows={3}
              />
              {errors.companyAddress && (
                <p className="text-sm text-red-500 mt-1">{errors.companyAddress}</p>
              )}
            </div>

            <div>
              <Label htmlFor="companyPhone">Company Phone</Label>
              <Input
                id="companyPhone"
                value={companyData.phone}
                onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                placeholder="Enter company phone number"
                className={errors.companyPhone ? 'border-red-500' : ''}
              />
              {errors.companyPhone && (
                <p className="text-sm text-red-500 mt-1">{errors.companyPhone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="companyEmail">Company Email (Optional)</Label>
              <Input
                id="companyEmail"
                type="email"
                value={companyData.email}
                onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                placeholder="Enter company email address"
                className={errors.companyEmail ? 'border-red-500' : ''}
              />
              {errors.companyEmail && (
                <p className="text-sm text-red-500 mt-1">{errors.companyEmail}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Factory Locations</h3>
              <Button onClick={addLocation} variant="outline" size="sm">
                Add Location
              </Button>
            </div>

            {locations.map((location, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Location {index + 1}</h4>
                    {locations.length > 1 && (
                      <Button
                        onClick={() => removeLocation(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`location${index}Name`}>Location Name</Label>
                    <Input
                      id={`location${index}Name`}
                      value={location.name}
                      onChange={(e) => updateLocation(index, 'name', e.target.value)}
                      placeholder="e.g., Factory A - Kathmandu"
                      className={errors[`location${index}Name`] ? 'border-red-500' : ''}
                    />
                    {errors[`location${index}Name`] && (
                      <p className="text-sm text-red-500 mt-1">{errors[`location${index}Name`]}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`location${index}Address`}>Address</Label>
                    <Textarea
                      id={`location${index}Address`}
                      value={location.address}
                      onChange={(e) => updateLocation(index, 'address', e.target.value)}
                      placeholder="Enter location address"
                      className={errors[`location${index}Address`] ? 'border-red-500' : ''}
                      rows={2}
                    />
                    {errors[`location${index}Address`] && (
                      <p className="text-sm text-red-500 mt-1">{errors[`location${index}Address`]}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Factory className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Sofa Factory Manager</h1>
          <p className="text-gray-600 mt-2">Let's set up your application</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isActive ? 'bg-slate-800 text-white' : 
                    isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Main card */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {renderStepContent()}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
              <Button
                onClick={handlePrevious}
                variant="outline"
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={loading}>
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

