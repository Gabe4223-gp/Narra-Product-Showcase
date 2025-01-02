import React, {useEffect, useState } from 'react';
import PaymentMethods from './PaymentMethods';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import './Billings.css';

function BillingPage({ onLogout }) {
  //Currently local host, replace with backend URL
  const BaseURL = process.env.REACT_APP_API_URL;
  const { getAccessTokenSilently, user } = useAuth0();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  //Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5; // Number of entries per page

  // Fetch payment history from backend
  useEffect(() => {
    console.log(`API URL:`, BaseURL); //TEMPORARY
    const fetchInitialPayments = async () => {
      try {
        //Retrieve access token from Auth0
        const token = await getAccessTokenSilently();
        console.log('Auth0 Access Token:', token); //TEMPORARY

        //Fetch payment history from backend using environment variable for API URL
        const response = await fetch(`${BaseURL}/api/payments?page=${currentPage}&limit=${entriesPerPage}`, {
          headers: {
            Authorization: `Bearer ${token}`, //Match Authorization header to Auth0 setup
          'Client-ID': user.sub, //Assuming 'client_id' is mapped to Auth0's user ID
        },
      });

        if (!response.ok) {
          throw new Error('Unable to load payment history.');
        }

        const data = await response.json();
        setPaymentHistory(data.payments);
        setHasMore(currentPage < data.totalPages);
      } catch (err) {
        setError(err.message || 'Something went wrong.');
      }
    };

    fetchInitialPayments();
  }, [getAccessTokenSilently, currentPage, entriesPerPage, user.sub]);

  const fetchMorePayments = async () => {
    const nextPage = currentPage + 1;

    try {
      const token = await getAccessTokenSilently();

      const response = await fetch(`${BaseURL}/api/payments?page=${nextPage}&limit=${entriesPerPage}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Client-ID': user.sub,
        },
    });

      if (!response.ok) {
        throw new Error('Unable to load more payment history.');
      }

      const data = await response.json();
      setPaymentHistory((prev) => [...prev, ...data.payments]);
      setCurrentPage(nextPage);
      setHasMore(nextPage < data.totalPages);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    }
  };

  return (
    <div className="billings">
      <h1>Billing</h1>
      <div className="billings-container">
        {/* Payment History Section */}
        <div className="payment-history">
          <h2>Payment History</h2>
            {error && <div className="error-message">{error}</div>}
            <InfiniteScroll
              dataLength={paymentHistory.length}
              next={fetchMorePayments}
              hasMore={hasMore}
              loader={<div className="spinner"></div>}
              endMessage={<p style={{ textAlign: 'center' }}>No more payments</p>}
            >
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
                      <td colSpan="6" style={{ textAlign: 'center'}}>
                        No Payment history available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </InfiniteScroll>
        </div>

        {/* Payment Methods Section*/}
        <PaymentMethods />
      </div>
      <Link to="/back"><p>back</p></Link>
    </div>
  );
}

export default BillingPage;