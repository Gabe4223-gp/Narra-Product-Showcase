import React, { useState } from 'react';
import './generalLedger.css';
import './PlannedFeature.css';

// Ledger Component (as a page, not the main app)
function Ledger() {
  return (
    <div className="ledger-page">
      <div className="ledger-content">
        <GeneralLedgerHeader />
        {/* The filters and table shell are built; the entries themselves are
            not yet derived from Files/Payments. Say so, rather than leaving an
            unexplained empty table. */}
        <p className="ledger-planned-notice">
          <strong>Planned:</strong> journal entries will be derived from issued
          bills and recorded payments. The filters and export controls below are
          the intended interface; no entries are posted yet.
        </p>
        <GeneralLedgerContent />
      </div>
    </div>
  );
}

// General Ledger Header Component
function GeneralLedgerHeader() {
  return (
    <div className="general-ledger-header">
      <h1>General Ledger</h1>
      <div className="header-buttons">
        <button className="action-button">Record general journal entry</button>
        <button className="action-button">View locked periods</button>
      </div>
    </div>
  );
}

// General Ledger Content Component
function GeneralLedgerContent() {
  const [filters, setFilters] = useState({
    propertyOrCompany: 'All',
    unit: 'All',
    accounts: 'Select',
    dateRange: 'Last 30 days',
    fromDate: '',
    toDate: '',
  });

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="general-ledger-content">
      <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
      <LedgerTable />
    </div>
  );
}

// Filter Panel Component
function FilterPanel({ filters, onFilterChange }) {
  return (
    <div className="filter-panel">
      <div className="filter-row">
        <div className="filter-group">
          <label>PROPERTY OR COMPANY</label>
          <select 
            value={filters.propertyOrCompany}
            onChange={(e) => onFilterChange('propertyOrCompany', e.target.value)}
          >
            <option value="All">All</option>
            <option value="Property A">Property A</option>
            <option value="Property B">Property B</option>
          </select>
        </div>

        <div className="filter-group">
          <label>UNIT</label>
          <select 
            value={filters.unit}
            onChange={(e) => onFilterChange('unit', e.target.value)}
          >
            <option value="All">All</option>
            <option value="Unit 1">Unit 1</option>
            <option value="Unit 2">Unit 2</option>
          </select>
        </div>

        <div className="filter-group">
          <label>ACCOUNTS</label>
          <select 
            value={filters.accounts}
            onChange={(e) => onFilterChange('accounts', e.target.value)}
          >
            <option value="Select">Select</option>
            <option value="Account 1">Account 1</option>
            <option value="Account 2">Account 2</option>
          </select>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-group">
          <label>DATE RANGE</label>
          <select 
            value={filters.dateRange}
            onChange={(e) => onFilterChange('dateRange', e.target.value)}
          >
            <option value="Last 30 days">Last 30 days</option>
            <option value="Last 60 days">Last 60 days</option>
            <option value="Last 90 days">Last 90 days</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div className="filter-group">
          <label>FROM</label>
          <div className="date-input-wrapper">
            <input
              type="text"
              placeholder="Date"
              value={filters.fromDate}
              onChange={(e) => onFilterChange('fromDate', e.target.value)}
            />
            <span className="calendar-icon">📅</span>
          </div>
        </div>

        <div className="filter-group">
          <label>TO</label>
          <div className="date-input-wrapper">
            <input
              type="text"
              placeholder="Date"
              value={filters.toDate}
              onChange={(e) => onFilterChange('toDate', e.target.value)}
            />
            <span className="calendar-icon">📅</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ledger Table Component
function LedgerTable() {
  const headers = [
    'DATE (CASH BASIS)',
    'PROPERTY OR COMPANY',
    'UNIT',
    'NAME',
    'DESCRIPTION',
    'AMOUNT',
    'BALANCE'
  ];

  // Mock data - empty for now
  const rows = [];

  return (
    <div className="ledger-table-container">
      <div className="matches-count">
        # of Matches: {rows.length}
      </div>
      <div className="table-wrapper">
        <table className="ledger-table">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {/* Table cells would go here */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="empty-state">
                  <div>No data available</div>
                  <div className="empty-message">Try adjusting your filters to see results</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Export the Ledger component instead of rendering it directly
// This prevents it from loading immediately on app launch
export default Ledger;