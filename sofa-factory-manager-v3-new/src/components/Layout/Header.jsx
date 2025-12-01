// Main header component
import React from 'react';
import { Bell, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '../../contexts/AppContext';
import { MobileMenuButton } from './Sidebar';
import { formatDate } from '../../lib/utils';

export default function Header() {
  const { state, actions, auth } = useApp();
  const { 
    locations, 
    locationFilter, 
    notifications, 
    currentView 
  } = state;
  
  const currentUser = auth.getCurrentUser();
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const canViewAllLocations = auth.hasPermission('VIEW_ALL_LOCATIONS');

  const getViewTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      'raw-materials': 'Raw Materials',
      'finished-products': 'Finished Products',
      suppliers: 'Suppliers',
      customers: 'Customers',
      labour: 'Labour Management',
      sales: 'Sales',
      purchases: 'Purchases',
      financials: 'Financials',
      cleaning: 'Cleaning Services',
      reports: 'Reports',
      settings: 'Settings'
    };
    return titles[currentView] || 'Sofa Factory Manager';
  };

  const handleLocationChange = (locationId) => {
    actions.setLocationFilter(locationId);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      actions.markNotificationRead(notification.id);
    }
    
    // Navigate to relevant view based on notification type
    switch (notification.type) {
      case 'sale_approval':
        actions.setCurrentView('sales');
        break;
      case 'low_stock':
        actions.setCurrentView('raw-materials');
        break;
      case 'payment_due':
        actions.setCurrentView('financials');
        break;
      case 'labour_report':
        actions.setCurrentView('labour');
        break;
      default:
        break;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <MobileMenuButton />
          
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {getViewTitle()}
            </h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-NP', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Location filter */}
          {canViewAllLocations && locations.length > 0 && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <Select value={locationFilter} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0"
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3 border-b">
                <h3 className="font-medium">Notifications</h3>
                <p className="text-sm text-gray-500">
                  {unreadNotifications} unread
                </p>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="p-3 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3 w-full">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.read ? 'bg-gray-300' : 'bg-amber-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${
                            notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              
              {notifications.length > 10 && (
                <div className="p-3 border-t text-center">
                  <Button variant="ghost" size="sm">
                    View all notifications
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User info */}
          {currentUser && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

