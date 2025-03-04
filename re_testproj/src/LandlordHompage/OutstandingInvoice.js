// src/OutstandingInvoice.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OutstandingInvoice.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function OutstandingInvoice({ propertyId }) {
  
  // Generate last 10 years for selection
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [invoiceData, setInvoiceData] = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await axios.get(`/api/invoices/${propertyId}`);
        console.log("THe invoices", res.data);
        setInvoiceData(res.data);
        console.log("Billings", res.data);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoadingBills(false);
      }
    }
    if (propertyId) {
      fetchInvoices();
    }
  }, [propertyId]);

  const processChartData = () => {
    // Initialize monthlyData with zeros
    const monthlyData = Array.from({ length: 12 }, (_, index) => ({
      month: new Date(0, index).toLocaleString("default", { month: "short" }),
      Paid: 0,
      Outstanding: 0,
    }));
  
    // Initialize a variable to keep track of the cumulative Outstanding balance
    let lastOutstanding = 0;
  
    // Step 1: Calculate the initial Outstanding balance for January
    invoiceData.forEach((invoice) => {
      const createdAt = new Date(invoice.createdAt);
      const year = createdAt.getFullYear();
      const monthIndex = createdAt.getMonth();
      const totalAmount = invoice.totalAmount;
  
      if (totalAmount !== undefined && totalAmount !== null) {
        // If the invoice is unpaid and was created before or on January of the selected year
        if (
          invoice.paid === false &&
          (year < selectedYear || (year === selectedYear && monthIndex <= 0))
        ) {
          lastOutstanding += totalAmount; // Add to initial Outstanding balance for January
        }
      }
    });
  
    // Set January's Outstanding balance
    monthlyData[0].Outstanding = lastOutstanding;
  
    // Step 2: Process invoices for each month of the selected year
    invoiceData.forEach((invoice) => {
      const createdAt = new Date(invoice.createdAt);
      const updatedAt = invoice.updatedAt ? new Date(invoice.updatedAt) : null;
      const year = createdAt.getFullYear();
      const monthIndex = createdAt.getMonth();
      const totalAmount = invoice.totalAmount;
  
      if (totalAmount !== undefined && totalAmount !== null && year === selectedYear) {
        // Add invoices created in the current month to the Outstanding balance
        monthlyData[monthIndex].Outstanding += totalAmount;
  
        // Subtract invoices paid in the current month from the Outstanding balance
        if (updatedAt && updatedAt.getFullYear() === selectedYear) {
          const paidMonthIndex = updatedAt.getMonth();
          monthlyData[paidMonthIndex].Paid += totalAmount;
  
          // Subtract the paid amount from the Outstanding balance of the current month
          monthlyData[paidMonthIndex].Outstanding -= totalAmount;
        }
      }
    });
    
  
    // Step 3: Calculate the cumulative Outstanding balance for each month
    for (let i = 1; i < 12; i++) {
      monthlyData[i].Outstanding += monthlyData[i - 1].Outstanding;
    }

    // Step 4: Set Outstanding to 0 for months after the current month
    const currentMonthIndex = new Date().getMonth();
    for (let i = currentMonthIndex + 1; i < 12; i++) {
      monthlyData[i].Outstanding = 0;
    }
  
    // Log the results for debugging
    monthlyData.forEach((data) => {
      console.log(`${data.month} -> Paid: ${data.Paid}, Outstanding: ${data.Outstanding}`);
    });
  
    return monthlyData;
  };
  
  const chartData = processChartData();
  

  return (
    <div className="invoice-chart-container">
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: "-10px",
        }}
      >
        <h4 style={{ fontSize: "14px" }}>Billings - {selectedYear}</h4>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Select Year:</span>
              <select
                style={{ fontSize: "12px" }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {loadingBills ? (
        <p>Loading data...</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={true} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Paid" fill="#82ca9d" />
            <Bar dataKey="Outstanding" fill="#ff6b6b" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );

}

export default OutstandingInvoice;
