import React, { useState } from 'react';

function UnfulfilledBills({ bills }) {
    // Generate last 10 years for selection
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    // Generate months for selection
    const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedBillIds, setSelectedBillIds] = useState(new Set());

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

    const handleMarkAsPaid = () => {
        alert(`Mark selected bills as paid: ${Array.from(selectedBillIds).join(', ')}`);
    };

    return (
        <div className="bills-container">
          <div className='bills-list'>
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
                          {months?.map((month, index) => (
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
                          {years?.map(year => (
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
                        <th>Paid</th>
                        <th>Full Amount</th>
                        <th>Rent</th>
                        <th>Utilities</th>
                        <th>Taxes</th>
                        <th>Other</th>
                        <th>Date Billed</th>
                        <th>Date Due</th>
                        <th>Invoice</th>
                    </tr>
                </thead>
                <tbody>
                    {bills
                        ?.filter(bill => {
                            const billedDate = new Date(bill.dateBilled);
                            return billedDate.getFullYear() === selectedYear && billedDate.getMonth() === selectedMonth;
                        })
                        ?.length > 0 ? (
                        bills
                            ?.filter(bill => {
                                const billedDate = new Date(bill.dateBilled);
                                return billedDate.getFullYear() === selectedYear && billedDate.getMonth() === selectedMonth;
                            })
                            ?.map((bill, index) => (
                                <tr key={index}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedBillIds.has(bill.id)}
                                            onChange={() => handleCheckboxChange(bill.id)}
                                        />
                                    </td>
                                    <td>{bill.tenantName}</td>
                                    <td>{bill.subject}</td>
                                    <td>{bill.paid}</td>
                                    <td>{bill.fullAmount}</td>
                                    <td>{bill.rent}</td>
                                    <td>{bill.utilities}</td>
                                    <td>{bill.taxes}</td>
                                    <td>{bill.other}</td>
                                    <td>{bill.dateBilled}</td>
                                    <td>{bill.dateDue}</td>
                                    <td>
                                        <a href={bill.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                            View Invoice
                                        </a>
                                    </td>
                                </tr>
                            ))
                    ) : (
                        <tr>
                            <td colSpan="12" style={{ textAlign: "center", padding: "20px" }}>
                                No unfulfilled bills for the selected month and year.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="actions">
                <button className="action-link" onClick={handleDeleteSelected} disabled={selectedBillIds.size === 0}>
                    Delete Selected
                </button>
                <button className="action-link" onClick={handleMarkAsPaid} disabled={selectedBillIds.size === 0}>
                    Mark Selected as Paid
                </button>
            </div>
          </div>
        </div>
    );
}

export default UnfulfilledBills;
