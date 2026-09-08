import React, { useState, useEffect } from 'react';
import './ProfitLoss.css';

const COMPANIES = ['ABC Property Management', 'XYZ Properties', '123 Real Estate'];
const YEARS = ['2024', '2025', '2026'];

// A small deterministic hash so each company/year pair gets its own believable
// figures without a data source, and without changing between renders.
function seedFor(company, year) {
  const text = `${company}|${year}`;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  return hash;
}

// Rental income is seasonal: occupancy and utility recovery peak over the
// Philippine dry season, so the curve leans on the middle of the year rather
// than rising in a straight line.
const SEASONAL = [0.94, 0.96, 1.02, 1.08, 1.12, 1.09, 1.04, 1.03, 1.0, 0.98, 0.97, 1.05];

function series(base, seed, offset, variance = 0.06) {
  return Array.from({ length: 12 }, (_, month) => {
    const wobble = Math.sin(seed + offset + month * 1.7) * variance;
    const value = base * SEASONAL[month] * (1 + wobble);
    return Math.round(value / 100) * 100;
  });
}

function buildStatement(company, year) {
  const seed = seedFor(company, year);
  // Later years carry a modest portfolio growth rate.
  const growth = 1 + (Number(year) - 2024) * 0.07;
  const scale = (0.85 + ((seed % 40) / 100)) * growth;

  return {
    income: {
      rent: series(132000 * scale, seed, 0),
      utilities: series(38000 * scale, seed, 1.1),
      other: series(16500 * scale, seed, 2.3, 0.12),
    },
    expenses: {
      payroll: series(46000 * scale, seed, 3.1, 0.03),
      repairs: series(17500 * scale, seed, 4.7, 0.22),
      supplies: series(8800 * scale, seed, 5.9, 0.15),
      other: series(12500 * scale, seed, 6.4, 0.18),
    },
    taxes: {
      vat: series(19000 * scale, seed, 7.2, 0.05),
      ewt: series(9500 * scale, seed, 8.6, 0.05),
    },
  };
}

const ProfitLoss = () => {
  // State for dropdown values
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0]);
  const [selectedYear, setSelectedYear] = useState('2026');

  // Sample figures, not live data. Derived deterministically from the company
  // and year so the statement is stable across renders and so switching either
  // dropdown visibly changes the numbers. The previous version used
  // Math.random(), which produced different figures on every render -- fine as
  // a stub, but it made the statement impossible to read or verify.
  const [profitLossData, setProfitLossData] = useState(() =>
    buildStatement(COMPANIES[0], '2026')
  );

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
  // Swap in the sample statement for whichever company/year is selected.
  // When a real endpoint exists this becomes:
  //   const { data } = await axios.get(
  //     `${process.env.REACT_APP_API_URL}/api/profit-loss?year=${selectedYear}&company=${selectedCompany}`
  //   );
  //   setProfitLossData(data);
  useEffect(() => {
    setProfitLossData(buildStatement(selectedCompany, selectedYear));
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

      <div className="sample-data-notice">
        <span className="sample-data-badge">Sample data</span>
        <span>
          These figures are illustrative, not drawn from your properties. The
          statement, totals and CSV export are fully working; only the data
          source is pending.
        </span>
      </div>
       
    <div className="controls-container">
        <div className="dropdown-controls">
          <div className="dropdown">
            <select 
              value={selectedCompany} 
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="dropdown-select"
            >
              {COMPANIES.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
          
          <div className="dropdown">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="dropdown-select"
            >
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
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