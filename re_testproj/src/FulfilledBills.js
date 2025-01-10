import React from 'react';

function FulfilledBills({ bills }) {
  return (
    <div className="bills-container">
      <h2>Fulfilled Bills</h2>
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
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11" style={{ textAlign: 'center', color: 'gray' }}>
                No fulfilled bills available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default FulfilledBills;
