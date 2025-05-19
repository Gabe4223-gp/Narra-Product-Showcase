import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import './ReceivablesDashboard.css';

// Navbar Component
function Navbar() {
  const tabs = [
    { name: "Receivables", active: true },
    { name: "Expenses", active: false },
    { name: "Transactions", active: false },
    { name: "Billings", active: false },
    { name: "Bank/Payment", active: false },
    { name: "BIR Filings", active: false },
    { name: "Trust Accounts", active: false }
  ];

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          
        </div>
        
      </div>
      
      <nav className="tabs-container">
        <ul className="tabs-list">
          {tabs.map((tab) => (
            <li key={tab.name} className="tab-item">
              <a 
                href="#" 
                className={tab.active ? "tab-link active" : "tab-link"}
              >
                {tab.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="secondary-tabs">
        <a href="#" className="secondary-tab active">Receivables</a>
      </div>
    </header>
  );
}


// Sidebar Component
function Sidebar() {
  const menuItems = [
    { icon: "home", label: "Properties", active: false },
    { icon: "file-text", label: "Billing", active: false },
    { icon: "file-check", label: "Applications", active: false },
    { icon: "users", label: "Tenants/Units", active: false },
    { icon: "bar-chart", label: "Accounting", active: true },
    { icon: "settings", label: "Settings", active: false },
  ];

  // Simple SVG icon renderer based on icon name
  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'home':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      case 'file-text':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
      case 'file-check':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M9 15l2 2 4-4"></path>
          </svg>
        );
      case 'users':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'bar-chart':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        );
      case 'settings':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sidebar">
      <div className="logo-container">
        <h1 className="logo">narra</h1>
      </div>

      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item, index) => (
            <li key={index} className="sidebar-menu-item">
              <a
                href="#"
                className={item.active ? "sidebar-menu-link active" : "sidebar-menu-link"}
              >
                <span className="sidebar-icon">{renderIcon(item.icon)}</span>
                <span className="sidebar-label">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

// ReceivablesChart Component
function ReceivablesChart() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [chartData, setChartData] = useState(null);

  // Simulated API call to fetch data
  useEffect(() => {
    // This would normally be a fetch call to your API
    const fetchData = () => {
      // Dummy data
      const data = [
        { month: "Jan", outstandingReceivables: 3, tenantPayments: 6 },
        { month: "Feb", outstandingReceivables: 8, tenantPayments: 6 },
        { month: "Mar", outstandingReceivables: 14, tenantPayments: 16 },
        { month: "Apr", outstandingReceivables: 16, tenantPayments: 16 },
        { month: "May", outstandingReceivables: 16, tenantPayments: 18 },
        { month: "Jun", outstandingReceivables: 16, tenantPayments: 18 },
        { month: "Jul", outstandingReceivables: 16, tenantPayments: 18 },
        { month: "Aug", outstandingReceivables: 16, tenantPayments: 18 },
        { month: "Sep", outstandingReceivables: 16, tenantPayments: 18 },
        { month: "Oct", outstandingReceivables: 16, tenantPayments: 18 },
        { month: "Nov", outstandingReceivables: 16, tenantPayments: 18 },
        { month: "Dec", outstandingReceivables: 8, tenantPayments: 14 },
      ];
      
      setChartData(data);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (chartData && chartRef.current) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: chartData.map(item => item.month),
          datasets: [
            {
              label: 'Outstanding Receivables',
              data: chartData.map(item => item.outstandingReceivables),
              backgroundColor: '#3B82F6',
              borderRadius: 0,          // ← flat, square corners
              barPercentage: 0.8,
              categoryPercentage: 0.9,
            },
            {
              label: 'Tenant Payments',
              data: chartData.map(item => item.tenantPayments),
              backgroundColor: '#4B5563',
              borderRadius: 0,      // ← flat, square corners
              barPercentage: 0.8,
              categoryPercentage: 0.9,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              backgroundColor: 'white',
              titleColor: '#1F2937',
              bodyColor: '#4B5563',
              borderColor: '#E5E7EB',
              borderWidth: 1,
              padding: 12,
              boxPadding: 6,
              usePointStyle: true,
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              callbacks: {
                labelTextColor: (context) => {
                  return context.datasetIndex === 0 ? '#3B82F6' : '#4B5563';
                }
              }
            },
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                borderDash: [3, 3],
                drawBorder: false
              }
            }
          }
        }
      });
    }

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);

  return (
    <div className="chart-container">
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color blue"></div>
          <span className="legend-label">Outstanding Receivables</span>
        </div>
        <div className="legend-item">
          <div className="legend-color gray"></div>
          <span className="legend-label">Tenant Payments</span>
        </div>
      </div>
      <div className="chart-wrapper">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

// SummaryCard Component
function SummaryCard() {
  // You can replace this with a prop or state if needed
  const currentDate = new Date("May 12, 2025");
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="summary-card">
      <div className="summary-section">
        <h3 className="summary-title">Outstanding Receivables</h3>
        <div className="summary-divider"></div>
        <p className="summary-amount">₱200,890.00</p>
      </div>

      <div className="summary-section">
        <h3 className="summary-title">Year to Date Tenant Payments</h3>
        <div className="summary-divider"></div>
        <p className="summary-amount">₱2,000,890.00</p>
      </div>

      <div className="summary-date">
        <p>{formattedDate}</p>
      </div>
    </div>
  );
}

// Main ReceivablesPage Component
function ReceivablesPage() {
  const [company, setCompany] = useState("Company");
  const [year, setYear] = useState("2025");

  return (
    <div className="receivables-page">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <div className="page-content">
        {/* Filters */}
        <div className="filters">
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="filter-select"
          >
            <option>Company</option>
            <option>ABC Properties</option>
            <option>XYZ Holdings</option>
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="filter-select"
          >
            <option>2025</option>
            <option>2024</option>
            <option>2023</option>
          </select>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Chart */}
          <div className="chart-area">
            <ReceivablesChart />
          </div>

          {/* Summary Card */}
          <div className="summary-area">
            <SummaryCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceivablesPage;
