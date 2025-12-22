// Demo data for quick testing
import db from './database';

export async function initializeDemoData() {
  try {
    // Create demo admin user
    const demoAdmin = {
      id: 'demo-admin',
      name: 'Demo Admin',
      email: 'admin@demo.com',
      phone: '9800000000',
      role: 'admin',
      username: 'demo',
      password: 'demo',
      securityQuestions: [
        { question: 'What is your favorite color?', answer: 'blue' },
        { question: 'What is your pet name?', answer: 'fluffy' }
      ],
      createdAt: new Date().toISOString()
    };

    // Create demo company
    const demoCompany = {
      id: 'demo-company',
      name: 'Demo Sofa Factory',
      address: 'Kathmandu, Nepal',
      phone: '9851234567',
      email: 'info@demosofafactory.com',
      labourManagerName: 'Demo Manager',
      labourManagerPhone: '9841234567',
      createdAt: new Date().toISOString()
    };

    // Create demo location
    const demoLocation = {
      id: 'demo-location',
      name: 'Main Factory',
      address: 'Kathmandu',
      createdAt: new Date().toISOString()
    };

    // Create demo customers
    const demoCustomers = [
      {
        id: 'customer-1',
        name: 'Ram Sharma',
        phone: '9841111111',
        email: 'ram@example.com',
        address: 'Kathmandu',
        notes: 'Regular customer',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'customer-2',
        name: 'Sita Thapa',
        phone: '9842222222',
        email: 'sita@example.com',
        address: 'Lalitpur',
        notes: 'VIP customer',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ];

    // Create demo products
    const demoProducts = [
      {
        id: 'product-1',
        name: '3-Seater Sofa',
        description: 'Comfortable 3-seater sofa with premium fabric',
        materialCost: 25000,
        laborCost: 8000,
        sellingPrice: 45000,
        estimatedDays: 7,
        createdAt: new Date().toISOString()
      },
      {
        id: 'product-2',
        name: 'L-Shaped Sofa',
        description: 'Modern L-shaped sofa for living room',
        materialCost: 35000,
        laborCost: 12000,
        sellingPrice: 65000,
        estimatedDays: 10,
        createdAt: new Date().toISOString()
      }
    ];

    // Initialize database with demo data
    await db.add('users', demoAdmin);
    await db.setCompanyProfile(demoCompany);
    await db.add('locations', demoLocation);
    
    for (const customer of demoCustomers) {
      await db.add('customers', customer);
    }
    
    for (const product of demoProducts) {
      await db.add('sofaModels', product);
    }

    return demoAdmin;
  } catch (error) {
    console.error('Failed to initialize demo data:', error);
    throw error;
  }
}
