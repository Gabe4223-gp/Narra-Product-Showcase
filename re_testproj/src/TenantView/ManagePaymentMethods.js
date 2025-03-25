import React, { useState, useEffect } from "react";
import axios from "axios";
import ManagePay from "./ManagePay";
import "./ManagePaymentMethods.css";
import { useUserProfile } from "../UserProfileContext";

const ManagePaymentMethods = () => {
  const { userProfile, refreshUserProfile } = useUserProfile();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [modalInitialData, setModalInitialData] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch Payment Methods on Component Mount
  useEffect(() => {
    if (!userProfile || !userProfile.id) return;

    async function fetchPaymentMethods() {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/user-profile/payment-methods`, {
          params: { userProfileId: userProfile.id },
        });

        if (res.data.paymentMethods.length === 0) {
          setPaymentMethods([]); // No payments set up
        } else {
          setPaymentMethods(res.data.paymentMethods || []);
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPaymentMethods();
  }, [userProfile]);

  // Open Modal to Add or Edit Payment Method
  const handleAdd = () => {
    const hasBankAndCard = paymentMethods.some((method) => method.type === "Bank & Card");
    const hasGcash = paymentMethods.some((method) => method.type === "GCash");
  
    if (hasBankAndCard && hasGcash) {
      alert("Your information is already set.");
      return;
    }
  
    setEditingMethod(null);
    setModalInitialData({ type: hasBankAndCard ? "GCash" : "Bank & Card" }); // Auto-select the remaining method
    setIsModalOpen(true);
  };
  

  // Handle Edit
  const handleEdit = (index) => {
    const method = paymentMethods[index];
    setEditingMethod(index);
    setModalInitialData(method);
    setIsModalOpen(true);
  };

  // Save Payment Method (Bank & Card or GCash)
  const handleSave = async (data) => {
    try {
      if (!userProfile || !userProfile.id) {
        alert("User profile not set up. Please update your settings first.");
        return;
      }
  
      if (data.type === "Bank & Card") {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/user-profile/payment-method`, {
          userProfileId: userProfile.id,
          paymentType: "Bank & Card",
          data,
        });
  
        alert("Bank & Card information saved successfully!");
      } else if (data.type === "GCash") {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/user-profile/payment-method`, {
          userProfileId: userProfile.id,
          paymentType: "GCash",
          data: { gcashMobileNumber: data.gcashMobileNumber },
        });
  
        alert("GCash information saved successfully!");
      }
  
      refreshUserProfile();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving payment method:", error);
      alert(error.response?.data?.message || "Error saving payment method.");
    }
  };

  // Remove Payment Method (Bank & Card or GCash)
  const handleRemove = async (index) => {
    try {
      const method = paymentMethods[index];
  
      if (!userProfile || !userProfile.id) {
        alert("User profile not set up. Please update your settings first.");
        return;
      }
  
      const confirmDelete = window.confirm(`Are you sure you want to delete ${method.type}?`);
      if (!confirmDelete) return;
  
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/user-profile/payment-method`, {
        data: { userProfileId: userProfile.id, paymentType: method.type },
      });
  
      alert(`${method.type} removed successfully!`);
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error removing payment method:", error);
      alert(error.response?.data?.message || "Error removing payment method.");
    }
  };

  return (
    <div className="manage-payment-methods">
      <div className="payment-method-header">
        <h5>Payment Methods</h5>
      </div>
  
      {loading ? (
        <p>Loading payment methods...</p>
      ) : paymentMethods.length === 0 ? (
        <p>No payments set up.</p>
      ) : (
        <ul>
          {paymentMethods.map((method, index) => (
            <li key={index}>
              <span>{method.type}</span>
              <div className="button-group">
                <button onClick={() => handleEdit(index)}>Edit</button>
                <button onClick={() => handleRemove(index)} className="delete-btn">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
  
      <button className="add-payment-method-btn" onClick={handleAdd}>
        Add Your Information
      </button>
  
      {isModalOpen && (
        <ManagePay
          onSave={(data) => {
            handleSave(data);
            setIsModalOpen(false);
            refreshUserProfile();
          }}
          onClose={() => setIsModalOpen(false)}
          initialData={modalInitialData}
        />
      )}
    </div>
  );  
};

export default ManagePaymentMethods;