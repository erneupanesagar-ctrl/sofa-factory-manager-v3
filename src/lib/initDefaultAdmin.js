// Initialize default admin account if none exists
import db from './database';

export async function initDefaultAdmin() {
  try {
    // Check if any admin exists
    const users = await db.getAll('users');
    const adminExists = users.some(u => u.role === 'admin');
    
    if (adminExists) {
      return false; // Admin already exists
    }

    // Create default admin
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

    // Create default company
    const defaultCompany = {
      id: 'default-company',
      name: 'Sofa Factory',
      address: 'Kathmandu, Nepal',
      phone: '9851234567',
      email: 'info@sofafactory.com',
      labourManagerName: 'Manager',
      labourManagerPhone: '9841234567',
      createdAt: new Date().toISOString()
    };

    // Create default location
    const defaultLocation = {
      id: 'default-location',
      name: 'Main Factory',
      address: 'Kathmandu',
      createdAt: new Date().toISOString()
    };

    // Add to database
    await db.add('users', defaultAdmin);
    await db.update('company', 'company-profile', defaultCompany);
    await db.add('locations', defaultLocation);

    console.log('Default admin account created successfully');
    return true;
    
  } catch (error) {
    console.error('Failed to create default admin:', error);
    return false;
  }
}
