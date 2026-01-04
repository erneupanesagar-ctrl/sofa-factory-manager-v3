// Database structure and management for Sofa Factory Manager
// Using IndexedDB for local-first storage with offline capabilities

class SofaFactoryDB {
  constructor() {
    this.dbName = 'SofaFactoryManager';
    this.version = 2;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Company Profile
        if (!db.objectStoreNames.contains('company')) {
          const companyStore = db.createObjectStore('company', { keyPath: 'id' });
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

        // Labour Payments
        if (!db.objectStoreNames.contains('labourPayments')) {
          const labourPaymentStore = db.createObjectStore('labourPayments', { keyPath: 'id', autoIncrement: true });
          labourPaymentStore.createIndex('labourerId', 'labourerId', { unique: false });
          labourPaymentStore.createIndex('locationId', 'locationId', { unique: false });
          labourPaymentStore.createIndex('paymentDate', 'paymentDate', { unique: false });
          labourPaymentStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  // Generic CRUD operations
  async add(storeName, data) {
    if (!this.db) await this.init();
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
      request.onerror = () => reject(request.error);
    });

    // Track for sync
    await this.trackSync(storeName, result, 'create');
    return result;
  }

  async get(storeName, id) {
    if (!this.db) await this.init();
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName, indexName = null, value = null) {
    try {
      if (!this.db) await this.init();
      
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
    if (!this.db) await this.init();
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Ensure data is an object before adding timestamps
    if (typeof data === 'object' && data !== null) {
      data.updatedAt = new Date().toISOString();
    }
    
    const result = await new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Track for sync
    await this.trackSync(storeName, data.id, 'update');
    return result;
  }

  async delete(storeName, id) {
    if (!this.db) await this.init();
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const result = await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Track for sync
    await this.trackSync(storeName, id, 'delete');
    return result;
  }

  // Sync tracking
  async trackSync(tableName, recordId, action) {
    const syncRecord = {
      tableName,
      recordId,
      action,
      timestamp: new Date().toISOString(),
      synced: false
    };

    if (!this.db) await this.init();
    const transaction = this.db.transaction(['syncRecords'], 'readwrite');
    const store = transaction.objectStore('syncRecords');
    
    return new Promise((resolve, reject) => {
      const request = store.add(syncRecord);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get unsynced records
  async getUnsyncedRecords() {
    const transaction = this.db.transaction(['syncRecords'], 'readonly');
    const store = transaction.objectStore('syncRecords');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const allRecords = request.result;
        const unsynced = allRecords.filter(record => !record.synced);
        resolve(unsynced);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Mark records as synced
  async markSynced(syncRecordIds) {
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
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            resolve();
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    });

    return Promise.all(promises);
  }

  // Business logic helpers
  async getCurrentUser() {
    const users = await this.getAll('users');
    return users.find(user => user.isCurrentUser) || null;
  }

  async getCompanyProfile() {
    return await this.get('company', 'profile');
  }

  async getPendingPayments(locationId = null) {
    const purchases = await this.getAll('purchases', 'paymentStatus', 'unpaid');
    const sales = await this.getAll('sales', 'paymentStatus', 'unpaid');
    
    let result = { purchases: [], sales: [] };
    
    if (locationId) {
      result.purchases = purchases.filter(p => p.locationId === locationId);
      result.sales = sales.filter(s => s.locationId === locationId);
    } else {
      result.purchases = purchases;
      result.sales = sales;
    }
    
    return result;
  }

  async getMonthlyLabourReport(month, year, locationId = null) {
    const labourCosts = await this.getAll('labourCosts', 'month', `${year}-${month.toString().padStart(2, '0')}`);
    
    if (locationId) {
      // Filter by location through sofa models
      const sofaModels = await this.getAll('sofaModels', 'locationId', locationId);
      const sofaModelIds = sofaModels.map(model => model.id);
      return labourCosts.filter(cost => sofaModelIds.includes(cost.sofaModelId));
    }
    
    return labourCosts;
  }

  async calculateProfit(saleId) {
    const sale = await this.get('sales', saleId);
    if (!sale) return null;

    const sofaModel = await this.get('sofaModels', sale.sofaModelId);
    if (!sofaModel) return null;

    const profit = sale.finalPrice - sofaModel.totalProductionCost;
    return {
      revenue: sale.finalPrice,
      cost: sofaModel.totalProductionCost,
      profit: profit,
      margin: (profit / sale.finalPrice) * 100
    };
  }
}

// Export singleton instance
const db = new SofaFactoryDB();
export default db;

