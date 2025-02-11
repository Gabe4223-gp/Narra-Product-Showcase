// src/ManagePaymentMethods.js
import React, { useState } from "react";
import axios from "axios";
import ManagePay from "./ManagePay";
import "./ManagePaymentMethods.css";

const allPaymentTypes = ["Debit/Credit Card", "Bank Transfer", "GCash"];

function ManagePaymentMethods({ currentUser }) {
  // currentUser should contain at least the id, name, etc.
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  // initialData for the modal when editing
  const [modalInitialData, setModalInitialData] = useState({});

  const usedTypes = paymentMethods.map((method) => method.type);
  const availableTypes =
    editingMethod !== null
      ? allPaymentTypes // Allow editing of existing option.
      : allPaymentTypes.filter((type) => !usedTypes.includes(type));

  // Handler for "Add Payment Method" button
  function handleAdd() {
    if (paymentMethods.length === allPaymentTypes.length) {
      alert("All Payment Methods are set up already");
      return;
    }
    // For adding a new method, initialData is empty.
    setEditingMethod(null);
    setModalInitialData({});
    setIsModalOpen(true);
  }

  // Handler for Save button: makes the API PUT request.
  async function handleSave(data) {
    try {
      if (!currentUser || !currentUser.id) {
            alert("User profile not set up. Please update your settings first.");
            return;
        }
        await axios.put("/api/user-profile/payment-method", {
        userId: currentUser.id,
        paymentType: data.type,
        data: data,
      });
      // If saving was successful, update local state.
      if (editingMethod !== null) {
        const updatedMethods = [...paymentMethods];
        updatedMethods[editingMethod] = data;
        setPaymentMethods(updatedMethods);
      } else {
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

  // Handler for Edit button: calls the GET endpoint.
  async function handleEdit(index) {
    const method = paymentMethods[index];
    try {
      const response = await axios.get("/api/user-profile/payment-method", {
        params: {
          userId: currentUser.id,
          paymentType: method.type,
        },
      });
      // Response contains paymentData
      const { paymentData } = response.data;
      // Combine payment type with the retrieved data.
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

  // Remove payment method locally (and optionally via an API call)
  async function handleRemove(index) {
    // For now, we remove it locally. You might also implement a DELETE API call.
    const updatedMethods = [...paymentMethods];
    updatedMethods.splice(index, 1);
    setPaymentMethods(updatedMethods);
    // Optionally: call an API endpoint to remove this method from the backend.
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
          // If editing, pass in the existing data; otherwise, pass an empty object.
          initialData={modalInitialData}
          availableTypes={availableTypes}
        />
      )}
    </div>
  );
}

export default ManagePaymentMethods;
