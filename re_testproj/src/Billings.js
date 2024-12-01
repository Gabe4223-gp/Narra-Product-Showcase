import React, {useEffect, useState } from 'react';
//import PaymentMethods from '../components/PaymentMethods';
import { Link } from 'react-router-dom';
import './Billings.css';

function BillingPage({ onLogout }) {
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Fetch payment history from backend
  useEffect(() => {
    // Replace with your backend API endpoint
    fetch('http://localhost:5000/api/payments', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`, // Adjust based on your Auth0 setup
      },
    })
      .then((response) => response.json())
      .then((data) => setPaymentHistory(data))
      .catch((error) => console.error('Error fetching payment history:', error));
  }, []);

  return (
    <div className="billings">
      <h1>Billing</h1>
      <div className="billings-container">
        {/* Payment History Section */}
        <div className="payment-history">
          <h2>Payment History</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount Paid ($)</th>
                <th>Total Amount ($)</th>
                <th>Date of Payment</th>
                <th>Subject</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.length > 0 ? (
                paymentHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.name}</td>
                    <td>{(payment.amountPaid / 100).toFixed(2)}</td>
                    <td>{(payment.totalAmount / 100).toFixed(2)}</td>
                    <td>{new Date(payment.dateOfPayment).toLocaleDateString()}</td>
                    <td>{payment.subject}</td>
                    <td>
                      <a href={payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                        View Invoice
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    No payment history available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payment Methods Section ADD IT LATER*/}

      </div>
      <Link to="/back"><p>back</p></Link>
    </div>
  );
}

export default BillingPage;