// Simple admin login page with password recovery
import React, { useState } from 'react';
import { Factory } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function SimpleLogin() {
  const { actions } = useApp();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check for default credentials first
      if (formData.username.trim() === 'admin' && formData.password.trim() === 'admin123') {
        // Create default admin if it doesn't exist
        const defaultAdmin = {
          id: 'default-admin',
          name: 'Administrator',
          email: 'admin@sofafactory.com',
          phone: '9800000000',
          role: 'admin',
          username: 'admin',
          password: 'admin123',
          securityQuestions: [
            { question: 'What is your favorite color?', answer: 'blue' },
            { question: 'What is your pet name?', answer: 'fluffy' }
          ],
          createdAt: new Date().toISOString()
        };

        // Try to create admin account (will handle if already exists)
        try {
          await actions.createAdminAccount(defaultAdmin);
        } catch (e) {
          // Admin might already exist, that's okay
          console.log('Admin account setup:', e.message);
        }

        // Login as default admin
        await actions.login(defaultAdmin.id);
        return;
      }

      // Get all users for non-default credentials
      const users = await actions.getAllUsers();
      
      // Find matching admin
      const admin = users.find(
        u => u.role === 'admin' && 
        u.username === formData.username.trim() && 
        u.password === formData.password.trim()
      );

      if (!admin) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }

      // Login successful
      await actions.login(admin.id);
      
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setError('Email is required for password recovery');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get all users
      const users = await actions.getAllUsers();
      
      // Find user by email
      const user = users.find(u => u.email === formData.email.trim());

      if (!user) {
        setError('No account found with this email');
        setLoading(false);
        return;
      }

      // In a real app, you would send an email here
      // For now, just show the password
      setSuccess(`Password recovery: Your username is "${user.username}" and password is "${user.password}". Please save these credentials.`);
      setLoading(false);
      
    } catch (err) {
      console.error('Password recovery failed:', err);
      setError('Password recovery failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Factory className="w-10 h-10 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Sofa Factory Manager</h1>
          <p className="text-slate-300">Admin Login Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Forgot your password?</span>
            </div>
          </div>

          {/* Password Recovery */}
          <form onSubmit={handlePasswordRecovery} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email for password recovery"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Recovering...' : 'Recover Password'}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-300">
            Default credentials: <span className="font-semibold text-amber-400">admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
