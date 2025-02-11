// src/ManageBilling.js
import React, { useState } from 'react';
import Pay from './Pay';

const ManageBilling = ({ billingData }) => {
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const handlePayClick = (bill) => {
    setSelectedBill(bill);
    setShowPayModal(true);
  };

  const closePayModal = () => {
    setShowPayModal(false);
    setSelectedBill(null);
  };

  return (
    <div>
      <h3>Manage Billing</h3>
      <table>
        <thead>
          <tr>
            <th>Paid</th>
            <th>Full Amount</th>
            <th>Date Billed</th>
            <th>Invoice</th>
            <th>Pay</th>
          </tr>
        </thead>
        <tbody>
          {billingData.map((bill) => (
            <tr key={bill.id}>
              <td>{bill.paid ? 'Yes' : 'No'}</td>
              <td>PHP {bill.fullAmount}</td>
              <td>{bill.dateBilled}</td>
              <td>
                <a href={bill.invoiceUrl} target="_blank" rel="noreferrer">
                  View Invoice
                </a>
              </td>
              <td>
                <button onClick={() => handlePayClick(bill)}>Pay</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showPayModal && <Pay bill={selectedBill} onClose={closePayModal} />}
    </div>
  );
};

export default ManageBilling;
