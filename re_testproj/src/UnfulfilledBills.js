import React from 'react';

function UnfulfilledBills({ bills }) {
    const handleDeleteSelected = () => {
        alert('Delete selected bills');
    };
    const handleMarkAsPaid = () => {
        alert('Mark selected bills as paid');
    };
  return (
    <div className="bills-container">
      <h2>Unfulfilled Bill</h2>
      <table>
        <thead>
          <tr>
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {bills.length > 0 ? (
            bills.map((bill) => (
              <tr key={bill.id}>
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
                <td>
                  <input type="checkbox" />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="12" style={{ textAlign: 'center', color: 'gray' }}>
                No unfulfilled bills available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="actions">
        <button className="action-link" onClick={handleDeleteSelected}>
            Delete Selected
        </button>
        <button className="action-link" onClick={handleMarkAsPaid}>
            Mark Selected as Paid
        </button>
    </div>

    </div>
  );
}

export default UnfulfilledBills;
