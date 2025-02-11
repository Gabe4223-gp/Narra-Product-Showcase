// src/OutstandingInvoice.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OutstandingInvoice.css';

function OutstandingInvoice({ propertyId }) {
  const [invoiceData, setInvoiceData] = useState({
    totalInvoices: 0,
    paidInvoices: 0,
    outstandingInvoices: 0,
    lateInvoices: 0,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await axios.get(`/api/invoices/${propertyId}`);
        setInvoiceData(res.data);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    }
    fetchInvoices();
  }, [propertyId]);

  const formatCurrency = (amount) => {
    return "P " + Number(amount).toFixed(2);
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const currentMonthYear = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="outstanding-invoice">
      <div className="header">
        <h3>Outstanding Invoices</h3>
        <span className="total-amount">{formatCurrency(invoiceData.totalInvoices)}</span>
      </div>
      <div className="body">
        <div className="date-toggle">
          <button onClick={handlePreviousMonth}>&lt;</button>
          <span>{currentMonthYear}</span>
          <button onClick={handleNextMonth}>&gt;</button>
        </div>
        <div className="toggle-message">
          <small>Will fix when database is restructured</small>
        </div>
        <div className="divider"></div>
        <div className="invoice-breakdown">
          <div className="invoice-item">
            <h4>Paid Invoices</h4>
            <p>{formatCurrency(invoiceData.paidInvoices)}</p>
          </div>
          <div className="invoice-item">
            <h4>Outstanding Invoices</h4>
            <p>{formatCurrency(invoiceData.outstandingInvoices)}</p>
          </div>
          <div className="invoice-item">
            <h4>Late Invoices</h4>
            <p>{formatCurrency(invoiceData.lateInvoices)}</p>
            <small>Will fix when database is restructured</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OutstandingInvoice;
