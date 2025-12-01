// Login screen for existing users and new user activation
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Factory, UserPlus, LogIn } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function LoginScreen() {
  const { actions } = useApp();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Setup code form
  const [setupCode, setSetupCode] = useState('');

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

        {/* Login card */}
        <Card>
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
        </Card>

        {/* Help text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have a setup code?{' '}
            <span className="text-slate-800 font-medium">
              Contact your administrator
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

