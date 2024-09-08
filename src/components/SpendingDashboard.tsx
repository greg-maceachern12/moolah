import React, { useState, useCallback } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, Sun, ShoppingBag, Upload, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import Papa from 'papaparse';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

const DateRangeDisplay: React.FC<{ startDate: Date | null; endDate: Date | null }> = ({ startDate, endDate }) => {
    if (!startDate || !endDate) return null;

    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="p-4">
            {/* <h2 className="text-lg font-semibold mb-2">Transaction Date Range</h2> */}
            <p className="text-gray-600">
                From {formatDate(startDate)} to {formatDate(endDate)}
            </p>
        </div>
    );
};

const SpendingDashboard: React.FC = () => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [yearlySpending, setYearlySpending] = useState<Array<{ month: string, amount: number }>>([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{ name: string, value: number }>>([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [avgMonthlySpend, setAvgMonthlySpend] = useState(0);
    const [avgDailySpend, setAvgDailySpend] = useState(0);
    const [topMerchant, setTopMerchant] = useState({ name: '', amount: 0 });
    const [recurringPayments, setRecurringPayments] = useState<Array<{ description: string, amount: number, months: string }>>([]);

    const processTransactions = (transactions: any[]) => {
        let totalSpent = 0;
        let totalIncome = 0;
        const merchantTotals: { [key: string]: number } = {};
        const categoryTotals: { [key: string]: number } = {};
        const monthlySpending: { [key: string]: number } = {};
        const recurringCandidates: { [key: string]: { amount: number, months: number[] } } = {};
    
        let earliestDate = new Date(transactions[0].date);
        let latestDate = new Date(transactions[0].date);
    
        transactions.forEach(t => {
            const transactionDate = new Date(t.date);
            if (transactionDate < earliestDate) earliestDate = transactionDate;
            if (transactionDate > latestDate) latestDate = transactionDate;
    
            const amount = Math.abs(t.amount);
            if (t.amount < 0) {
                // Spending
                totalSpent += amount;
                merchantTotals[t.description] = (merchantTotals[t.description] || 0) + amount;
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
    
                const month = transactionDate.toLocaleString('default', { month: 'short' });
                monthlySpending[month] = (monthlySpending[month] || 0) + amount;
    
                const key = `${t.description}-${amount.toFixed(2)}`;
                if (!recurringCandidates[key]) {
                    recurringCandidates[key] = { amount, months: [] };
                }
                const monthIndex = transactionDate.getMonth();
                if (!recurringCandidates[key].months.includes(monthIndex)) {
                    recurringCandidates[key].months.unshift(monthIndex);
                }
            } else {
                // Income
                totalIncome += amount;
            }
        });
    
        setTotalSpent(totalSpent);
        setTotalIncome(totalIncome);
        setStartDate(earliestDate);
        setEndDate(latestDate);
    
        const daysDifference = (latestDate.getTime() - earliestDate.getTime()) / (1000 * 3600 * 24) + 1;
        const monthsDifference = (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 +
            (latestDate.getMonth() - earliestDate.getMonth()) + 1;
    
        setAvgMonthlySpend(totalSpent / monthsDifference);
        setAvgDailySpend(totalSpent / daysDifference);
    
        const topMerchantEntry = Object.entries(merchantTotals).reduce((a, b) => a[1] > b[1] ? a : b);
        setTopMerchant({ name: topMerchantEntry[0], amount: topMerchantEntry[1] });
    
        const sortedCategories = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1]);
        
        const top5Categories = sortedCategories.slice(0, 5);
        const otherCategories = sortedCategories.slice(5);
        
        const otherTotal = otherCategories.reduce((sum, [_, value]) => sum + value, 0);
        
        const categoryBreakdownData = [
            ...top5Categories.map(([name, value]) => ({ name, value })),
            { name: 'Other', value: otherTotal }
        ];
        setCategoryBreakdown(categoryBreakdownData);
    
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        setYearlySpending(monthOrder.map(month => ({ month, amount: monthlySpending[month] || 0 })));
    
        const recurringThreshold = 3;
        const recurring = Object.entries(recurringCandidates)
            .filter(([_, data]) => data.months.length >= recurringThreshold)
            .map(([key, data]) => ({
                description: key.split('-')[0],
                amount: data.amount,
                months: data.months
                    .sort((a, b) => a - b)
                    .map(m => monthOrder[m])
                    .join(', ')
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
                            headers = ['date', 'description', 'amount'];
                            transactions = results.data;
                        } else {
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
            <div className="flex items-center mb-4">
                <img src="../assets/icon.png" alt="Dashboard icon" className="w-8 h-8 mr-2" />
                <h1 className="text-2xl font-bold">Spending Dashboard</h1>
            </div>

            <div className="mb-4">
                <label htmlFor="csv-upload" className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    <span>Upload CSV</span>
                </label>
                <input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </div>
            <DateRangeDisplay startDate={startDate} endDate={endDate} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-gray-600">Total Spent</h2>
                        <TrendingDown className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-red-600">
                        {formatDollarAmount(totalSpent)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-gray-600">Total Income</h2>
                        <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                        {formatDollarAmount(totalIncome)}
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
                    <p className="text-xl font-bold text-black-600">{topMerchant.name}</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {formatDollarAmount(topMerchant.amount)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">Monthly Spending Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={yearlySpending}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatDollarAmount(value as number)} />
                            <Legend />
                            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                        </LineChart>
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
                                outerRadius={100}
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