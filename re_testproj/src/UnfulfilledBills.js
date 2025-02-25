// src/UnfulfilledBills.js
import React, { useState, useEffect } from 'react';

function UnfulfilledBills({ propertyId, onMarkPaid, refresh }) {
  console.log("propertyid", propertyId);
  const [bills, setBills] = useState([]);
  const [tenantBills, setTenantBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [error, setError] = useState(null);
  // Month/year filter state
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedBillIds, setSelectedBillIds] = useState(new Set());
   const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function fetchBills() {
      try {
        const res = await fetch(`/api/sendBill/unfulfilled?propertyId=${propertyId}`);
        const data = await res.json();
        
        setBills(data);
        console.log("00", bills);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Error fetching unfulfilled bills.');
      } finally {
        setLoadingBills(false);
      }
    }
    if (propertyId) {
      fetchBills();
    }

    console.log("01", bills);

  }, [propertyId, refresh]);

  const handleCheckboxChange = (billId) => {
    setSelectedBillIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(billId) ? newSet.delete(billId) : newSet.add(billId);
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedBillIds.size === 0) {
      console.error("No bills selected for deletion.");
      return;
    }
    console.log("Selectedbullids", selectedBillIds);
    try {
        // Make a DELETE request to the backend with the propertyId
        const response = await fetch(`/api/sendBill/delete-all`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bills: Array.from(selectedBillIds), propertyId: propertyId}), 
        });

        if (!response.ok) {
            console.error("Failed to delete bills:", response.statusText);
            return;
        }

        // Optionally handle the backend response
        const data = await response.json();
        console.log("Bills deleted successfully:", data);

        onMarkPaid();
        setShowDeleteModal(false);

    } catch (error) {
        console.error("Error deleting tenant:", error);
    }
  };

  const handleMarkAsPaid = async () => {
    // Show an alert with the selected bills' IDs
    alert(`Mark selected bills as paid: ${Array.from(selectedBillIds).join(', ')}`);
    
    try {
      // Make the API call to update the status of the selected bills
      const res = await fetch('/api/sendBill/markAsPaid', {
        method: 'PUT', // or 'PUT' depending on your backend design
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billIds: Array.from(selectedBillIds), // Convert Set to Array
        }),
      });
  
      // Check if the response is successful
      if (res.ok) {
        const data = await res.json();
        alert(`Successfully marked the selected bills as paid.`);
        onMarkPaid();
      } else {
        throw new Error('Failed to mark bills as paid.');
      }
    } catch (error) {
      console.error(error);
      alert('Error marking bills as paid.');
    }
  };
  
  const filteredBills = bills?.filter((bill) => {
    const billedDate = new Date(bill.createdAt);
    return (
      billedDate.getFullYear() === selectedYear &&
      billedDate.getMonth() === selectedMonth &&
      bill.paid === false
    );
  });

  return (
    <div className="bills-container">
      <div className="bills-list">
        <div className="unfulfilled-bills-header" style={{ display: "flex", justifyContent: "space-between" }}>
          <h5>Unfulfilled Bills</h5>
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
              <th>Tenant Name</th>
              <th>Subject</th>
              <th>Total Amount</th>
              <th>Date Billed</th>
              <th>Deadline</th>
              <th>Status</th>
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
                    <td>{bill.tenantName || '-'}</td>
                    <td>{bill.subject}</td>
                    <td>{bill.totalAmount?.toFixed(2)}</td>
                    <td>{dateBilled}</td>
                    <td>{bill.deadline ? new Date(bill.deadline).toLocaleString() : ""}</td>
                    <td>
                      {bill.deadline
                        ? new Date() > new Date(bill.deadline)
                          ? 'Late'
                          : `${Math.ceil((new Date(bill.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days before deadline`
                        : 'N/A'}
                    </td>
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
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  No unfulfilled bills for the selected month and year.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="actions">
          <button onClick={() => setShowDeleteModal(true)} disabled={selectedBillIds.size === 0}>
            Delete Selected
          </button>
          <button onClick={handleMarkAsPaid} disabled={selectedBillIds.size === 0}>
            Mark Selected as Paid
          </button>
        </div>
      </div>
      {showDeleteModal && (
        <div className='overlay'>
          <div className='modal'>
              <div>
                  Are you sure you want to delete these bills?
              </div>
              <button onClick={handleDeleteSelected}>Confirm</button>
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnfulfilledBills;
