// PaymentHistory.js
import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAuth0 } from '@auth0/auth0-react';
import './PaymentHistory.css';

function PaymentHistory({ BaseURL }) {
  const { user, getAccessTokenSilently } = useAuth0();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(5);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  // Fetch initial payments
  useEffect(() => {
    const fetchInitialPayments = async () => {
      try {
        const token = await getAccessTokenSilently({
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          scope: 'openid read:payments write:payments offline_access',
        });

        const response = await fetch(`${BaseURL}/api/payments?page=${currentPage}&limit=${entriesPerPage}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch payment history.');
        }

        const data = await response.json();
        setPaymentHistory(data.payments);
        setHasMore(currentPage < data.totalPages);
      } catch (err) {
        setError(err.message || 'Unable to load payment history.');
      }
    };

    fetchInitialPayments();
  }, [getAccessTokenSilently, currentPage, BaseURL, entriesPerPage]);

  // Fetch more payments
  const fetchMorePayments = async () => {
    const nextPage = currentPage + 1;
    try {
      const token = await getAccessTokenSilently({
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: 'openid read:payments write:payments offline_access',
      });

      const response = await fetch(`${BaseURL}/api/payments?page=${nextPage}&limit=${entriesPerPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch more payment history.');
      }

      const data = await response.json();
      setPaymentHistory((prev) => [...prev, ...data.payments]);
      setCurrentPage(nextPage);
      setHasMore(nextPage < data.totalPages);
    } catch (err) {
      setError(err.message || 'Unable to load more payment history.');
    }
  };

  if (!user) {
    return <p>Please log in to view your payment history.</p>;
  }

  return (
    <div className="payment-history">
      <h5>Billing Activity</h5>
      {error && <div className="error-message">{error}</div>}
      <InfiniteScroll
        dataLength={paymentHistory.length}
        next={fetchMorePayments}
        hasMore={hasMore}
        loader={<div className="spinner">Loading payment history...</div>}
        endMessage={<p style={{ textAlign: 'center' }}>No more payments</p>}
      >
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount Paid (PHP)</th>
              <th>Total Amount (PHP)</th>
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
                <td colSpan="6" style={{ textAlign: 'center', fontStyle: 'italic', color: 'gray' }}>
                  No payment history available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </InfiniteScroll>
    </div>
  );
}

export default PaymentHistory;
