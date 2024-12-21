//PayPalButtonsComponent.js
import React from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import './PayPalButtonsComponent.css';

function PayPalButtonsComponent({ amount, onSuccess, onError }) {
  return (
    <div className="paypal-buttons-container">
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount, // Can dynamically set the amount
                },
              },
            ],
          });
        }}
        onApprove={(data, actions) => {
          return actions.order.capture().then((details) => {
            const name = details.payer.name.given_name;
            onSuccess(details, name);
          });
        }}
        onError={(err) => {
          onError(err);
        }}
      />
    </div>
  );
}

export default PayPalButtonsComponent;
