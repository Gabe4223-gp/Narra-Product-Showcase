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
  
    invoiceData.forEach((invoice) => {
      const updatedAt = new Date(invoice.updatedAt);
      const year = updatedAt.getFullYear();
      const monthIndex = updatedAt.getMonth();
      
      // Ensure invoice has a valid totalAmount field
      const totalAmount = invoice.totalAmount;  // Make sure this field is correct
  
      if (totalAmount !== undefined && totalAmount !== null) {
        if (year === selectedYear) {
          if (invoice.paid) {
            monthlyData[monthIndex].Paid += totalAmount; // Sum the totalAmount for paid invoices
          } else {
            monthlyData[monthIndex].Outstanding += totalAmount; // Sum the totalAmount for outstanding invoices
          }
        }
      } else {
        console.error("Invoice missing totalAmount:", invoice); // Debugging if there's an issue with the invoice data
      }
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
