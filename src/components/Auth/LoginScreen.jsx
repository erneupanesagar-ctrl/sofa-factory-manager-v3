// Login screen for admin and staff users
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Factory, UserPlus, LogIn, Shield } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import PasswordRecovery from './PasswordRecovery';
import { initializeDemoData } from '../../lib/demoData';

export default function LoginScreen() {
  const { actions } = useApp();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);

  // Demo mode handler
  const handleDemoMode = async () => {
    setLoading(true);
    try {
      // Initialize demo data
      const demoUser = await initializeDemoData();
      
      // Login as demo user
      await actions.login(demoUser.id);
      
      // Dashboard will load automatically
    } catch (error) {
      console.error('Demo mode error:', error);
      alert('Failed to start demo mode. Please try again.');
      setLoading(false);
    }
  };

  // If password recovery is active, show that component
  if (showPasswordRecovery) {
    return <PasswordRecovery onBack={() => setShowPasswordRecovery(false)} />;
  }

  // Admin login form
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: ''
  });

  // Setup code form
  const [setupCode, setSetupCode] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    if (!adminCredentials.username.trim() || !adminCredentials.password.trim()) {
      setErrors({ admin: 'Username and password are required' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Get all users and find admin with matching credentials
      const users = await actions.getAllUsers();
      const admin = users.find(
        u => u.role === 'admin' && 
        u.username === adminCredentials.username && 
        u.password === adminCredentials.password
      );

      if (!admin) {
        setErrors({ admin: 'Invalid username or password' });
        setLoading(false);
        return;
      }

      // Login the admin user
      await actions.loginUser(admin.id);
    } catch (error) {
      console.error('Admin login failed:', error);
      setErrors({ admin: 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAccount = async (e) => {
    e.preventDefault();
    if (!setupCode.trim()) {
      setErrors({ setupCode: 'Setup code is required' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString()
      };

      await actions.activateUserAccount(setupCode.toUpperCase(), deviceInfo);
    } catch (error) {
      console.error('Account activation failed:', error);
      setErrors({ setupCode: 'Invalid or expired setup code' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Factory className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sofa Factory Manager</h1>
          <p className="text-gray-600 mt-2">Access your account</p>
        </div>

        {/* Login card with tabs */}
        <Card>
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Staff
              </TabsTrigger>
            </TabsList>

            {/* Admin Login Tab */}
            <TabsContent value="admin">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LogIn className="w-5 h-5" />
                  <span>Admin Login</span>
                </CardTitle>
                <CardDescription>
                  Sign in with your administrator credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={adminCredentials.username}
                      onChange={(e) => setAdminCredentials({
                        ...adminCredentials,
                        username: e.target.value
                      })}
                      placeholder="Enter your username"
                      className={errors.admin ? 'border-red-500' : ''}
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={adminCredentials.password}
                      onChange={(e) => setAdminCredentials({
                        ...adminCredentials,
                        password: e.target.value
                      })}
                      placeholder="Enter your password"
                      className={errors.admin ? 'border-red-500' : ''}
                    />
                  </div>

                  {errors.admin && (
                    <p className="text-sm text-red-500">{errors.admin}</p>
                  )}

                  <div className="flex items-center justify-end mb-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordRecovery(true)}
                      className="text-sm text-slate-600 hover:text-slate-800 underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !adminCredentials.username.trim() || !adminCredentials.password.trim()}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            {/* Staff Activation Tab */}
            <TabsContent value="staff">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5" />
                  <span>Join Your Team</span>
                </CardTitle>
                <CardDescription>
                  Enter the setup code provided by your administrator
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleActivateAccount} className="space-y-4">
                  <div>
                    <Label htmlFor="setupCode">Setup Code</Label>
                    <Input
                      id="setupCode"
                      value={setupCode}
                      onChange={(e) => setSetupCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-character setup code"
                      maxLength={6}
                      className={`text-center text-lg tracking-widest ${
                        errors.setupCode ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.setupCode && (
                      <p className="text-sm text-red-500 mt-1">{errors.setupCode}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Ask your administrator for the setup code to join your team
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !setupCode.trim()}
                  >
                    {loading ? 'Activating Account...' : 'Activate Account'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Help text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <span className="text-slate-800 font-medium">
              Contact your administrator
            </span>
          </p>
        </div>

        {/* Demo Mode Button */}
        <div className="mt-6">
          <button
            onClick={handleDemoMode}
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {loading ? 'Starting Demo...' : 'Try Demo Mode (No Login Required)'}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Explore all features with pre-loaded demo data
          </p>
        </div>
      </div>
    </div>
  );
}
