import React, { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, CreditCard, Calendar, Sun, ShoppingBag, Upload, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];
const CATEGORY_COLORS = {
    'Food & Drink': '#00C49F',
    'Shopping': '#0088FE',
    'Travel': '#FFBB28',
    'Entertainment': '#FF8042',
    'Health & Wellness': '#8884D8',
    'Other': '#82ca9d'
};

const SpendingDashboard: React.FC = () => {
    const [yearlySpending, setYearlySpending] = useState<Array<{ month: string, amount: number }>>([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{ name: string, value: number }>>([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [avgTransaction, setAvgTransaction] = useState(0);
    const [avgMonthlySpend, setAvgMonthlySpend] = useState(0);
    const [avgDailySpend, setAvgDailySpend] = useState(0);
    const [topMerchant, setTopMerchant] = useState({ name: '', amount: 0 });
    const [recurringPayments, setRecurringPayments] = useState<Array<{ description: string, amount: number, months: string }>>([]);

    const processTransactions = (transactions: any[]) => {
        const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        setTotalSpent(total);
        setAvgTransaction(total / transactions.length);
    
        const merchantTotals: {[key: string]: number} = {};
        const categoryTotals: {[key: string]: number} = {};
        const monthlySpending: {[key: string]: number} = {};
        const recurringCandidates: {[key: string]: {amount: number, months: Set<number>}} = {};
    
        let earliestDate = new Date(transactions[0].date);
        let latestDate = new Date(transactions[0].date);
    
        transactions.forEach(t => {
          // Update earliest and latest dates
          const transactionDate = new Date(t.date);
          if (transactionDate < earliestDate) earliestDate = transactionDate;
          if (transactionDate > latestDate) latestDate = transactionDate;
    
          // Merchant totals (only negative amounts)
          if (t.amount < 0) {
            merchantTotals[t.description] = (merchantTotals[t.description] || 0) + Math.abs(t.amount);
          }
    
          // Category totals
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
    
          // Monthly spending
          const month = transactionDate.toLocaleString('default', { month: 'short' });
          monthlySpending[month] = (monthlySpending[month] || 0) + Math.abs(t.amount);
    
          // Recurring payments (only negative amounts)
          if (t.amount < 0) {
            const key = `${t.description}-${Math.abs(t.amount).toFixed(2)}`;
            if (!recurringCandidates[key]) {
              recurringCandidates[key] = { amount: Math.abs(t.amount), months: new Set() };
            }
            recurringCandidates[key].months.add(transactionDate.getMonth());
          }
        });
    
        // Calculate average monthly and daily spend
        const daysDifference = (latestDate.getTime() - earliestDate.getTime()) / (1000 * 3600 * 24) + 1;
        const monthsDifference = (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 + 
                                 (latestDate.getMonth() - earliestDate.getMonth()) + 1;
        
        setAvgMonthlySpend(total / monthsDifference);
        setAvgDailySpend(total / daysDifference);
    
        // Set top merchant (largest sum of money spent)
        const topMerchantEntry = Object.entries(merchantTotals).reduce((a, b) => a[1] > b[1] ? a : b);
        setTopMerchant({ name: topMerchantEntry[0], amount: topMerchantEntry[1] });
    
        // Set category breakdown
        setCategoryBreakdown(Object.entries(categoryTotals).map(([name, value]) => ({ name, value })));
    
        // Set yearly spending
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        setYearlySpending(monthOrder.map(month => ({ month, amount: monthlySpending[month] || 0 })));
    
        // Set recurring payments
        const recurringThreshold = 3;
        const recurring = Object.entries(recurringCandidates)
          .filter(([_, data]) => data.months.size >= recurringThreshold)
          .map(([key, data]) => ({
            description: key.split('-')[0],
            amount: data.amount,
            months: Array.from(data.months).map(m => monthOrder[m]).join(', ')
          }));
        setRecurringPayments(recurring);
      };


    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          Papa.parse(file, {
            complete: (results) => {
              let headers: string[] = [];
              let transactions: any[] = [];
    
              if (Array.isArray(results.data) && results.data.length > 0) {
                if (Array.isArray(results.data[0])) {
                  // CSV doesn't have headers
                  headers = ['date', 'description', 'amount'];
                  transactions = results.data;
                } else {
                  // CSV has headers
                  headers = Object.keys(results.data[0]);
                  transactions = results.data;
                }
              }
    
              const processedTransactions = transactions.map((row: any) => {
                const transaction: any = {};
                headers.forEach((header, index) => {
                  const value = Array.isArray(row) ? row[index] : row[header];
                  if (header.toLowerCase().includes('date')) {
                    transaction.date = new Date(value);
                  } else if (header.toLowerCase().includes('amount')) {
                    transaction.amount = parseFloat(value);
                  } else if (header.toLowerCase().includes('description')) {
                    transaction.description = value;
                  } else if (header.toLowerCase().includes('category')) {
                    transaction.category = value;
                  }
                });
                return transaction;
              }).filter(t => !isNaN(t.amount) && t.amount !== 0 && t.date instanceof Date && !isNaN(t.date.getTime()));
    
              processTransactions(processedTransactions);
            },
            header: true,
            skipEmptyLines: true,
          });
        }
      }, []);

    const formatDollarAmount = (amount: number) => {
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Yearly Spending Dashboard</h1>

            <div className="mb-4">
                <label htmlFor="csv-upload" className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    <span>Upload Yearly CSV</span>
                </label>
                <input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-gray-600">Total Spent</h2>
                        <DollarSign className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                        {formatDollarAmount(totalSpent)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-gray-600">Avg. Monthly Spend</h2>
                        <Calendar className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-blue-600">
                        {formatDollarAmount(avgMonthlySpend)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-gray-600">Avg. Daily Spend</h2>
                        <Sun className="w-6 h-6 text-yellow-500" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">
                        {formatDollarAmount(avgDailySpend)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-gray-600">Top Merchant</h2>
                        <ShoppingBag className="w-6 h-6 text-purple-500" />
                    </div>
                    <p className="text-xl font-bold">{topMerchant.name}</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {formatDollarAmount(topMerchant.amount)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">Monthly Spending Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={yearlySpending}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatDollarAmount(value as number)} />
                            <Legend />
                            <Bar dataKey="amount" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryBreakdown}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {categoryBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatDollarAmount(value as number)} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Recurring Payments</h2>
                    <RefreshCw className="w-6 h-6 text-gray-500" />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Months Charged</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recurringPayments.map((payment, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDollarAmount(payment.amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.months}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SpendingDashboard;