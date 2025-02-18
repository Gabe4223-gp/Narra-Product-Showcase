// src/ManagePaymentMethods.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import ManagePay from "./ManagePay";
import "./ManagePaymentMethods.css";
import { useUserProfile } from "../UserProfileContext";

const allPaymentTypes = ["Debit/Credit Card", "Bank Transfer", "GCash"];

function ManagePaymentMethods() {
  const { userProfile } = useUserProfile(); // Access userProfile from context
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [modalInitialData, setModalInitialData] = useState({});

  // Fetch existing payment methods on mount
  useEffect(() => {
    async function fetchPaymentMethods() {
      if (!userProfile || !userProfile.id) return;
      try {
        const res = await axios.get("/api/user-profile/payment-methods", {
          params: { userProfileId: userProfile.id },
        });
        setPaymentMethods(res.data.paymentMethods || []);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    }
    fetchPaymentMethods();
  }, [userProfile]);

  const usedTypes = paymentMethods.map((method) => method.type);
  const availableTypes =
    editingMethod !== null
      ? allPaymentTypes
      : allPaymentTypes.filter((type) => !usedTypes.includes(type));

  // Handler for "Add Payment Method"
  function handleAdd() {
    if (paymentMethods.length === allPaymentTypes.length) {
      alert("All Payment Methods are set up already");
      return;
    }
    setEditingMethod(null);
    setModalInitialData({});
    setIsModalOpen(true);
  }

  // Basic validation
  function validateData(data) {
    if (!data.type) return "Payment type is required.";
    if (data.type === "Debit/Credit Card") {
      if (!data.cardholderName) return "Please provide a valid Name on Card.";
      if (!data.cardNumber) return "Please provide a valid Card Number.";
      if (!/^\d{4}-?\d{4}-?\d{4}-?\d{4}$/.test(data.cardNumber)) {
        return "Invalid card number format.";
      }
      if (!data.expiryDate) return "Please provide an Expiry Date.";
      if (!/^\d{2}-\d{4}$/.test(data.expiryDate)) {
        return "Expiry date must be in MM-YYYY format.";
      }
      if (!data.cvv) return "Please provide a CVV.";
    } else if (data.type === "Bank Transfer") {
      if (!data.bank) return "Please provide your Bank name.";
      if (!data.accountNumber) return "Please provide your Account Number.";
    } else if (data.type === "GCash") {
      if (!data.gcashMobileNumber) return "Please provide a GCash Mobile Number.";
    }
    return null;
  }

  // Save
  async function handleSave(data) {
    try {
      if (!userProfile || !userProfile.id) {
        alert("User profile not set up. Please update your settings first.");
        return;
      }
      const errorMsg = validateData(data);
      if (errorMsg) {
        alert(errorMsg);
        return;
      }
      await axios.put("/api/user-profile/payment-method", {
        userProfileId: userProfile.id,
        paymentType: data.type,
        data,
      });

      // If editing, update local array; else push new method
      if (editingMethod !== null) {
        const updatedMethods = [...paymentMethods];
        updatedMethods[editingMethod] = data;
        setPaymentMethods(updatedMethods);
      } else {
        // remove existing method of the same type if we only store 1 per type
        // (optional) 
        // or just push if we allow duplicates
        setPaymentMethods([...paymentMethods, data]);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving payment method:", error);
      const message =
        error.response?.data?.message || "Error saving payment method.";
      alert(message);
    }
  }

  // Edit
  async function handleEdit(index) {
    const method = paymentMethods[index];
    try {
      // If you want to re-fetch from backend, you could do:
      // const response = await axios.get("/api/user-profile/payment-method", {
      //   params: {
      //     userProfileId: userProfile.id,
      //     paymentType: method.type,
      //   },
      // });
      // const { paymentData } = response.data;

      // For simplicity, we use local data
      const paymentData = method;
      const initialData = { type: method.type, ...paymentData };
      setEditingMethod(index);
      setModalInitialData(initialData);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching payment method data:", error);
      const message =
        error.response?.data?.message || "Error fetching payment data.";
      alert(message);
    }
  }

  async function handleRemove(index) {
    const method = paymentMethods[index];
    try {
      if (!userProfile || !userProfile.id) {
        alert("User profile not set up. Please update your settings first.");
        return;
      }
      // Call DELETE endpoint
      await axios.delete("/api/user-profile/payment-method", {
        data: {
          userProfileId: userProfile.id,
          paymentType: method.type,
        }
      });
  
      // Remove from local state
      const updatedMethods = [...paymentMethods];
      updatedMethods.splice(index, 1);
      setPaymentMethods(updatedMethods);
    } catch (error) {
      console.error("Error removing payment method:", error);
      const message =
        error.response?.data?.message || "Error removing payment method.";
      alert(message);
    }
  }

  return (
    <div className="manage-payment-methods">
      <h2>Payment Methods</h2>
      {paymentMethods.length > 0 ? (
        <ul>
          {paymentMethods.map((method, index) => (
            <li key={index}>
              <span>{method.type}</span>
              <div className="button-group">
                <button onClick={() => handleEdit(index)}>Edit</button>
                <button onClick={() => handleRemove(index)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No payment methods added yet.</p>
      )}
      <button className="add-btn" onClick={handleAdd}>
        Add Payment Method
      </button>

      {isModalOpen && (
        <ManagePay
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
          initialData={modalInitialData}
          availableTypes={availableTypes}
        />
      )}
    </div>
  );
}

export default ManagePaymentMethods;
