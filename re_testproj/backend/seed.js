// Sample data insertion script (Optional)

// backend/seed.js
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Set to true for debugging
});

// Define the Payment model
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  external_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  client_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amountPaid: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  dateOfPayment: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  invoiceUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'Payments',
});

// Seed Data
const seedPayments = async () => {
  try {
    // Sync the database schema
    await sequelize.sync({ force: true });
    console.log('Database synced.');

    // Seed data
    const validUuid = uuidv4(); // Replace with actual UUIDs
    const payments = [
      {
        client_id: validUuid,
        name: 'Malaking Talong',
        amountPaid: 2000,
        totalAmount: 2000,
        dateOfPayment: new Date('2023-10-01T10:30:00Z'),
        subject: 'October Monthly Bill',
        invoiceUrl: 'http://localhost:5000/invoices/invoice1.pdf',
      },
      {
        client_id: validUuid,
        name: 'Tiyanak',
        amountPaid: 1500,
        totalAmount: 1500,
        dateOfPayment: new Date('2023-09-01T09:15:00Z'),
        subject: 'September Monthly Bill',
        invoiceUrl: 'http://localhost:5000/invoices/invoice2.pdf',
      },
    ];

    await Payment.bulkCreate(payments);
    console.log('Payment history seeded successfully!');
  } catch (error) {
    console.error('Error seeding payments:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit();
  }
};

// Run the seeding script
seedPayments();
