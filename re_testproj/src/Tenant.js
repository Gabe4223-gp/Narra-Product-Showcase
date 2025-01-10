import React, { useState } from 'react';
import './Tenant.css';
import TenantProfile from './TenantProfile';
import * as XLSX from 'xlsx';

class TenantClass {
  constructor({
    id = null,
    name = "NA",
    unit = "NA",
    phone = null,
    email = null,
    leaseStarted = null,
    leaseExpiry = null,
    leaseDoc = [],
    billingDeadline = null,
    nationality = "NA",
    occupation = "NA",
    authorizedOccupants = [],
    image = "https://via.placeholder.com/150",
    eWalletName = null,
    eWalletReferenceNo = null,
    bankName = null,
    bankReferenceNo = null,
    creditCardName = null,
    creditCardNo = null,
    creditCardDate = null,
  } = {}) {
    this.id = id;
    this.name = name;
    this.unit = unit;
    this.phone = phone;
    this.email = email;
    this.leaseStarted = leaseStarted;
    this.leaseExpiry = leaseExpiry;
    this.leaseDoc = leaseDoc;
    this.billingDeadline = billingDeadline;
    this.nationality = nationality;
    this.occupation = occupation;
    this.authorizedOccupants = authorizedOccupants;
    this.image = image;
    this.eWalletName = eWalletName;
    this.eWalletReferenceNo = eWalletReferenceNo;
    this.bankName = bankName;
    this.bankReferenceNo = bankReferenceNo;
    this.creditCardName = creditCardName;
    this.creditCardNo = creditCardNo;
    this.creditCardDate = creditCardDate;
  }
}

function Tenant() {
  const defaultImage = "https://via.placeholder.com/150";
  const [tenants, setTenants] = useState([]);
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedTenantIds, setSelectedTenantIds] = useState(new Set());
  const [newTenant, setNewTenant] = useState({
    id: null,
    name: "",
    unit: "",
    phone: "",
    email: "",
    leaseStarted: "",
    leaseExpiry: "",
    leaseDoc: [],
    billingDeadline: "",
    nationality: "",
    occupation: "",
    authorizedOccupants: [],
    image: defaultImage,
    eWalletName: "",
    eWalletReferenceNo: "",
    bankName: "",
    bankReferenceNo: "",
    creditcardName: "",
    creditcardNo: "",
    creditcardDate: "",
  });

  const handleEditTenantDetails = (editedTenant) => {
    const updatedTenants = tenants.map((tenant) =>
        tenant.id === editedTenant.id ? { ...tenant, ...editedTenant } : tenant
    );
    setTenants(updatedTenants); // Update the tenants array in state
  };

  const handleAddTenantChange = (field, value) => {
    setNewTenant({ ...newTenant, [field]: value });
  };

  const saveNewTenant = () => {
    const tenant = new TenantClass(newTenant); // Instantiate Tenant class
    setTenants([...tenants, tenant]); // Add the new tenant object to the state
    setNewTenant({
      id: Math.random(),
      name: "",
      unit: "",
      phone: "",
      email: "",
      leaseStarted: "",
      leaseExpiry: "",
      leaseDoc: [],
      billingDeadline: "",
      nationality: "",
      occupation: "",
      authorizedOccupants: [],
      image: defaultImage,
      eWalletName: "",
      eWalletReferenceNo: "",
      bankName: "",
      bankReferenceNo: "",
      creditcardName: "",
      creditcardNo: "",
      creditcardDate: "",
    });
    setIsAddingTenant(false);
  };

  const handleViewProfile = (tenant) => {
    setSelectedTenant(tenant);
  };

  const handleBackToList = () => {
    setSelectedTenant(null);
  };

  const handleUpdateLeaseDocs = (updatedDoc) => {
    const updatedTenants = tenants.map((tenant) =>
        tenant.id === selectedTenant.id
            ? 
            { ...tenant, leaseDoc: [...(tenant.leaseDoc || []), updatedDoc] }
            : tenant
    );
    setTenants(updatedTenants);
  };

  const updateAuthorizedOccupants = (updatedOccupants) => {
    const updatedTenants = tenants.map((tenant) =>
      tenant === selectedTenant
        ? { ...tenant, authorizedOccupants: updatedOccupants }
        : tenant
    );
    setTenants(updatedTenants);
  };

  const exportToExcel = () => {
    // Filter tenants to export based on selectedTenantIds
    const tenantsToExport = tenants.filter((tenant) =>
      selectedTenantIds.has(tenant.id) // Assuming each tenant has a unique 'id'
    );

    if (tenantsToExport.length > 0) {
      // Prepare data to export
      const tenantsData = tenantsToExport.map((tenant) => ({
        Name: tenant.name,
        Unit: tenant.unit,
        Phone: tenant.phone,
        Email: tenant.email,
        LeaseStarted: tenant.leaseStarted,
        LeaseExpiry: tenant.leaseExpiry,
        BillingDeadline: tenant.billingDeadline,
        Nationality: tenant.nationality,
        Occupation: tenant.occupation,
        AuthorizedOccupants: tenant.authorizedOccupants.map((occupant) => `${occupant.name} (${occupant.email})`).join(", "), // Joining authorized occupants into a string
        EWalletName: tenant.eWalletName,
        EWalletReferenceNo: tenant.eWalletReferenceNo,
        BankName: tenant.bankName,
        BankReferenceNo: tenant.bankReferenceNo,
        CreditCardName: tenant.creditcardName,
        CreditCardNo: tenant.creditcardNo,
        CreditCardDate: tenant.creditcardDate,
      }));
    
      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(tenantsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tenants");
    
      // Export the workbook to a file
      XLSX.writeFile(wb, "tenant_list.xlsx");
    }

    else {
      alert("Please select a tenant");
    }
  
    
  };

  // Define the required columns and their format
  const requiredColumns = [
    "Name",
    "Unit",
    "Phone",
    "Email",
    "LeaseStarted",
    "LeaseExpiry",
    "BillingDeadline",
    "Nationality",
    "Occupation",
    "AuthorizedOccupants",
    "EWalletName",
    "EWalletReferenceNo",
    "BankName",
    "BankReferenceNo",
    "CreditCardName",
    "CreditCardNo",
    "CreditCardDate",
  ];

  // Import from Excel
  const importFromExcel = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
        // Validate required columns
        const missingColumns = requiredColumns.filter(
          (column) => !(column in jsonData[0])
        );
  
        if (missingColumns.length > 0) {
          alert(
            `The following required columns are missing: ${missingColumns.join(
              ", "
            )}`
          );
          return;
        }
  
        // Map data if validation passes
        const importedTenants = jsonData.map((tenant) => new TenantClass({
          id: tenant.id,
          name: tenant.Name,
          unit: tenant.Unit,
          phone: tenant.Phone,
          email: tenant.Email,
          leaseStarted: tenant.LeaseStarted,
          leaseExpiry: tenant.LeaseExpiry,
          billingDeadline: tenant.BillingDeadline,
          nationality: tenant.Nationality,
          occupation: tenant.Occupation,
          authorizedOccupants: tenant.AuthorizedOccupants
            ? tenant.AuthorizedOccupants.split(",").map((occupant) => {
                const [name, email] = occupant.split("(");
                return {
                  name: name.trim(),
                  email: email ? email.replace(")", "").trim() : "",
                };
              })
            : [],
          eWalletName: tenant.EWalletName,
          eWalletReferenceNo: tenant.EWalletReferenceNo,
          bankName: tenant.BankName,
          bankReferenceNo: tenant.BankReferenceNo,
          creditcardName: tenant.CreditCardName,
          creditcardNo: tenant.CreditCardNo,
          creditcardDate: tenant.CreditCardDate,
        }));
  
        // Append new tenants to state
        setTenants((prevTenants) => [...prevTenants, ...importedTenants]);
      };
  
      reader.readAsBinaryString(file);
  
      // Reset file input
      event.target.value = "";
    }
  };

  const handleCheckboxChange = (tenantId) => {
    const updatedSelectedTenantIds = new Set(selectedTenantIds);
    if (updatedSelectedTenantIds.has(tenantId)) {
      updatedSelectedTenantIds.delete(tenantId); // Deselect
    } else {
      updatedSelectedTenantIds.add(tenantId); // Select
    }
    setSelectedTenantIds(updatedSelectedTenantIds);
  };

  const handleDeselectAll = () => {
    setSelectedTenantIds(new Set()); // Clears all selected tenant IDs
  };
  
  const handleSelectAll = () => {
    // Create a new Set to hold all tenant IDs
    const allTenantIds = new Set(tenants.map((tenant) => tenant.id));
    
    // Update the selectedTenantIds state to include all tenant IDs
    setSelectedTenantIds(allTenantIds); // Assuming setSelectedTenantIds is the function for updating selected tenants
  };

  if (selectedTenant !== null) {
    return (
      <TenantProfile
        tenant={selectedTenant}
        onBack={handleBackToList}
        onUpdateAuthorizedOccupants={updateAuthorizedOccupants}
        onUpdateLeaseDocs={handleUpdateLeaseDocs}
        onEditTenantDetails={handleEditTenantDetails}
      />
    );
  }

  return (
    <div className="tenant-container">
      <div className='tenant-list-top'>
        <h3>Tenant List</h3>
        <button className='tenant-list-switch-property'>View: </button> 
      </div>
      <div className="tenant-list">
        <table>
          <thead>
            <tr>
              <th> </th>
              <th>Name</th>
              <th>Unit Number</th>
              <th>Email</th>
              <th>Lease Started</th>
              <th>Lease Expiry</th>
              <th>Billing Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length > 0 ? (
              tenants.map((tenant, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedTenantIds.has(tenant.id)}
                      onChange={() => handleCheckboxChange(tenant.id)}
                    />
                  </td>
                  <td>{tenant.name}</td>
                  <td>{tenant.unit}</td>
                  <td>{tenant.email}</td>
                  <td>{tenant.leaseStarted}</td>
                  <td>{tenant.leaseExpiry}</td>
                  <td>{tenant.billingDeadline}</td>
                  <td>
                    <button onClick={() => handleViewProfile(tenant)}>View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  No tenants added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="actions">
        <button className="addTenant" onClick={() => setIsAddingTenant(true)}>
          Add Tenant
        </button>
        <button onClick={exportToExcel} className="exportTenants">Export Selected</button>
        <div>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={importFromExcel}
            style={{ display: "none" }}
            id="file-upload"
          />
          <button
            onClick={() => document.getElementById("file-upload").click()}
            className="importTenants"
          >
            Import From Excel
          </button>
          
          <button onClick={handleSelectAll}>Select All</button>
       
          <button onClick={handleDeselectAll}>Unselect All</button>
      
        </div>
      </div>

      {isAddingTenant && (
        <div className="modal">
          <h3>Add New Tenant</h3>
          <form>
            <label>
              Name:
              <input
                type="text"
                value={newTenant.name}
                onChange={(e) => handleAddTenantChange("name", e.target.value)}
              />
            </label>
            <label>
              Unit Number:
              <input
                type="text"
                value={newTenant.unit}
                onChange={(e) => handleAddTenantChange("unit", e.target.value)}
              />
            </label>
            <label>
              Phone Number:
              <input
                type="text"
                value={newTenant.phone}
                onChange={(e) => handleAddTenantChange("phone", e.target.value)}
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                value={newTenant.email}
                onChange={(e) => handleAddTenantChange("email", e.target.value)}
              />
            </label>
            <label>
              Nationality:
              <input
                type="text"
                value={newTenant.nationality}
                onChange={(e) =>
                  handleAddTenantChange("nationality", e.target.value)
                }
              />
            </label>
            <label>
              Occupation:
              <input
                type="text"
                value={newTenant.occupation}
                onChange={(e) =>
                  handleAddTenantChange("occupation", e.target.value)
                }
              />
            </label>
          </form>
          <div>
            <button onClick={saveNewTenant}>Save</button>
            <button onClick={() => setIsAddingTenant(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tenant;
