// Application context for global state management
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import db from '../lib/database.js';
import auth from '../lib/auth.js';

// Initial state
const initialState = {
  // Authentication
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  // Company & Settings
  company: null,
  locations: [],
  currentLocation: null,
  
  // Data
  suppliers: [],
  customers: [],
  rawMaterials: [],
  labourers: [],
  sofaModels: [],
  purchases: [],
  sales: [],
  cleaningServices: [],
  notifications: [],
  productions: [],
  orders: [],
  finishedProducts: [],
  
  // UI State
  sidebarOpen: false,
  currentView: 'dashboard',
  
  // Filters
  locationFilter: 'all',
  dateFilter: 'all'
};

// Action types
const ActionTypes = {
  // Auth actions
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  LOGOUT: 'LOGOUT',
  
  // Company actions
  SET_COMPANY: 'SET_COMPANY',
  SET_LOCATIONS: 'SET_LOCATIONS',
  SET_CURRENT_LOCATION: 'SET_CURRENT_LOCATION',
  
  // Data actions
  SET_SUPPLIERS: 'SET_SUPPLIERS',
  SET_CUSTOMERS: 'SET_CUSTOMERS',
  SET_RAW_MATERIALS: 'SET_RAW_MATERIALS',
  SET_LABOURERS: 'SET_LABOURERS',
  SET_SOFA_MODELS: 'SET_SOFA_MODELS',
  SET_PURCHASES: 'SET_PURCHASES',
  SET_SALES: 'SET_SALES',
  SET_CLEANING_SERVICES: 'SET_CLEANING_SERVICES',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  SET_PRODUCTIONS: 'SET_PRODUCTIONS',
  SET_ORDERS: 'SET_ORDERS',
  SET_FINISHED_PRODUCTS: 'SET_FINISHED_PRODUCTS',
  
  // CRUD actions
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  DELETE_ITEM: 'DELETE_ITEM',
  
  // UI actions
  SET_SIDEBAR_OPEN: 'SET_SIDEBAR_OPEN',
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_LOCATION_FILTER: 'SET_LOCATION_FILTER',
  SET_DATE_FILTER: 'SET_DATE_FILTER',
  
  // Notification actions
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };
      
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case ActionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };
      
    case ActionTypes.SET_COMPANY:
      return {
        ...state,
        company: action.payload
      };
      
    case ActionTypes.SET_LOCATIONS:
      return {
        ...state,
        locations: action.payload
      };
      
    case ActionTypes.SET_CURRENT_LOCATION:
      return {
        ...state,
        currentLocation: action.payload
      };
      
    case ActionTypes.SET_SUPPLIERS:
      return {
        ...state,
        suppliers: action.payload
      };
      
    case ActionTypes.SET_CUSTOMERS:
      return {
        ...state,
        customers: action.payload
      };
      
    case ActionTypes.SET_RAW_MATERIALS:
      return {
        ...state,
        rawMaterials: action.payload
      };
      
    case ActionTypes.SET_LABOURERS:
      return {
        ...state,
        labourers: action.payload
      };
      
    case ActionTypes.SET_SOFA_MODELS:
      return {
        ...state,
        sofaModels: action.payload
      };
      
    case ActionTypes.SET_PURCHASES:
      return {
        ...state,
        purchases: action.payload
      };
      
    case ActionTypes.SET_SALES:
      return {
        ...state,
        sales: action.payload
      };
      
    case ActionTypes.SET_CLEANING_SERVICES:
      return {
        ...state,
        cleaningServices: action.payload
      };
      
    case ActionTypes.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload
      };
      
    case ActionTypes.SET_PRODUCTIONS:
      return {
        ...state,
        productions: action.payload
      };
      
    case ActionTypes.SET_FINISHED_PRODUCTS:
      return {
        ...state,
        finishedProducts: action.payload
      };
      
    case ActionTypes.SET_ORDERS:
      return {
        ...state,
        orders: action.payload
      };
      
    case ActionTypes.ADD_ITEM:
      const { collection, item } = action.payload;
      return {
        ...state,
        [collection]: [...(state[collection] || []), item]
      };
      
    case ActionTypes.UPDATE_ITEM:
      const { collection: updateCollection, item: updateItem } = action.payload;
      return {
        ...state,
        [updateCollection]: (state[updateCollection] || []).map(existing => 
          existing.id === updateItem.id ? updateItem : existing
        )
      };
      
    case ActionTypes.DELETE_ITEM:
      const { collection: deleteCollection, id } = action.payload;
      return {
        ...state,
        [deleteCollection]: (state[deleteCollection] || []).filter(item => item.id !== id)
      };
      
    case ActionTypes.SET_SIDEBAR_OPEN:
      return {
        ...state,
        sidebarOpen: action.payload
      };
      
    case ActionTypes.SET_CURRENT_VIEW:
      return {
        ...state,
        currentView: action.payload
      };
      
    case ActionTypes.SET_LOCATION_FILTER:
      return {
        ...state,
        locationFilter: action.payload
      };
      
    case ActionTypes.SET_DATE_FILTER:
      return {
        ...state,
        dateFilter: action.payload
      };
      
    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
      
    case ActionTypes.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        )
      };
      
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Initialize database and auth
      await auth.init();
      
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        dispatch({ type: ActionTypes.SET_USER, payload: currentUser });
        await loadAppData();
      } else {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const loadAppData = async () => {
    try {
      // Load company profile
      const company = await db.getCompanyProfile();
      if (company) {
        dispatch({ type: ActionTypes.SET_COMPANY, payload: company });
      }

      // Load locations
      const locations = await db.getAll('locations');
      dispatch({ type: ActionTypes.SET_LOCATIONS, payload: locations });

      // Load other data based on user permissions
      const user = auth.getCurrentUser();
      if (user) {
        const accessibleLocations = await auth.getAccessibleLocations();
        
        if (auth.hasPermission('VIEW_ALL_LOCATIONS')) {
          // Admin can see all data
          await loadAllData();
        } else {
          // Staff/Labour Manager see only their location data
          await loadLocationData(user.locationId);
        }
      }
    } catch (error) {
      console.error('Failed to load app data:', error);
    }
  };

  const loadAllData = async () => {
    try {
      const [
        suppliers,
        customers,
        rawMaterials,
        labourers,
        sofaModels,
        purchases,
        sales,
        cleaningServices,
        notifications,
        productions,
        orders,
        finishedProducts
      ] = await Promise.all([
        db.getAll('suppliers'),
        db.getAll('customers'),
        db.getAll('rawMaterials'),
        db.getAll('labourers'),
        db.getAll('sofaModels'),
        db.getAll('purchases'),
        db.getAll('sales'),
        db.getAll('cleaningServices'),
        db.getAll('notifications'),
        db.getAll('productions'),
        db.getAll('orders'),
        db.getAll('finishedProducts')
      ]);

      dispatch({ type: ActionTypes.SET_SUPPLIERS, payload: suppliers || [] });
      dispatch({ type: ActionTypes.SET_CUSTOMERS, payload: customers || [] });
      dispatch({ type: ActionTypes.SET_RAW_MATERIALS, payload: rawMaterials || [] });
      dispatch({ type: ActionTypes.SET_LABOURERS, payload: labourers || [] });
      dispatch({ type: ActionTypes.SET_SOFA_MODELS, payload: sofaModels || [] });
      dispatch({ type: ActionTypes.SET_PURCHASES, payload: purchases || [] });
      dispatch({ type: ActionTypes.SET_SALES, payload: sales || [] });
      dispatch({ type: ActionTypes.SET_CLEANING_SERVICES, payload: cleaningServices || [] });
      dispatch({ type: ActionTypes.SET_NOTIFICATIONS, payload: notifications || [] });
      dispatch({ type: ActionTypes.SET_PRODUCTIONS, payload: productions || [] });
      dispatch({ type: ActionTypes.SET_ORDERS, payload: orders || [] });
      dispatch({ type: ActionTypes.SET_FINISHED_PRODUCTS, payload: finishedProducts || [] });
    } catch (error) {
      console.error('Failed to load all data:', error);
    }
  };

  const loadLocationData = async (locationId) => {
    try {
      const [
        suppliers,
        customers,
        rawMaterials,
        labourers,
        sofaModels,
        purchases,
        sales,
        cleaningServices,
        notifications,
        productions,
        orders,
        finishedProducts
      ] = await Promise.all([
        db.getAll('suppliers', 'locationId', locationId),
        db.getAll('customers', 'locationId', locationId),
        db.getAll('rawMaterials', 'locationId', locationId),
        db.getAll('labourers', 'locationId', locationId),
        db.getAll('sofaModels', 'locationId', locationId),
        db.getAll('purchases', 'locationId', locationId),
        db.getAll('sales', 'locationId', locationId),
        db.getAll('cleaningServices', 'locationId', locationId),
        db.getAll('notifications', 'userId', auth.getCurrentUser()?.id),
        db.getAll('productions', 'locationId', locationId),
        db.getAll('orders', 'locationId', locationId),
        db.getAll('finishedProducts', 'locationId', locationId)
      ]);

      dispatch({ type: ActionTypes.SET_SUPPLIERS, payload: suppliers || [] });
      dispatch({ type: ActionTypes.SET_CUSTOMERS, payload: customers || [] });
      dispatch({ type: ActionTypes.SET_RAW_MATERIALS, payload: rawMaterials || [] });
      dispatch({ type: ActionTypes.SET_LABOURERS, payload: labourers || [] });
      dispatch({ type: ActionTypes.SET_SOFA_MODELS, payload: sofaModels || [] });
      dispatch({ type: ActionTypes.SET_PURCHASES, payload: purchases || [] });
      dispatch({ type: ActionTypes.SET_SALES, payload: sales || [] });
      dispatch({ type: ActionTypes.SET_CLEANING_SERVICES, payload: cleaningServices || [] });
      dispatch({ type: ActionTypes.SET_NOTIFICATIONS, payload: notifications || [] });
      dispatch({ type: ActionTypes.SET_PRODUCTIONS, payload: productions || [] });
      dispatch({ type: ActionTypes.SET_ORDERS, payload: orders || [] });
      dispatch({ type: ActionTypes.SET_FINISHED_PRODUCTS, payload: finishedProducts || [] });
    } catch (error) {
      console.error('Failed to load location data:', error);
    }
  };

  // Action creators
  const actions = {
    // Auth actions
    login: async (userId) => {
      try {
        const user = await auth.login(userId);
        dispatch({ type: ActionTypes.SET_USER, payload: user });
        await loadAppData();
        return user;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },

    logout: async () => {
      try {
        await auth.logout();
        dispatch({ type: ActionTypes.LOGOUT });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    },

    createAdminAccount: async (userData) => {
      try {
        const user = await auth.createAdminAccount(userData);
        dispatch({ type: ActionTypes.SET_USER, payload: user });
        return user;
      } catch (error) {
        console.error('Failed to create admin account:', error);
        throw error;
      }
    },

    activateUserAccount: async (setupCode, deviceInfo) => {
      try {
        const user = await auth.activateUserAccount(setupCode, deviceInfo);
        dispatch({ type: ActionTypes.SET_USER, payload: user });
        await loadAppData();
        return user;
      } catch (error) {
        console.error('Failed to activate user account:', error);
        throw error;
      }
    },

    getAllUsers: async () => {
      try {
        const users = await db.getAll('users');
        return users;
      } catch (error) {
        console.error('Failed to get all users:', error);
        throw error;
      }
    },

    loginUser: async (userId) => {
      try {
        const user = await auth.login(userId);
        dispatch({ type: ActionTypes.SET_USER, payload: user });
        await loadAppData();
        return user;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },

    // Data actions
    addItem: async (collection, data) => {
      try {
        const id = await db.add(collection, data);
        const item = await db.get(collection, id);
        dispatch({ type: ActionTypes.ADD_ITEM, payload: { collection, item } });
        return item;
      } catch (error) {
        console.error(`Failed to add ${collection} item:`, error);
        throw error;
      }
    },

    updateItem: async (collection, item) => {
      try {
        await db.update(collection, item);
        dispatch({ type: ActionTypes.UPDATE_ITEM, payload: { collection, item } });
        return item;
      } catch (error) {
        console.error(`Failed to update ${collection} item:`, error);
        throw error;
      }
    },

    deleteItem: async (collection, id) => {
      try {
        await db.delete(collection, id);
        dispatch({ type: ActionTypes.DELETE_ITEM, payload: { collection, id } });
      } catch (error) {
        console.error(`Failed to delete ${collection} item:`, error);
        throw error;
      }
    },

    getAllOrders: async () => {
      try {
        const orders = await db.getAll('orders');
        return orders || [];
      } catch (error) {
        console.error('Failed to get all orders:', error);
        return [];
      }
    },

    // UI actions
    setSidebarOpen: (open) => {
      dispatch({ type: ActionTypes.SET_SIDEBAR_OPEN, payload: open });
    },

    setCurrentView: (view) => {
      dispatch({ type: ActionTypes.SET_CURRENT_VIEW, payload: view });
    },

    setLocationFilter: (locationId) => {
      dispatch({ type: ActionTypes.SET_LOCATION_FILTER, payload: locationId });
    },

    setDateFilter: (filter) => {
      dispatch({ type: ActionTypes.SET_DATE_FILTER, payload: filter });
    },

    // Notification actions
    addNotification: async (notification) => {
      try {
        const id = await db.add('notifications', notification);
        const newNotification = await db.get('notifications', id);
        dispatch({ type: ActionTypes.ADD_NOTIFICATION, payload: newNotification });
        return newNotification;
      } catch (error) {
        console.error('Failed to add notification:', error);
        throw error;
      }
    },

    markNotificationRead: async (notificationId) => {
      try {
        const notification = await db.get('notifications', notificationId);
        if (notification) {
          notification.read = true;
          await db.update('notifications', notification);
          dispatch({ type: ActionTypes.MARK_NOTIFICATION_READ, payload: notificationId });
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },

    // Company and Locations actions
    updateCompany: async (companyData) => {
      try {
        // Company profile always uses 'profile' as the ID
        const existingCompany = await db.get('company', 'profile');
        if (existingCompany) {
          const updatedCompany = { ...existingCompany, ...companyData, id: 'profile' };
          await db.update('company', updatedCompany);
          dispatch({ type: ActionTypes.SET_COMPANY, payload: updatedCompany });
          return updatedCompany;
        } else {
          const newCompany = { ...companyData, id: 'profile' };
          await db.add('company', newCompany);
          dispatch({ type: ActionTypes.SET_COMPANY, payload: newCompany });
          return newCompany;
        }
      } catch (error) {
        console.error('Failed to update company:', error);
        throw error;
      }
    },

    updateLocations: async (locationsData) => {
      try {
        // Clear existing locations
        const existingLocations = await db.getAll('locations');
        for (const loc of existingLocations) {
          await db.delete('locations', loc.id);
        }

        // Add new locations
        const newLocations = [];
        for (const locData of locationsData) {
          const id = await db.add('locations', locData);
          const location = await db.get('locations', id);
          newLocations.push(location);
        }

        dispatch({ type: ActionTypes.SET_LOCATIONS, payload: newLocations });
        return newLocations;
      } catch (error) {
        console.error('Failed to update locations:', error);
        throw error;
      }
    },

    // Refresh data
    refreshData: async () => {
      await loadAppData();
    }
  };

  const value = {
    state,
    actions,
    auth
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export { ActionTypes };

