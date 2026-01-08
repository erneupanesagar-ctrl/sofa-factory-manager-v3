// Database structure and management for Sofa Factory Manager
// Using IndexedDB for local-first storage with offline capabilities

class SofaFactoryDB {
  constructor() {
    this.dbName = 'SofaFactoryManager';
    this.version = 5; // Incremented to add attendance store
    this.db = null;
    this.initPromise = null;
  }

  async resetDatabase() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);
      deleteRequest.onsuccess = () => {
        console.log('Database deleted successfully');
        resolve();
      };
      deleteRequest.onerror = () => {
        console.error('Error deleting database');
        reject(deleteRequest.error);
      };
      deleteRequest.onblocked = () => {
        console.warn('Database deletion blocked');
        resolve();
      };
    });
  }

  async init() {
    // Prevent multiple simultaneous init calls
    if (this.initPromise) {
      return this.initPromise;
    }
    
    if (this.db) {
      return this.db;
    }

    this.initPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = (event) => {
          console.error('Database error:', event.target.error);
          this.initPromise = null;
          reject(event.target.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.initPromise = null;
          
          // Handle connection errors
          this.db.onerror = (event) => {
            console.error('Database error:', event.target.error);
          };
          
          resolve(this.db);
        };

        request.onblocked = () => {
          console.warn('Database upgrade blocked. Please close other tabs.');
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;

          // Company Profile
          if (!db.objectStoreNames.contains('company')) {
            db.createObjectStore('company', { keyPath: 'id' });
          }

          // Locations
          if (!db.objectStoreNames.contains('locations')) {
            const locationStore = db.createObjectStore('locations', { keyPath: 'id', autoIncrement: true });
            locationStore.createIndex('name', 'name', { unique: true });
          }

          // Users
          if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            userStore.createIndex('email', 'email', { unique: true });
            userStore.createIndex('role', 'role', { unique: false });
            userStore.createIndex('locationId', 'locationId', { unique: false });
          }

          // Suppliers
          if (!db.objectStoreNames.contains('suppliers')) {
            const supplierStore = db.createObjectStore('suppliers', { keyPath: 'id', autoIncrement: true });
            supplierStore.createIndex('locationId', 'locationId', { unique: false });
            supplierStore.createIndex('name', 'name', { unique: false });
          }

          // Customers
          if (!db.objectStoreNames.contains('customers')) {
            const customerStore = db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
            customerStore.createIndex('locationId', 'locationId', { unique: false });
            customerStore.createIndex('name', 'name', { unique: false });
            customerStore.createIndex('phone', 'phone', { unique: false });
          }

          // Raw Materials
          if (!db.objectStoreNames.contains('rawMaterials')) {
            const rawMaterialStore = db.createObjectStore('rawMaterials', { keyPath: 'id', autoIncrement: true });
            rawMaterialStore.createIndex('locationId', 'locationId', { unique: false });
            rawMaterialStore.createIndex('name', 'name', { unique: false });
          }

          // Labourers
          if (!db.objectStoreNames.contains('labourers')) {
            const labourerStore = db.createObjectStore('labourers', { keyPath: 'id', autoIncrement: true });
            labourerStore.createIndex('locationId', 'locationId', { unique: false });
            labourerStore.createIndex('name', 'name', { unique: false });
          }

          // Sofa Models (Finished Products)
          if (!db.objectStoreNames.contains('sofaModels')) {
            const sofaModelStore = db.createObjectStore('sofaModels', { keyPath: 'id', autoIncrement: true });
            sofaModelStore.createIndex('locationId', 'locationId', { unique: false });
            sofaModelStore.createIndex('name', 'name', { unique: false });
            sofaModelStore.createIndex('status', 'status', { unique: false });
          }

          // Orders
          if (!db.objectStoreNames.contains('orders')) {
            const orderStore = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
            orderStore.createIndex('customerId', 'customerId', { unique: false });
            orderStore.createIndex('locationId', 'locationId', { unique: false });
            orderStore.createIndex('status', 'status', { unique: false });
            orderStore.createIndex('orderDate', 'orderDate', { unique: false });
          }

          // Labour Cost Entries
          if (!db.objectStoreNames.contains('labourCosts')) {
            const labourCostStore = db.createObjectStore('labourCosts', { keyPath: 'id', autoIncrement: true });
            labourCostStore.createIndex('sofaModelId', 'sofaModelId', { unique: false });
            labourCostStore.createIndex('labourerId', 'labourerId', { unique: false });
            labourCostStore.createIndex('month', 'month', { unique: false });
          }

          // Purchases
          if (!db.objectStoreNames.contains('purchases')) {
            const purchaseStore = db.createObjectStore('purchases', { keyPath: 'id', autoIncrement: true });
            purchaseStore.createIndex('supplierId', 'supplierId', { unique: false });
            purchaseStore.createIndex('locationId', 'locationId', { unique: false });
            purchaseStore.createIndex('paymentStatus', 'paymentStatus', { unique: false });
            purchaseStore.createIndex('dueDate', 'dueDate', { unique: false });
          }

          // Sales
          if (!db.objectStoreNames.contains('sales')) {
            const salesStore = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
            salesStore.createIndex('customerId', 'customerId', { unique: false });
            salesStore.createIndex('sofaModelId', 'sofaModelId', { unique: false });
            salesStore.createIndex('locationId', 'locationId', { unique: false });
            salesStore.createIndex('status', 'status', { unique: false });
            salesStore.createIndex('paymentStatus', 'paymentStatus', { unique: false });
            salesStore.createIndex('dueDate', 'dueDate', { unique: false });
          }

          // Cleaning Services
          if (!db.objectStoreNames.contains('cleaningServices')) {
            const cleaningStore = db.createObjectStore('cleaningServices', { keyPath: 'id', autoIncrement: true });
            cleaningStore.createIndex('saleId', 'saleId', { unique: false });
            cleaningStore.createIndex('customerId', 'customerId', { unique: false });
            cleaningStore.createIndex('scheduledDate', 'scheduledDate', { unique: false });
            cleaningStore.createIndex('status', 'status', { unique: false });
          }

          // Linked Entities (for contra-entry)
          if (!db.objectStoreNames.contains('linkedEntities')) {
            const linkedStore = db.createObjectStore('linkedEntities', { keyPath: 'id', autoIncrement: true });
            linkedStore.createIndex('customerId', 'customerId', { unique: false });
            linkedStore.createIndex('supplierId', 'supplierId', { unique: false });
          }

          // Notifications
          if (!db.objectStoreNames.contains('notifications')) {
            const notificationStore = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
            notificationStore.createIndex('userId', 'userId', { unique: false });
            notificationStore.createIndex('type', 'type', { unique: false });
            notificationStore.createIndex('read', 'read', { unique: false });
            notificationStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Sync Records (for data synchronization)
          if (!db.objectStoreNames.contains('syncRecords')) {
            const syncStore = db.createObjectStore('syncRecords', { keyPath: 'id', autoIncrement: true });
            syncStore.createIndex('tableName', 'tableName', { unique: false });
            syncStore.createIndex('recordId', 'recordId', { unique: false });
            syncStore.createIndex('action', 'action', { unique: false });
            syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // Productions
          if (!db.objectStoreNames.contains('productions')) {
            const productionStore = db.createObjectStore('productions', { keyPath: 'id', autoIncrement: true });
            productionStore.createIndex('sofaModelId', 'sofaModelId', { unique: false });
            productionStore.createIndex('locationId', 'locationId', { unique: false });
            productionStore.createIndex('status', 'status', { unique: false });
            productionStore.createIndex('productionType', 'productionType', { unique: false });
            productionStore.createIndex('startDate', 'startDate', { unique: false });
          }

          // Finished Products
          if (!db.objectStoreNames.contains('finishedProducts')) {
            const finishedProductStore = db.createObjectStore('finishedProducts', { keyPath: 'id', autoIncrement: true });
            finishedProductStore.createIndex('orderId', 'orderId', { unique: false });
            finishedProductStore.createIndex('locationId', 'locationId', { unique: false });
            finishedProductStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Labour Payments
          if (!db.objectStoreNames.contains('labourPayments')) {
            const labourPaymentStore = db.createObjectStore('labourPayments', { keyPath: 'id', autoIncrement: true });
            labourPaymentStore.createIndex('labourerId', 'labourerId', { unique: false });
            labourPaymentStore.createIndex('locationId', 'locationId', { unique: false });
            labourPaymentStore.createIndex('paymentDate', 'paymentDate', { unique: false });
            labourPaymentStore.createIndex('status', 'status', { unique: false });
          }
          
          if (!db.objectStoreNames.contains('attendance')) {
            const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
            attendanceStore.createIndex('labourerId', 'labourerId', { unique: false });
            attendanceStore.createIndex('locationId', 'locationId', { unique: false });
            attendanceStore.createIndex('date', 'date', { unique: false });
            attendanceStore.createIndex('status', 'status', { unique: false });
          }
        };
      } catch (error) {
        console.error('Error initializing database:', error);
        this.initPromise = null;
        reject(error);
      }
    });

    return this.initPromise;
  }

  // Ensure database is ready
  async ensureReady() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  // Generic CRUD operations
  async add(storeName, data) {
    try {
      await this.ensureReady();
      
      if (!this.db.objectStoreNames.contains(storeName)) {
        console.error(`Object store '${storeName}' does not exist`);
        return null;
      }
      
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Ensure data is an object before adding timestamps
      if (typeof data === 'object' && data !== null) {
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
      }
      
      const result = await new Promise((resolve, reject) => {
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.error(`Error adding to ${storeName}:`, request.error);
          reject(request.error);
        };
      });

      // Track for sync (non-blocking)
      this.trackSync(storeName, result, 'create').catch(e => console.warn('Sync tracking failed:', e));
      return result;
    } catch (error) {
      console.error(`Error in add for ${storeName}:`, error);
      throw error;
    }
  }

  async get(storeName, id) {
    try {
      await this.ensureReady();
      
      if (!this.db.objectStoreNames.contains(storeName)) {
        console.warn(`Object store '${storeName}' does not exist`);
        return null;
      }
      
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => {
          console.error(`Error getting from ${storeName}:`, request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.error(`Error in get for ${storeName}:`, error);
      return null;
    }
  }

  async getAll(storeName, indexName = null, value = null) {
    try {
      await this.ensureReady();
      
      // Check if object store exists
      if (!this.db.objectStoreNames.contains(storeName)) {
        console.warn(`Object store '${storeName}' does not exist, returning empty array`);
        return [];
      }
      
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        let request;
        if (indexName && value !== null) {
          try {
            const index = store.index(indexName);
            request = index.getAll(value);
          } catch (e) {
            // Index doesn't exist, get all and filter
            request = store.getAll();
          }
        } else {
          request = store.getAll();
        }
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => {
          console.error(`Error getting all from ${storeName}:`, request.error);
          resolve([]); // Return empty array instead of rejecting
        };
      });
    } catch (error) {
      console.error(`Error in getAll for ${storeName}:`, error);
      return [];
    }
  }

  async update(storeName, data) {
    try {
      await this.ensureReady();
      
      if (!this.db.objectStoreNames.contains(storeName)) {
        console.error(`Object store '${storeName}' does not exist`);
        return null;
      }
      
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Ensure data is an object before adding timestamps
      if (typeof data === 'object' && data !== null) {
        data.updatedAt = new Date().toISOString();
      }
      
      const result = await new Promise((resolve, reject) => {
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.error(`Error updating ${storeName}:`, request.error);
          reject(request.error);
        };
      });

      // Track for sync (non-blocking)
      this.trackSync(storeName, data.id, 'update').catch(e => console.warn('Sync tracking failed:', e));
      return result;
    } catch (error) {
      console.error(`Error in update for ${storeName}:`, error);
      throw error;
    }
  }

  async delete(storeName, id) {
    try {
      await this.ensureReady();
      
      if (!this.db.objectStoreNames.contains(storeName)) {
        console.error(`Object store '${storeName}' does not exist`);
        return null;
      }
      
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const result = await new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.error(`Error deleting from ${storeName}:`, request.error);
          reject(request.error);
        };
      });

      // Track for sync (non-blocking)
      this.trackSync(storeName, id, 'delete').catch(e => console.warn('Sync tracking failed:', e));
      return result;
    } catch (error) {
      console.error(`Error in delete for ${storeName}:`, error);
      throw error;
    }
  }

  // Sync tracking
  async trackSync(tableName, recordId, action) {
    try {
      const syncRecord = {
        tableName,
        recordId,
        action,
        timestamp: new Date().toISOString(),
        synced: false
      };

      await this.ensureReady();
      
      if (!this.db.objectStoreNames.contains('syncRecords')) {
        return null;
      }
      
      const transaction = this.db.transaction(['syncRecords'], 'readwrite');
      const store = transaction.objectStore('syncRecords');
      
      return new Promise((resolve, reject) => {
        const request = store.add(syncRecord);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.warn('Sync tracking error:', request.error);
          resolve(null); // Don't fail on sync tracking errors
        };
      });
    } catch (error) {
      console.warn('Sync tracking failed:', error);
      return null;
    }
  }

  // Get unsynced records
  async getUnsyncedRecords() {
    try {
      await this.ensureReady();
      
      if (!this.db.objectStoreNames.contains('syncRecords')) {
        return [];
      }
      
      const transaction = this.db.transaction(['syncRecords'], 'readonly');
      const store = transaction.objectStore('syncRecords');
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const allRecords = request.result || [];
          const unsynced = allRecords.filter(record => !record.synced);
          resolve(unsynced);
        };
        request.onerror = () => resolve([]);
      });
    } catch (error) {
      console.error('Error getting unsynced records:', error);
      return [];
    }
  }

  // Mark records as synced
  async markSynced(syncRecordIds) {
    try {
      await this.ensureReady();
      
      if (!this.db.objectStoreNames.contains('syncRecords')) {
        return;
      }
      
      const transaction = this.db.transaction(['syncRecords'], 'readwrite');
      const store = transaction.objectStore('syncRecords');
      
      const promises = syncRecordIds.map(id => {
        return new Promise((resolve, reject) => {
          const getRequest = store.get(id);
          getRequest.onsuccess = () => {
            const record = getRequest.result;
            if (record) {
              record.synced = true;
              const putRequest = store.put(record);
              putRequest.onsuccess = () => resolve();
              putRequest.onerror = () => resolve(); // Don't fail
            } else {
              resolve();
            }
          };
          getRequest.onerror = () => resolve(); // Don't fail
        });
      });

      return Promise.all(promises);
    } catch (error) {
      console.error('Error marking synced:', error);
    }
  }

  // Business logic helpers
  async getCurrentUser() {
    try {
      const users = await this.getAll('users');
      return users.find(user => user.isCurrentUser) || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getCompanyProfile() {
    try {
      return await this.get('company', 'profile');
    } catch (error) {
      console.error('Error getting company profile:', error);
      return null;
    }
  }

  async getPendingPayments(locationId = null) {
    try {
      const purchases = await this.getAll('purchases', 'paymentStatus', 'unpaid');
      const sales = await this.getAll('sales', 'paymentStatus', 'unpaid');
      
      let result = { purchases: [], sales: [] };
      
      if (locationId) {
        result.purchases = (purchases || []).filter(p => p.locationId === locationId);
        result.sales = (sales || []).filter(s => s.locationId === locationId);
      } else {
        result.purchases = purchases || [];
        result.sales = sales || [];
      }
      
      return result;
    } catch (error) {
      console.error('Error getting pending payments:', error);
      return { purchases: [], sales: [] };
    }
  }

  async getMonthlyLabourReport(month, year, locationId = null) {
    try {
      const labourCosts = await this.getAll('labourCosts', 'month', `${year}-${month.toString().padStart(2, '0')}`);
      
      if (locationId) {
        // Filter by location through sofa models
        const sofaModels = await this.getAll('sofaModels', 'locationId', locationId);
        const sofaModelIds = (sofaModels || []).map(model => model.id);
        return (labourCosts || []).filter(cost => sofaModelIds.includes(cost.sofaModelId));
      }
      
      return labourCosts || [];
    } catch (error) {
      console.error('Error getting monthly labour report:', error);
      return [];
    }
  }

  async calculateProfit(saleId) {
    try {
      const sale = await this.get('sales', saleId);
      if (!sale) return null;

      const sofaModel = await this.get('sofaModels', sale.sofaModelId);
      if (!sofaModel) return null;

      const profit = sale.finalPrice - (sofaModel.totalProductionCost || 0);
      return {
        revenue: sale.finalPrice,
        cost: sofaModel.totalProductionCost || 0,
        profit: profit,
        margin: sale.finalPrice > 0 ? (profit / sale.finalPrice) * 100 : 0
      };
    } catch (error) {
      console.error('Error calculating profit:', error);
      return null;
    }
  }
}

// Export singleton instance
const db = new SofaFactoryDB();
export default db;
