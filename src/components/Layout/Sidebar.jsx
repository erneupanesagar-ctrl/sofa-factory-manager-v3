// Main sidebar navigation component
import React from 'react';
import { 
  Home, 
  Package, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Calendar, 
  Settings, 
  Factory,
  Truck,
  UserCheck,
  Bell,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '../../contexts/AppContext';
import { cn } from '../../lib/utils';

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    roles: ['admin', 'staff', 'labour_manager']
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    roles: ['admin', 'staff', 'labour_manager'],
    children: [
      { id: 'raw-materials', label: 'Raw Materials', icon: Factory },
      { id: 'finished-products', label: 'Finished Products', icon: Package }
    ]
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: Truck,
    roles: ['admin', 'staff']
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    roles: ['admin', 'staff']
  },
  {
    id: 'labour',
    label: 'Labour',
    icon: UserCheck,
    roles: ['admin', 'labour_manager']
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    roles: ['admin', 'staff']
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: DollarSign,
    roles: ['admin', 'staff']
  },
  {
    id: 'financials',
    label: 'Financials',
    icon: BarChart3,
    roles: ['admin']
  },
  {
    id: 'cleaning',
    label: 'Cleaning Services',
    icon: Calendar,
      roles: ['admin', 'staff']
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    roles: ['admin', 'staff']
  },
  {
    id: 'sales',
    label: 'Reports',
    icon: BarChart3,
    roles: ['admin', 'labour_manager']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    roles: ['admin']
  }
];

export default function Sidebar() {
  const { state, actions, auth } = useApp();
  const { sidebarOpen, currentView, notifications } = state;
  const currentUser = auth.getCurrentUser();

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const canAccessItem = (item) => {
    if (!currentUser) return false;
    return item.roles.includes(currentUser.role);
  };

  const handleNavigation = (viewId) => {
    actions.setCurrentView(viewId);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      actions.setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    actions.setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => actions.setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-slate-800 text-white z-50 transform transition-transform duration-300 ease-in-out",
        "w-64 md:w-72",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "md:relative md:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Factory className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Sofa Factory</h1>
              <p className="text-xs text-slate-400">Manager</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="md:hidden text-white hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User info */}
        {currentUser && (
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-400 capitalize">{currentUser.role.replace('_', ' ')}</p>
              </div>
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              if (!canAccessItem(item)) return null;

              const Icon = item.icon;
              const isActive = currentView === item.id || 
                (item.children && item.children.some(child => currentView === child.id));

              return (
                <li key={item.id}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left hover:bg-slate-700",
                      isActive && "bg-slate-700 text-amber-400"
                    )}
                    onClick={() => handleNavigation(item.id)}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                    {item.id === 'dashboard' && unreadNotifications > 0 && (
                      <Badge variant="destructive" className="ml-auto text-xs">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>

                  {/* Sub-navigation */}
                  {item.children && isActive && (
                    <ul className="ml-6 mt-2 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = currentView === child.id;

                        return (
                          <li key={child.id}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full justify-start text-left hover:bg-slate-700",
                                isChildActive && "bg-slate-600 text-amber-400"
                              )}
                              onClick={() => handleNavigation(child.id)}
                            >
                              <ChildIcon className="w-3 h-3 mr-2" />
                              {child.label}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-left hover:bg-slate-700 text-slate-400"
            onClick={actions.logout}
          >
            <Settings className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );
}

// Mobile menu button component
export function MobileMenuButton() {
  const { actions } = useApp();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => actions.setSidebarOpen(true)}
      className="md:hidden"
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}

