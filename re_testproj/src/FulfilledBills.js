// src/FulfilledBills.js
import React, { useState, useEffect } from 'react';

function FulfilledBills({ propertyId }) {
  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [error, setError] = useState(null);
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedBillIds, setSelectedBillIds] = useState(new Set());

  useEffect(() => {
    async function fetchBills() {
      try {
        const res = await fetch(`/api/sendBill/fulfilled?propertyId=${propertyId}`);
        const data = await res.json();
        setBills(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Error fetching fulfilled bills.');
      } finally {
        setLoadingBills(false);
      }
    }
    if (propertyId) {
      fetchBills();
    }
  }, [propertyId]);

  const handleCheckboxChange = (billId) => {
    setSelectedBillIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(billId) ? newSet.delete(billId) : newSet.add(billId);
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    alert(`Delete selected bills: ${Array.from(selectedBillIds).join(', ')}`);
  };

  const filteredBills = bills?.filter((bill) => {
    const billedDate = new Date(bill.createdAt);
    return (
      billedDate.getFullYear() === selectedYear &&
      billedDate.getMonth() === selectedMonth &&
      bill.paid === true
    );
  });

  return (
    <div className="bills-container">
      <div className='bills-list'>
        <div className="fulfilled-bills-header" style={{ display: "flex", justifyContent: "space-between" }}>
          <h5>Fulfilled Bills</h5>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Select Month:</span>
              <select
                style={{ fontSize: "12px", padding: "2px 4px" }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Select Year:</span>
              <select
                style={{ fontSize: "12px", padding: "2px 4px" }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Subject</th>
              <th>Paid</th>
              <th>Total Amount</th>
              <th>Date Billed</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.length > 0 ? (
              filteredBills.map((bill) => {
                const dateBilled = bill.createdAt ? new Date(bill.createdAt).toLocaleString() : 'N/A';
                return (
                  <tr key={bill.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedBillIds.has(bill.id)}
                        onChange={() => handleCheckboxChange(bill.id)}
                      />
                    </td>
                    <td>{bill.subject}</td>
                    <td>{bill.paid ? 'Yes' : 'No'}</td>
                    <td>{bill.totalAmount?.toFixed(2)}</td>
                    <td>{dateBilled}</td>
                    <td>
                      <a href={bill.url} target="_blank" rel="noopener noreferrer">
                        View Invoice
                      </a>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                  No fulfilled bills for the selected month and year.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="actions">
          <button className="action-link" onClick={handleDeleteSelected} disabled={selectedBillIds.size === 0}>
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
}

export default FulfilledBills;
