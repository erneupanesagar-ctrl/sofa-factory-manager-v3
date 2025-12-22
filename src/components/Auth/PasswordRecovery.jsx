// Password recovery component using security questions
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function PasswordRecovery({ onBack }) {
  const { actions } = useApp();
  const [step, setStep] = useState(1); // 1: username, 2: security questions, 3: new password, 4: success
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [username, setUsername] = useState('');
  const [adminUser, setAdminUser] = useState(null);
  const [answers, setAnswers] = useState({
    answer1: '',
    answer2: ''
  });
  const [newPassword, setNewPassword] = useState({
    password: '',
    confirmPassword: ''
  });

  const handleFindAccount = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setErrors({ username: 'Username is required' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const users = await actions.getAllUsers();
      const admin = users.find(u => u.role === 'admin' && u.username === username);

      if (!admin) {
        setErrors({ username: 'Admin account not found' });
        setLoading(false);
        return;
      }

      if (!admin.securityQuestion1 || !admin.securityQuestion2) {
        setErrors({ username: 'Security questions not set up for this account' });
        setLoading(false);
        return;
      }

      setAdminUser(admin);
      setStep(2);
    } catch (error) {
      console.error('Error finding account:', error);
      setErrors({ username: 'Error finding account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAnswers = (e) => {
    e.preventDefault();

    if (!answers.answer1.trim() || !answers.answer2.trim()) {
      setErrors({ answers: 'Please answer both security questions' });
      return;
    }

    // Verify answers (case-insensitive)
    const answer1Match = answers.answer1.trim().toLowerCase() === adminUser.securityAnswer1.toLowerCase();
    const answer2Match = answers.answer2.trim().toLowerCase() === adminUser.securityAnswer2.toLowerCase();

    if (!answer1Match || !answer2Match) {
      setErrors({ answers: 'Incorrect answers. Please try again.' });
      return;
    }

    setErrors({});
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword.password.trim()) {
      setErrors({ password: 'Password is required' });
      return;
    }

    if (newPassword.password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    if (newPassword.password !== newPassword.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Update password
      const updatedUser = {
        ...adminUser,
        password: newPassword.password
      };

      await actions.updateItem('users', updatedUser);
      setStep(4);
    } catch (error) {
      console.error('Error resetting password:', error);
      setErrors({ password: 'Error resetting password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleFindAccount} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your admin username"
                className={errors.username ? 'border-red-500' : ''}
              />
              {errors.username && (
                <p className="text-sm text-red-500 mt-1">{errors.username}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !username.trim()}
            >
              {loading ? 'Finding Account...' : 'Continue'}
            </Button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleVerifyAnswers} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Account found: <span className="font-semibold">{adminUser.name}</span>
              </p>
            </div>

            <div>
              <Label htmlFor="answer1">{adminUser.securityQuestion1}</Label>
              <Input
                id="answer1"
                value={answers.answer1}
                onChange={(e) => setAnswers({ ...answers, answer1: e.target.value })}
                placeholder="Enter your answer"
                className={errors.answers ? 'border-red-500' : ''}
              />
            </div>

            <div>
              <Label htmlFor="answer2">{adminUser.securityQuestion2}</Label>
              <Input
                id="answer2"
                value={answers.answer2}
                onChange={(e) => setAnswers({ ...answers, answer2: e.target.value })}
                placeholder="Enter your answer"
                className={errors.answers ? 'border-red-500' : ''}
              />
            </div>

            {errors.answers && (
              <p className="text-sm text-red-500">{errors.answers}</p>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!answers.answer1.trim() || !answers.answer2.trim()}
            >
              Verify Answers
            </Button>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800">
                ✓ Security questions verified successfully
              </p>
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword.password}
                onChange={(e) => setNewPassword({ ...newPassword, password: e.target.value })}
                placeholder="Enter new password (min 6 characters)"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={newPassword.confirmPassword}
                onChange={(e) => setNewPassword({ ...newPassword, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !newPassword.password.trim() || !newPassword.confirmPassword.trim()}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        );

      case 4:
        return (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Reset Successful!</h3>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <Button onClick={onBack} className="w-full">
              Go to Login
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        {step < 4 && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        )}

        {/* Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5" />
              <span>Password Recovery</span>
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Enter your username to begin password recovery'}
              {step === 2 && 'Answer your security questions to verify your identity'}
              {step === 3 && 'Create a new password for your account'}
              {step === 4 && 'Recovery complete'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Progress indicator */}
        {step < 4 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Step {step} of 3
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
