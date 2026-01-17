// Authentication and user management for Sofa Factory Manager
import db from './database.js';

export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  LABOUR_MANAGER: 'labour_manager'
};

export const PERMISSIONS = {
  VIEW_PROFITS: 'view_profits',
  MANAGE_COSTS: 'manage_costs',
  APPROVE_SALES: 'approve_sales',
  MANAGE_USERS: 'manage_users',
  MANAGE_COMPANY: 'manage_company',
  MANAGE_LABOUR: 'manage_labour',
  VIEW_ALL_LOCATIONS: 'view_all_locations',
  SEND_NOTIFICATIONS: 'send_notifications'
};

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    await db.init();
    this.currentUser = await db.getCurrentUser();
    this.isInitialized = true;
  }

  // Check if this is the first time setup
  async isFirstTimeSetup() {
    const users = await db.getAll('users');
    return users.length === 0;
  }

  // Reset database (for troubleshooting)
  async resetDatabase() {
    try {
      await db.resetDatabase();
      this.currentUser = null;
      return true;
    } catch (error) {
      console.error('Failed to reset database:', error);
      throw error;
    }
  }

  // Create admin account (first time setup)
  async createAdminAccount(userData) {
    // Check if email already exists
    if (userData.email) {
      const existingUsers = await db.getAll('users', 'email', userData.email);
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('An admin account with this email already exists. Please use a different email or reset the database.');
      }
    }

    const adminData = {
      ...userData,
      role: USER_ROLES.ADMIN,
      isCurrentUser: true,
      permissions: this.getPermissionsForRole(USER_ROLES.ADMIN),
      setupCode: null,
      locationId: null // Admin can access all locations
    };

    try {
      const adminId = await db.add('users', adminData);
      this.currentUser = await db.get('users', adminId);
      return this.currentUser;
    } catch (error) {
      // Check for constraint violation (DOMException)
      if (error.name === 'ConstraintError' || (error.message && error.message.includes('constraint'))) {
        console.warn('Constraint violation detected during admin creation. Suggesting database reset.');
        throw new Error('Database constraint violation detected. This usually means an account already exists. Please try resetting the database.');
      }
      throw error;
    }
  }

  // Generate setup code for new users
  generateSetupCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Create user profile with setup code
  async createUserProfile(userData) {
    const setupCode = this.generateSetupCode();
    const userProfile = {
      ...userData,
      setupCode,
      permissions: this.getPermissionsForRole(userData.role),
      isActive: false, // Will be activated when they use the setup code
      isCurrentUser: false
    };

    const userId = await db.add('users', userProfile);
    return { userId, setupCode };
  }

  // Activate user account with setup code
  async activateUserAccount(setupCode, deviceInfo = {}) {
    const users = await db.getAll('users');
    const user = users.find(u => u.setupCode === setupCode && !u.isActive);
    
    if (!user) {
      throw new Error('Invalid or expired setup code');
    }

    // Activate the user
    user.isActive = true;
    user.isCurrentUser = true;
    user.deviceInfo = deviceInfo;
    user.lastLogin = new Date().toISOString();

    // Deactivate other current users on this device
    const otherUsers = users.filter(u => u.id !== user.id && u.isCurrentUser);
    for (const otherUser of otherUsers) {
      otherUser.isCurrentUser = false;
      await db.update('users', otherUser);
    }

    await db.update('users', user);
    this.currentUser = user;
    return user;
  }

  // Login (switch between users on same device)
  async login(userId) {
    const user = await db.get('users', userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Update current user flags
    const users = await db.getAll('users');
    for (const u of users) {
      u.isCurrentUser = (u.id === userId);
      await db.update('users', u);
    }

    user.lastLogin = new Date().toISOString();
    await db.update('users', user);
    
    this.currentUser = user;
    return user;
  }

  // Logout
  async logout() {
    if (this.currentUser) {
      this.currentUser.isCurrentUser = false;
      await db.update('users', this.currentUser);
      this.currentUser = null;
    }
  }

  // Get permissions for role
  getPermissionsForRole(role) {
    switch (role) {
      case USER_ROLES.ADMIN:
        return Object.values(PERMISSIONS);
      
      case USER_ROLES.LABOUR_MANAGER:
        return [
          PERMISSIONS.MANAGE_LABOUR,
          PERMISSIONS.MANAGE_COSTS
        ];
      
      case USER_ROLES.STAFF:
        return []; // Staff have minimal permissions
      
      default:
        return [];
    }
  }

  // Check if current user has permission
  hasPermission(permission) {
    if (!this.currentUser) return false;
    return this.currentUser.permissions.includes(permission);
  }

  // Check if current user can access location
  canAccessLocation(locationId) {
    if (!this.currentUser) return false;
    
    // Admin can access all locations
    if (this.currentUser.role === USER_ROLES.ADMIN) return true;
    
    // Other users can only access their assigned location
    return this.currentUser.locationId === locationId;
  }

  // Get accessible locations for current user
  async getAccessibleLocations() {
    if (!this.currentUser) return [];
    
    const allLocations = await db.getAll('locations');
    
    // Admin can access all locations
    if (this.currentUser.role === USER_ROLES.ADMIN) {
      return allLocations;
    }
    
    // Other users can only access their assigned location
    return allLocations.filter(loc => loc.id === this.currentUser.locationId);
  }

  // Get current user info
  getCurrentUser() {
    return this.currentUser;
  }

  // Update user permissions (Admin only)
  async updateUserPermissions(userId, permissions) {
    if (!this.hasPermission(PERMISSIONS.MANAGE_USERS)) {
      throw new Error('Insufficient permissions');
    }

    const user = await db.get('users', userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.permissions = permissions;
    await db.update('users', user);
    return user;
  }

  // Get all users (Admin only)
  async getAllUsers() {
    if (!this.hasPermission(PERMISSIONS.MANAGE_USERS)) {
      throw new Error('Insufficient permissions');
    }

    return await db.getAll('users');
  }

  // Delete user (Admin only)
  async deleteUser(userId) {
    if (!this.hasPermission(PERMISSIONS.MANAGE_USERS)) {
      throw new Error('Insufficient permissions');
    }

    if (userId === this.currentUser.id) {
      throw new Error('Cannot delete current user');
    }

    await db.delete('users', userId);
  }

  // Check if user is admin
  isAdmin() {
    return this.currentUser && this.currentUser.role === USER_ROLES.ADMIN;
  }

  // Check if user is staff
  isStaff() {
    return this.currentUser && this.currentUser.role === USER_ROLES.STAFF;
  }

  // Check if user is labour manager
  isLabourManager() {
    return this.currentUser && this.currentUser.role === USER_ROLES.LABOUR_MANAGER;
  }
}

// Export singleton instance
const auth = new AuthManager();
export default auth;

