import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProfitLoss.css';

const ProfitLoss = () => {
  // State for dropdown values
  const [selectedCompany, setSelectedCompany] = useState('ABC Property Management');
  const [selectedYear, setSelectedYear] = useState('2025');
  
  // State for profit and loss data
  const [profitLossData, setProfitLossData] = useState({
    income: {
      rent: Array(12).fill(0).map((_, i) => 125000 + (i * 5000)),
      utilities: Array(12).fill(0).map((_, i) => 35000 + (i * 1000)),
      other: Array(12).fill(0).map((_, i) => 15000 + (Math.random() * 5000))
    },
    expenses: {
      payroll: Array(12).fill(0).map((_, i) => 45000 + (i * 1000)),
      repairs: Array(12).fill(0).map((_, i) => 15000 + (Math.random() * 3000)),
      supplies: Array(12).fill(0).map((_, i) => 8000 + (Math.random() * 2000)),
      other: Array(12).fill(0).map((_, i) => 12000 + (Math.random() * 4000))
    },
    taxes: {
      vat: Array(12).fill(0).map((_, i) => 18000 + (i * 500)),
      ewt: Array(12).fill(0).map((_, i) => 9000 + (i * 300)),
    }
  });

  // Calculated totals
  const [calculatedData, setCalculatedData] = useState({
    revenue: Array(12).fill(0),
    operatingExpenses: Array(12).fill(0),
    operatingIncome: Array(12).fill(0),
    taxExpense: Array(12).fill(0),
    netIncome: Array(12).fill(0),
    cumulative: {
      rent: 0,
      utilities: 0,
      otherIncome: 0,
      revenue: 0,
      payroll: 0,
      repairs: 0,
      supplies: 0,
      otherExpenses: 0,
      operatingExpenses: 0,
      operatingIncome: 0,
      vat: 0,
      ewt: 0,
      taxExpense: 0,
      netIncome: 0
    }
  });

  // Calculate derived values
  useEffect(() => {
    const revenue = profitLossData.income.rent.map((rent, i) => 
      rent + profitLossData.income.utilities[i] + profitLossData.income.other[i]
    );
    
    const operatingExpenses = profitLossData.expenses.payroll.map((payroll, i) => 
      payroll + profitLossData.expenses.repairs[i] + profitLossData.expenses.supplies[i] + profitLossData.expenses.other[i]
    );
    
    const operatingIncome = revenue.map((rev, i) => rev - operatingExpenses[i]);
    
    const taxExpense = profitLossData.taxes.vat.map((vat, i) => vat + profitLossData.taxes.ewt[i]);
    
    const netIncome = operatingIncome.map((income, i) => income - taxExpense[i]);
    
    // Calculate cumulative values
    const cumulative = {
      rent: profitLossData.income.rent.reduce((sum, val) => sum + val, 0),
      utilities: profitLossData.income.utilities.reduce((sum, val) => sum + val, 0),
      otherIncome: profitLossData.income.other.reduce((sum, val) => sum + val, 0),
      revenue: revenue.reduce((sum, val) => sum + val, 0),
      payroll: profitLossData.expenses.payroll.reduce((sum, val) => sum + val, 0),
      repairs: profitLossData.expenses.repairs.reduce((sum, val) => sum + val, 0),
      supplies: profitLossData.expenses.supplies.reduce((sum, val) => sum + val, 0),
      otherExpenses: profitLossData.expenses.other.reduce((sum, val) => sum + val, 0),
      operatingExpenses: operatingExpenses.reduce((sum, val) => sum + val, 0),
      operatingIncome: operatingIncome.reduce((sum, val) => sum + val, 0),
      vat: profitLossData.taxes.vat.reduce((sum, val) => sum + val, 0),
      ewt: profitLossData.taxes.ewt.reduce((sum, val) => sum + val, 0),
      taxExpense: taxExpense.reduce((sum, val) => sum + val, 0),
      netIncome: netIncome.reduce((sum, val) => sum + val, 0)
    };
    
    setCalculatedData({
      revenue,
      operatingExpenses,
      operatingIncome,
      taxExpense,
      netIncome,
      cumulative
    });
  }, [profitLossData]);

  // Fetch data from API (simulated)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // This would be replaced with a real API call
        // const response = await axios.get(`/api/profit-loss?year=${selectedYear}&company=${selectedCompany}`);
        // setProfitLossData(response.data);
        
        // Simulating API delay
        setTimeout(() => {
          console.log('Data fetched for', selectedCompany, selectedYear);
        }, 500);
      } catch (error) {
        console.error('Error fetching profit and loss data:', error);
      }
    };
    
    fetchData();
  }, [selectedCompany, selectedYear]);

  // Handle download statement
  const handleDownloadStatement = async () => {
    try {
      // In a real implementation, this would call an API endpoint
      // that returns a CSV file
      // const response = await axios.get(`/api/profit-loss/download?year=${selectedYear}&company=${selectedCompany}`, {
      //   responseType: 'blob'
      // });
      
      // For demo purposes, we'll create the CSV manually
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      let csvContent = 'Category,' + months.join(',') + ',Cumulative\n';
      
      // Add income rows
      csvContent += `Rent Income,${profitLossData.income.rent.join(',')},${calculatedData.cumulative.rent}\n`;
      csvContent += `Utilities Income,${profitLossData.income.utilities.join(',')},${calculatedData.cumulative.utilities}\n`;
      csvContent += `Other,${profitLossData.income.other.join(',')},${calculatedData.cumulative.otherIncome}\n`;
      csvContent += `Revenue,${calculatedData.revenue.join(',')},${calculatedData.cumulative.revenue}\n`;
      
      // Add expense rows
      csvContent += `Payroll,${profitLossData.expenses.payroll.join(',')},${calculatedData.cumulative.payroll}\n`;
      csvContent += `Repairs,${profitLossData.expenses.repairs.join(',')},${calculatedData.cumulative.repairs}\n`;
      csvContent += `Supplies,${profitLossData.expenses.supplies.join(',')},${calculatedData.cumulative.supplies}\n`;
      csvContent += `Other,${profitLossData.expenses.other.join(',')},${calculatedData.cumulative.otherExpenses}\n`;
      csvContent += `Operating Expenses,${calculatedData.operatingExpenses.join(',')},${calculatedData.cumulative.operatingExpenses}\n`;
      csvContent += `Operating Income,${calculatedData.operatingIncome.join(',')},${calculatedData.cumulative.operatingIncome}\n`;
      
      // Add tax rows
      csvContent += `VAT Tax,${profitLossData.taxes.vat.join(',')},${calculatedData.cumulative.vat}\n`;
      csvContent += `EWT Tax,${profitLossData.taxes.ewt.join(',')},${calculatedData.cumulative.ewt}\n`;
      csvContent += `Tax Expense,${calculatedData.taxExpense.join(',')},${calculatedData.cumulative.taxExpense}\n`;
      csvContent += `Net Income,${calculatedData.netIncome.join(',')},${calculatedData.cumulative.netIncome}\n`;
      
      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedCompany}_ProfitLoss_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Statement downloaded');
    } catch (error) {
      console.error('Error downloading statement:', error);
    }
  };

  // Format number as currency
  const formatCurrency = (value) => {
    return '₱' + value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Months array for table headers
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="profit-loss-container">
      <div className="navigation-bar">
          {/* Row 1: your tabs */}
        <div className="nav-tabs">
          <div className="nav-tab">Receivables</div>
          <div className="nav-tab">Expense Tracking</div>
          <div className="nav-tab active">Profit and Loss</div>
          <div className="nav-tab">Filings</div>
        </div>
        </div>
       
    <div className="controls-container">
        <div className="dropdown-controls">
          <div className="dropdown">
            <select 
              value={selectedCompany} 
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="dropdown-select"
            >
              <option value="ABC Property Management"> ABC Property Management</option>
              <option value="XYZ Properties"> XYZ Properties</option>
              <option value="123 Real Estate"> 123 Real Estate</option>
            </select>
          </div>
          
          <div className="dropdown">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="dropdown-select"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>
        
        <button 
          className="download-button"
          onClick={handleDownloadStatement}
        >
          Download Statement
        </button>
      </div>
        {/* end Row 2 */}
        

      <div className="table-container">
        <table className="profit-loss-table">
          <thead>
            <tr>
              <th className="category-header">Category</th>
              {months.map((month) => (
                <th key={month}>{month}</th>
              ))}
              <th>Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {/* Income Section */}
            <tr>
              <td className="row-header">Rent Income</td>
              {profitLossData.income.rent.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.rent)}</td>
            </tr>
            <tr>
              <td className="row-header">Utilities Income</td>
              {profitLossData.income.utilities.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.utilities)}</td>
            </tr>
            <tr>
              <td className="row-header">Other</td>
              {profitLossData.income.other.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.otherIncome)}</td>
            </tr>
            <tr className="total-row">
              <td className="row-header">Revenue</td>
              {calculatedData.revenue.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.revenue)}</td>
            </tr>
            
            {/* Expenses Section */}
            <tr>
              <td className="row-header">Payroll</td>
              {profitLossData.expenses.payroll.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.payroll)}</td>
            </tr>
            <tr>
              <td className="row-header">Repairs</td>
              {profitLossData.expenses.repairs.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.repairs)}</td>
            </tr>
            <tr>
              <td className="row-header">Supplies</td>
              {profitLossData.expenses.supplies.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.supplies)}</td>
            </tr>
            <tr>
              <td className="row-header">Other</td>
              {profitLossData.expenses.other.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.otherExpenses)}</td>
            </tr>
            <tr className="subtotal-row">
              <td className="row-header">Operating Expenses</td>
              {calculatedData.operatingExpenses.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.operatingExpenses)}</td>
            </tr>
            <tr className="total-row">
              <td className="row-header">Operating Income</td>
              {calculatedData.operatingIncome.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.operatingIncome)}</td>
            </tr>
            
            {/* Tax Section */}
            <tr>
              <td className="row-header">VAT Tax</td>
              {profitLossData.taxes.vat.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.vat)}</td>
            </tr>
            <tr>
              <td className="row-header">EWT Tax</td>
              {profitLossData.taxes.ewt.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.ewt)}</td>
            </tr>
            <tr className="subtotal-row">
              <td className="row-header">Tax Expense</td>
              {calculatedData.taxExpense.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.taxExpense)}</td>
            </tr>
            <tr className="final-row">
              <td className="row-header">Net Income</td>
              {calculatedData.netIncome.map((value, index) => (
                <td key={index}>{formatCurrency(value)}</td>
              ))}
              <td className="cumulative">{formatCurrency(calculatedData.cumulative.netIncome)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitLoss;