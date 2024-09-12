import React, { useState, useCallback } from 'react';
import { XAxis, YAxis, AreaChart, Area, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar } from 'recharts';
import { Calendar, Sun, ShoppingBag, Upload, RefreshCw, TrendingUp, TrendingDown, DollarSign, ArrowUpDown, Plus, Sparkles, ChevronUp, ChevronDown, CreditCard, FileText, FileDown, Lock, Shield, Smartphone } from 'lucide-react';
import Papa from 'papaparse';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

const SpendingDashboard: React.FC = () => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [processedTransactions, setProcessedTransactions] = useState<Array<any>>([]);
    const [monthlySpending, setMonthlySpending] = useState<Array<{ date: string, amount: number }>>([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{ name: string, value: number }>>([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [avgMonthlySpend, setAvgMonthlySpend] = useState(0);
    const [avgDailySpend, setAvgDailySpend] = useState(0);
    const [topMerchant, setTopMerchant] = useState({ name: '', amount: 0 });
    const [recurringPayments, setRecurringPayments] = useState<Array<{ description: string, amount: number, months: string }>>([]);
    const [largestExpense, setLargestExpense] = useState({ description: '', amount: 0, date: '' });
    const [avgSpendingByDayOfWeek, setAvgSpendingByDayOfWeek] = useState<Array<{ day: string, amount: number }>>([]);
    const [monthOverMonthChange, setMonthOverMonthChange] = useState(0);
    const [yearOverYearChange, setYearOverYearChange] = useState(0);
    const [showYearOverYear, setShowYearOverYear] = useState(false);
    const [balanceTrend, setBalanceTrend] = useState<Array<{ date: string, balance: number }>>([]);

    const [csvUploaded, setCsvUploaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [aiInsights, setAiInsights] = useState<string | null>(null);
    const [isAIInsightsExpanded, setIsAIInsightsExpanded] = useState(true);
    const [hasCategoryData, setHasCategoryData] = useState(false);

    const processTransactions = (transactions: any[]) => {
        let totalSpent = 0;
        let totalIncome = 0;
        const merchantTotals: { [key: string]: number } = {};
        const categoryTotals: { [key: string]: number } = {};
        const monthlySpendingData: { [key: string]: number } = {};
        const recurringCandidates: { [key: string]: { amount: number, months: number[] } } = {};
        const dayOfWeekSpending: { [key: string]: { total: number, count: number } } = {
            'Sun': { total: 0, count: 0 }, 'Mon': { total: 0, count: 0 }, 'Tue': { total: 0, count: 0 },
            'Wed': { total: 0, count: 0 }, 'Thu': { total: 0, count: 0 }, 'Fri': { total: 0, count: 0 },
            'Sat': { total: 0, count: 0 }
        };
        const monthlyTotals: { [key: string]: number } = {};
        const yearlyTotals: { [key: string]: number } = {};
        let largestExp = { description: '', amount: 0, date: '' };

        let earliestDate = new Date(transactions[0].date);
        let latestDate = new Date(transactions[0].date);

        transactions.forEach(t => {
            const transactionDate = new Date(t.date);
            if (transactionDate < earliestDate) earliestDate = transactionDate;
            if (transactionDate > latestDate) latestDate = transactionDate;

            const amount = Math.abs(t.amount);

            const monthYear = transactionDate.toLocaleString('default', { month: 'short', year: 'numeric' });
            if (t.amount < 0) {
                // Spending
                totalSpent += amount;
                merchantTotals[t.description] = (merchantTotals[t.description] || 0) + amount;
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;

                const monthYearKey = transactionDate.toISOString().slice(0, 7); // YYYY-MM format
                monthlySpendingData[monthYearKey] = (monthlySpendingData[monthYearKey] || 0) + amount;

                const key = `${t.description}-${amount.toFixed(2)}`;
                if (!recurringCandidates[key]) {
                    recurringCandidates[key] = { amount, months: [] };
                }
                const monthIndex = transactionDate.getMonth();
                if (!recurringCandidates[key].months.includes(monthIndex)) {
                    recurringCandidates[key].months.unshift(monthIndex);
                }

                // Largest expense
                if (amount > largestExp.amount) {
                    largestExp = { description: t.description, amount: amount, date: t.date };
                }

                // Day of week spending
                const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][transactionDate.getUTCDay()];
                dayOfWeekSpending[dayOfWeek].total += amount;
                dayOfWeekSpending[dayOfWeek].count += 1;

                // Monthly and yearly totals for change calculations
                const year = transactionDate.toISOString().substring(0, 4);
                monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + amount;
                yearlyTotals[year] = (yearlyTotals[year] || 0) + amount;
            } else {
                // Income
                totalIncome += amount;
            }
        });

        setTotalSpent(totalSpent);
        setTotalIncome(totalIncome);
        setStartDate(earliestDate);
        setEndDate(latestDate);

        setLargestExpense(largestExp);

        // Calculate average spending by day of week
        const avgSpending = Object.entries(dayOfWeekSpending).map(([day, data]) => ({
            day,
            amount: data.count > 0 ? data.total / data.count : 0
        }));
        setAvgSpendingByDayOfWeek(avgSpending);

        // Calculate month-over-month change
        const sortedMonths = Object.keys(monthlyTotals).sort();
        if (sortedMonths.length >= 2) {
            const currentMonth = monthlyTotals[sortedMonths[sortedMonths.length - 1]];
            const previousMonth = monthlyTotals[sortedMonths[sortedMonths.length - 2]];
            setMonthOverMonthChange(((currentMonth - previousMonth) / previousMonth) * 100);
        }

        // Calculate year-over-year change
        const sortedYears = Object.keys(yearlyTotals).sort();
        if (sortedYears.length >= 2) {
            const currentYear = yearlyTotals[sortedYears[sortedYears.length - 1]];
            const previousYear = yearlyTotals[sortedYears[sortedYears.length - 2]];
            setYearOverYearChange(((currentYear - previousYear) / previousYear) * 100);
        }

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

        const sortedMonthlySpending = Object.entries(monthlySpendingData)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, amount]) => ({ date, amount }));

        setMonthlySpending(sortedMonthlySpending);


        const recurringThreshold = 3;
        const recurring = Object.entries(recurringCandidates)
            .filter(([_, data]) => data.months.length >= recurringThreshold)
            .map(([key, data]) => ({
                description: key.split('-')[0],
                amount: data.amount,
                months: data.months
                    .sort((a, b) => a - b)
                    .map(m => new Date(0, m).toLocaleString('default', { month: 'short' }))
                    .join(', ')
            }))
            .sort((a, b) => b.amount - a.amount);
        setRecurringPayments(recurring);


        let runningBalance = 0;
        const balanceTrendData = transactions
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(t => {
                runningBalance += t.amount;
                return {
                    date: t.date,
                    balance: runningBalance
                };
            });
        setBalanceTrend(balanceTrendData);

    };

    const toggleChangeMetric = () => {
        setShowYearOverYear(!showYearOverYear);
    };
    const toggleAIInsights = () => {
        setIsAIInsightsExpanded(!isAIInsightsExpanded);
    };



    const detectCSVType = (headers: string[]): 'AMEX' | 'Chase' | 'Capital One' | 'Unknown' => {
        const headerSet = new Set(headers);

        if (headerSet.has('Date') && headerSet.has('Description') && headerSet.has('Amount')) {
            return 'AMEX';
        }

        if (headerSet.has('Transaction Date') && headerSet.has('Description') && headerSet.has('Amount') && headerSet.has('Category')) {
            return 'Chase';
        }

        if (headerSet.has('Account Number') && headerSet.has('Transaction Description') && headerSet.has('Transaction Date') && headerSet.has('Transaction Amount') && headerSet.has('Balance')) {
            return 'Capital One';
        }

        return 'Unknown';
    };

    const processCSVRow = (row: any, csvType: 'AMEX' | 'Chase' | 'Capital One' | 'Unknown'): {
        date: string;
        description: string;
        category: string;
        amount: number;
    } | null => {
        let date, description, category, amount;

        switch (csvType) {
            case 'AMEX':
                date = new Date(row['Date']);
                description = row['Description'];
                category = ''; // AMEX doesn't provide category
                amount = -parseFloat(row['Amount']); // Negate amount as AMEX considers spending as positive
                break;
            case 'Chase':
                date = new Date(row['Transaction Date']);
                description = row['Description'];
                category = row['Category'] || '';
                amount = parseFloat(row['Amount']);
                break;
            case 'Capital One':
                date = new Date(row['Transaction Date']);
                description = row['Transaction Description'];
                category = ''; // Capital One doesn't provide category in this format
                amount = parseFloat(row['Transaction Amount']);
                // If it's a debit, make the amount negative
                if (row['Transaction Type'] === 'Debit') {
                    amount = -amount;
                }
                break;
            default:
                return null;
        }

        const formattedDate = date.toISOString().split('T')[0];

        return {
            date: formattedDate,
            description,
            category,
            amount,
        };
    };


    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                complete: (results) => {
                    if (Array.isArray(results.data) && results.data.length > 0) {
                        const headers = Object.keys(results.data[0]);
                        const detectedType = detectCSVType(headers);

                        if (detectedType === 'Unknown') {
                            console.error('Unknown CSV format');
                            // You might want to show an error message to the user here
                            return;
                        }

                        const processedTransactions = results.data
                            .slice(1) // Skip header row
                            .map(row => processCSVRow(row, detectedType))
                            .filter((t): t is NonNullable<ReturnType<typeof processCSVRow>> =>
                                t !== null && !isNaN(t.amount) && t.amount !== 0 && !!t.date
                            );

                        console.log('Processed transactions:', processedTransactions);

                        // Check if any transaction has category data
                        const categoryDataExists = processedTransactions.some(t => t.category !== '');
                        setHasCategoryData(categoryDataExists);
                        setProcessedTransactions(processedTransactions);
                        processTransactions(processedTransactions);
                        setCsvUploaded(true);
                    }
                },
                header: true,
                skipEmptyLines: true,
            });
        }
    }, []);

    const formatDollarAmount = (amount: number) => {
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };


    const handleAIInsightsClick = async () => {
        setIsLoading(true);
        setAiInsights(null);
        console.log("Generating Insights from 4o")
        try {
            const response = await fetch('https://visuaicalls.azurewebsites.net/api/financialAnalyze?code=J9r5P9CUUcEm8JMARGizL1ynH84mwNkTxAU79Vv8nNVXAzFu7Xunhg%3D%3D', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transactions: processedTransactions }),
            });

            if (!response.ok) {
                throw new Error('API call failed');
            }

            const data = await response.json();
            console.log('AI Insights Response:', data);
            setAiInsights(data.response);
        } catch (error) {
            console.error('Error fetching AI insights:', error);
            setAiInsights('Error fetching AI insights. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };


    const renderAIInsights = (insights: string) => {
        const insightsList = insights.split('\n\n').filter(insight => insight.trim() !== '');
        return (
            <ol className="list-none space-y-4 text-base text-gray-800">
                {insightsList.map((insight, index) => {
                    const [title, ...contentParts] = insight.split(':');
                    const content = contentParts.join(':').trim();
                    const [mainContent, recommendation] = content.split('**Recommendation**:');

                    return (
                        <li key={index} className="bg-white bg-opacity-40 rounded p-4">
                            <div className="flex items-start mb-2">
                                <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </span>
                                <h4 className="ml-3 text-base font-semibold text-indigo-700">
                                    {title.replace(/^\d+\.\s*/, '').replace(/\*/g, '').trim()}
                                </h4>
                            </div>
                            <p className="text-sm text-gray-600 ml-9 mb-2">{mainContent.trim()}</p>
                            {recommendation && (
                                <div className="bg-indigo-50 rounded p-3 ml-9 mt-2">
                                    <p className="text-sm font-medium text-indigo-800">Recommendation:</p>
                                    <p className="text-sm italic text-indigo-600">{recommendation.trim()}</p>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        );
    };

    return (
        <div className="min-h-screen p-6 bg-gradient-to-br from-blue-100 via-orange-100 to-blue-200">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold text-indigo-800 flex items-center">
                            Spending Dashboard
                            <img src="assets/icon.png" alt="" className="w-10 h-10 ml-2" />
                        </h1>
                        <label htmlFor="csv-upload" className="cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg inline-flex items-center transition duration-200">
                            <Upload className="w-5 h-5 mr-2" />
                            <span>Upload CSV</span>
                        </label>
                        <input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </div>
                    {startDate && endDate && (
                        <div className="text-sm text-gray-600 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                            <span>
                                From {startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to {endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                    )}
                </div>
                {csvUploaded ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
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
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-lg font-semibold text-gray-600">Largest Transaction</h2>
                                    <DollarSign className="w-6 h-6 text-orange-500" />
                                </div>
                                <p className="text-xl font-bold text-black-600">{largestExpense.description}</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {formatDollarAmount(largestExpense.amount)}
                                </p>
                                <p className="text-sm text-gray-500">{new Date(largestExpense.date).toLocaleDateString()}</p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md relative">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-lg font-semibold text-gray-600">
                                        {showYearOverYear ? 'Year-over-Year Change' : 'Month-over-Month Change'}
                                    </h2>
                                    <ArrowUpDown className="w-6 h-6 text-indigo-500" />
                                </div>
                                <p className={`text-3xl font-bold ${(showYearOverYear ? yearOverYearChange : monthOverMonthChange) >= 0
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                    }`}>
                                    {(showYearOverYear ? yearOverYearChange : monthOverMonthChange).toFixed(2)}%
                                </p>
                                <button
                                    onClick={toggleChangeMetric}
                                    className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                >
                                    {showYearOverYear ? 'MoM' : 'YoY'}
                                </button>
                            </div>
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
                        </div>


                        {/* Updated AI Insights section */}
                        <div className="mb-6">
                            <div className="w-full bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm p-4 rounded-xl transition duration-300 ease-in-out">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-xl font-bold text-indigo-700">AI Insights</h3>
                                        <Sparkles className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    <button
                                        onClick={toggleAIInsights}
                                        className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                                    >
                                        {isAIInsightsExpanded ? (
                                            <ChevronUp className="w-6 h-6" />
                                        ) : (
                                            <ChevronDown className="w-6 h-6" />
                                        )}
                                    </button>
                                </div>
                                {isAIInsightsExpanded && (
                                    <>
                                        {!aiInsights ? (
                                            <button
                                                onClick={handleAIInsightsClick}
                                                disabled={isLoading}
                                                className="w-full flex flex-col items-center justify-center space-y-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <div className="bg-indigo-100 bg-opacity-50 p-2 rounded-full">
                                                    {isLoading ? (
                                                        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                                                    ) : (
                                                        <Plus className="w-8 h-8 text-indigo-500" />
                                                    )}
                                                </div>
                                                <p className="text-base font-semibold text-indigo-600 animate-pulse">
                                                    {isLoading ? 'Generating AI insights...' : 'Click to see AI insights'}
                                                </p>
                                            </button>
                                        ) : (
                                            renderAIInsights(aiInsights)
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <div className="bg-white p-4 rounded shadow">
                                <h2 className="text-lg font-semibold mb-4">Monthly Spending Trend</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={monthlySpending}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(tick) => {
                                                const [year, month] = tick.split('-');
                                                // Create a date object for the first day of the month
                                                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                                                // console.log('Tick:', tick, 'Formatted:', date.toLocaleString('default', { month: 'short', year: '2-digit' }));
                                                return date.toLocaleString('default', { month: 'short', year: '2-digit' });
                                            }}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value) => formatDollarAmount(value as number)}
                                            labelFormatter={(label) => {
                                                const [year, month] = label.split('-');
                                                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                                                // console.log('Label:', label, 'Formatted:', date.toLocaleString('default', { month: 'long', year: 'numeric' }));
                                                return date.toLocaleString('default', { month: 'long', year: 'numeric' });
                                            }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white p-4 rounded shadow">
                                <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
                                {hasCategoryData ? (
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
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                                        Category data not available in CSV
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-4 rounded shadow">
                                <h2 className="text-lg font-semibold mb-4">Avg Spending by Day of Week</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={avgSpendingByDayOfWeek}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatDollarAmount(value as number)} />
                                        <Legend />
                                        <Bar dataKey="amount" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-1 gap-8 mb-8">
                                <div className="bg-white p-4 rounded shadow">
                                    <h2 className="text-lg font-semibold mb-4">Balance Trend Over Time</h2>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={balanceTrend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(tick) => new Date(tick).toLocaleDateString('default', { month: 'short', year: '2-digit' })}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value) => formatDollarAmount(value as number)}
                                                labelFormatter={(label) => new Date(label).toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            />
                                            <Legend />
                                            <Area type="monotone" dataKey="balance" stroke="#8884d8" fill="#8884d8" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Recurring Monthly Payments</h2>
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
                    </>
                ) : (
                    <div className="bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm shadow-lg rounded-xl overflow-hidden mt-8">
                        <div className="bg-indigo-600 bg-opacity-70 text-white p-6 backdrop-filter backdrop-blur-md">
                            <h2 className="text-2xl font-bold mb-2">Upload Your Transaction Summary</h2>
                            <p className="text-indigo-100">
                                Please upload a transaction summary CSV from your bank to view the spending dashboard.
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="mb-6 bg-green-100 bg-opacity-70 rounded-lg p-4 backdrop-filter backdrop-blur-sm">
                                <h4 className="text-lg font-semibold mb-2 flex items-center text-green-800">
                                    <Shield className="w-6 h-6 mr-2 text-green-700" />
                                    Your Privacy is Protected
                                </h4>
                                <ul className="space-y-2">
                                    <li className="flex items-center">
                                        <Lock className="w-5 h-5 mr-2 text-green-700" />
                                        <span className="text-green-800">Your data remains entirely private and secure</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Smartphone className="w-5 h-5 mr-2 text-green-700" />
                                        <span className="text-green-800">All processing happens on your device only</span>
                                    </li>
                                    <li className="flex items-center">
                                        <FileText className="w-5 h-5 mr-2 text-green-700" />
                                        <span className="text-green-800">No data is stored or transmitted elsewhere</span>
                                    </li>
                                </ul>
                            </div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">To download a transaction summary:</h3>
                            <ol className="space-y-4">
                                {[
                                    { icon: <CreditCard className="w-6 h-6" />, text: "Log into your online banking" },
                                    { icon: <FileText className="w-6 h-6" />, text: "Select the account you want to download a CSV for" },
                                    { icon: <FileText className="w-6 h-6" />, text: 'Find a "view statements" or "view transaction history" or similar tab and click on it' },
                                    { icon: <Calendar className="w-6 h-6" />, text: "Insert the date range we have asked you for" },
                                    { icon: <FileText className="w-6 h-6" />, text: 'Make sure you select the CSV option as the "Output" or "Format"' },
                                    { icon: <FileDown className="w-6 h-6" />, text: 'Click "Export", "Save" or "Download" and the file will be saved to wherever your computer usually saves files' },
                                    { icon: <Upload className="w-6 h-6" />, text: "Upload here" }
                                ].map((step, index) => (
                                    <li key={index} className="flex items-start">
                                        <div className="flex-shrink-0 bg-indigo-100 bg-opacity-50 rounded-full p-2 mr-4">
                                            {step.icon}
                                        </div>
                                        <p className="text-gray-800">{step.text}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpendingDashboard;