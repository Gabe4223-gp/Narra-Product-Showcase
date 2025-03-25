// PaymentHistory.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './PaymentHistory.css';
import axios from 'axios';

function PaymentHistory({ tenantDetails, refresh}) {
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
  const [proofMap, setProofMap] = useState({});

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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/${tenantEmail}`, {
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
  }, [getAccessTokenSilently, tenantDetails, refresh]);

  const filteredBills = paymentHistory?.filter((payment) => {
    const paymentDate = new Date(payment.createdAt);
    return (
      paymentDate.getFullYear() === selectedYear &&
      paymentDate.getMonth() === selectedMonth 
    );
  });
  console.log("filteredbills", filteredBills);

  //Fetch proofs
  useEffect(() => {
    async function fetchAllProofs() {
      const proofs = {};
      for (const bill of filteredBills) {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/sendBill/fetch-proof`, {
            params: {
              landlordEmail: bill.landlordEmail,
              subject: bill.subject
            }
          });
          if (res.data.success && res.data.proof && res.data.proof.url) {
            proofs[bill.id] = res.data.proof.url;
          } else {
            proofs[bill.id] = null;
          }
        } catch (error) {
          console.error(`Error fetching proof for bill ${bill.id}:`, error);
          proofs[bill.id] = null;
        }
      }
      setProofMap(proofs);
    }
  
    fetchAllProofs();
  }, []);  

  if (!user) {
    return <p>Please log in to view your payment history.</p>;
  }
  

  

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
            <th style={{ width: "15%"}}>Subject</th>
            <th style={{ width: "10%"}}>Total Amount</th>
            <th style={{ width: "5%"}}>Paid</th>
            <th style={{ width: "15%"}}>Date Billed</th>
            <th style={{ width: "15%"}}>Deadline</th>
            <th style={{ width: "15%"}}>Date Paid</th>
            <th style={{ width: "5%"}}>Status</th>
            <th style={{ width: "10%"}}>Invoice</th>
            <th style={{ width: "10%"}}>Proof of Payment</th>
          </tr>
        </thead>
          <tbody>
            {filteredBills.length > 0 ? (
              filteredBills.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ width: "15%"}}>{payment.subject}</td>
                  <td style={{ width: "10%"}}>{payment.totalAmount?.toFixed(2)}</td>
                  <td style={{ width: "5%" }}>{payment.paid ? "Paid" : "Unpaid"}</td>
                  <td style={{ width: "15%", whiteSpace: "nowrap"}} >{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : ""}</td>
                  <td style={{ width: "15%", whiteSpace: "nowrap" }}>{payment.deadline ? new Date(payment.deadline).toLocaleString() : ""}</td>
                  <td style={{ width: "15%", whiteSpace: "nowrap" }}>{payment.updatedAt ? new Date(payment.updatedAt).toLocaleString() : ""}</td>
                  <td style={{ width: "5%", whiteSpace: "nowrap"}}>
                    {payment.updatedAt
                      ? (new Date(payment.updatedAt) > new Date(payment.deadline)
                          ? 'Paid Late'
                          : 'Paid On Time')
                      : (new Date() > new Date(payment.deadline)
                          ? 'Late'
                          : '')}
                  </td>
                  <td style={{ width: "9%" }}>
                    <a href={payment.url} target="_blank" rel="noopener noreferrer">
                      View 
                    </a>
                  </td>
                  <td style={{ width: "9%" }}>
                    {proofMap[payment.id] ? (
                      <a href={proofMap[payment.id]} target="_blank" rel="noopener noreferrer">
                        View Proof
                      </a>
                    ) : (
                      'N/A'
                    )}
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
