//PayPalButtonsComponent.js
import React from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import './PayPalButtonsComponent.css';

function PayPalButtonsComponent() {
  const handleApprove = (data, actions) => {
    return actions.order.capture().then((details) => {
      alert(`Transaction completed by ${details.payer.name.given_name}!`);
    });
  };

  const handleError = (err) => {
    console.error('PayPal Checkout Error:', err);
    alert('An error occurred with PayPal Checkout. Please try again.');
  };

  
  return (
    <div className="paypal-buttons-container">
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: '20.00', // Can dynamically set the amount
              },
            }],
          });
        }}
        onApprove={handleApprove}
        onError={handleError}
      />
    </div>
  );
}

export default PayPalButtonsComponent;
