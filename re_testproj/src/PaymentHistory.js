// PaymentHistory.js
import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAuth0 } from '@auth0/auth0-react';
import './PaymentHistory.css';

function PaymentHistory({ tenantDetails}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { user, getAccessTokenSilently } = useAuth0();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(5);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  // Check if tenantDetails exists and has email
  const tenantEmail = tenantDetails?.email;
  console.log("tenant email propid", tenantEmail);


  // Fetch initial payments
  useEffect(() => {
    console.log("fetch works");
    const fetchInitialPayments = async () => {
      try {
        const token = await getAccessTokenSilently({
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          scope: 'openid read:payments write:payments offline_access',
        });
      
        console.log('tenantEmail before fetch:', tenantEmail);
        const response = await fetch(`/api/payments/${tenantEmail}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      
        const data = await response.json();
      
        console.log("the dataasjdf", data.payments);
      
        if (!response.ok) {
          throw new Error('Failed to fetch payment history.');
        }
      
        setPaymentHistory(data.payments);
      } catch (err) {
        setError(err.message || 'Unable to load payment history.');
      }
    };

    fetchInitialPayments();
  }, [getAccessTokenSilently, tenantDetails]);

  // Fetch more payments
  /*
    const fetchInitialPayments = async () => {
      try {
        const token = await getAccessTokenSilently({
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          scope: 'openid read:payments write:payments offline_access',
        });

        const response = await fetch(`/api/payments?page=${currentPage}&limit=${entriesPerPage}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        console.log("the dataasjdf", data);

        if (!response.ok) {
          throw new Error('Failed to fetch payment history.');
        }

        setPaymentHistory(data.payments);
        setHasMore(currentPage < data.totalPages);
      } catch (err) {
        setError(err.message || 'Unable to load payment history.');
      }
    };
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
  };*/

  if (!user) {
    return <p>Please log in to view your payment history.</p>;
  }
  const filteredBills = paymentHistory?.filter((payment) => {
    const paymentDate = new Date(payment.createdAt);
    return (
      paymentDate.getFullYear() === selectedYear &&
      paymentDate.getMonth() === selectedMonth 
    );
  });
  console.log("filteredbills", filteredBills);

  return (
    <div className="payment-history">
    <div className="fulfilled-bills-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <h5>Billing Activity</h5>
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
      
      {error && <div className="error-message">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Total Amount</th>
            <th>Paid</th>
            <th>Date Billed</th>
            <th>Deadline</th>
            <th>Date Paid</th>
            <th>Status</th>
            <th>Invoice</th>
            <th>Proof of Payment</th>
          </tr>
        </thead>
          <tbody>
            {filteredBills.length > 0 ? (
              filteredBills.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.subject}</td>
                  <td>{payment.totalAmount?.toFixed(2)}</td>
                  <td>{payment.paid ? "Paid" : "Unpaid"}</td>
                  <td>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : ""}</td>
                  <td>{payment.deadline ? new Date(payment.deadline).toLocaleString() : ""}</td>
                  <td>{payment.updatedAt ? new Date(payment.updatedAt).toLocaleString() : ""}</td>
                  <td>
                    {payment.updatedAt
                      ? (new Date(payment.updatedAt) > new Date(payment.deadline)
                          ? 'Paid Late'
                          : 'Paid On Time')
                      : (new Date() > new Date(payment.deadline)
                          ? 'Late'
                          : '')}
                  </td>
                  <td>
                    <a href={payment.url} target="_blank" rel="noopener noreferrer">
                      View 
                    </a>
                  </td>
                  <td>
                    <a href={payment.proof} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9">No payments found for the selected month and year.</td>
              </tr>
            )}
          </tbody>
      </table>

    </div>
  );
}

export default PaymentHistory;
