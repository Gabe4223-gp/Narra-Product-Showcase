// Sample data insertion script (Optional)

// backend/seed.js
const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const { v4: uuidv4 } = require('uuid');
const validUuid = uuidv4();// Generates a valid uuid

// Define the Payment model
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amountPaid: {
    type: DataTypes.INTEGER, // Stored in cents
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.INTEGER, // Stored in cents
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
  indexes: [
    {
      fields: ['client_id'],
    },
    {
      fields: ['dateOfPayment'],
    },
  ],
});

const seedPayments = async () => {
  await sequelize.sync({ force: true }); // Warning: This will drop existing tables

  await Payment.bulkCreate([
    {
      client_id: validUuid, // Replace with actual client IDs
      name: 'Malaking Talong',
      amountPaid: 2000, // $20.00
      totalAmount: 2000,
      dateOfPayment: new Date('2023-10-01T10:30:00Z'),
      subject: 'October Monthly Bill',
      invoiceUrl: 'http://localhost:5000/invoices/invoice1.pdf',
    },
    {
      client_id: validUuid,
      name: 'Big Tiyanak',
      amountPaid: 1500, // $15.00
      totalAmount: 1500,
      dateOfPayment: new Date('2023-09-01T09:15:00Z'),
      subject: 'September Monthly Bill',
      invoiceUrl: 'http://localhost:5000/invoices/invoice2.pdf',
    },
    // Add more payment records as needed
  ]);

  console.log('Payment history seeded!');
  process.exit();
};

seedPayments();
