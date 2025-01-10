import React, { useState, useEffect } from 'react';
import UnfulfilledBills from './UnfulfilledBills';
import FulfilledBills from './FulfilledBills';
import './Billings.css';

function Billings() {
  const [unfulfilledBills, setUnfulfilledBills] = useState([]);
  const [fulfilledBills, setFulfilledBills] = useState([]);

  useEffect(() => {
    // Fetch unfulfilled bills from the backend
    fetch('/api/unfulfilled-bills')
      .then((res) => res.json())
      .then((data) => setUnfulfilledBills(data))
      .catch((err) => console.error(err));

    // Fetch fulfilled bills from the backend
    fetch('/api/fulfilled-bills')
      .then((res) => res.json())
      .then((data) => setFulfilledBills(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="billings-page">
      <h1>Billings</h1>
      <UnfulfilledBills bills={unfulfilledBills} />
      <FulfilledBills bills={fulfilledBills} />
    </div>
  );
}

export default Billings;
