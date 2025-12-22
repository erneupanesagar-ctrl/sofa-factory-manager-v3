// Reset application data utility
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ResetApp() {
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    setResetting(true);

    try {
      // Clear localStorage
      localStorage.clear();

      // Clear all IndexedDB databases
      const databases = await indexedDB.databases();
      for (const db of databases) {
        indexedDB.deleteDatabase(db.name);
      }

      setDone(true);
      
      // Reload after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Error resetting app:', error);
      alert('Error resetting app. Please try clearing your browser data manually.');
      setResetting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <RefreshCw className="w-5 h-5" />
              <span>Reset Complete!</span>
            </CardTitle>
            <CardDescription>
              All data has been cleared. Redirecting to setup wizard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Reset Application</span>
          </CardTitle>
          <CardDescription>
            This will delete all data and return to the first-time setup wizard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>Warning:</strong> This action will permanently delete:
            </p>
            <ul className="text-sm text-orange-800 mt-2 space-y-1 list-disc list-inside">
              <li>All user accounts</li>
              <li>Company profile</li>
              <li>Factory locations</li>
              <li>All inventory data</li>
              <li>All sales and purchase records</li>
              <li>All other application data</li>
            </ul>
          </div>

          <Button 
            onClick={handleReset} 
            disabled={resetting}
            variant="destructive"
            className="w-full"
          >
            {resetting ? 'Resetting...' : 'Reset Application'}
          </Button>

          <Button 
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
            disabled={resetting}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
