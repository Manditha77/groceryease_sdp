import React, { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem, Button, Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import reportService from '../services/reportService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

const Reports = () => {
    const [reportType, setReportType] = useState("inventory");
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [timePeriod, setTimePeriod] = useState("sofar");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        fetchReportData();
    }, [reportType, timePeriod, startDate, endDate]);

    const fetchReportData = () => {
        setLoading(true);
        const start = timePeriod === "custom" ? startDate : null;
        const end = timePeriod === "custom" ? endDate : null;
        reportService.fetchReport(reportType, timePeriod, start, end)
            .then(data => {
                setReportData(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleExportPDF = () => {
        const start = timePeriod === "custom" ? startDate : null;
        const end = timePeriod === "custom" ? endDate : null;
        reportService.exportReportToPDF(reportType, timePeriod, start, end);
    };

    const renderChart = () => {
        if (loading) return <Typography>Loading...</Typography>;

        switch (reportType) {
            case "inventory":
                const inventoryLabels = reportData.map(item => item.productName);
                const inventoryData = reportData.map(item => item.totalQuantity);
                return (
                    <>
                        <Bar
                            data={{
                                labels: inventoryLabels,
                                datasets: [{
                                    label: 'Total Quantity',
                                    data: inventoryData,
                                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    borderWidth: 1,
                                }],
                            }}
                            options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' }, title: { display: true, text: 'Inventory Stock Levels' } },
                            }}
                        />
                        <Table sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product Name</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Supplier</TableCell>
                                    <TableCell>Total Quantity</TableCell>
                                    <TableCell>Last Restock Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{row.productName}</TableCell>
                                        <TableCell>{row.categoryName}</TableCell>
                                        <TableCell>{row.supplierName}</TableCell>
                                        <TableCell>{row.totalQuantity}</TableCell>
                                        <TableCell>{row.lastRestockDate || 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </>
                );

            case "sales":
                const salesLabels = reportData.map(item => `${item.orderType} (${item.paymentMethod})`);
                const salesData = reportData.map(item => item.totalSales);
                return (
                    <>
                        <Bar
                            data={{
                                labels: salesLabels,
                                datasets: [{
                                    label: 'Total Sales',
                                    data: salesData,
                                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                    borderColor: 'rgba(255, 99, 132, 1)',
                                    borderWidth: 1,
                                }],
                            }}
                            options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' }, title: { display: true, text: 'Sales Performance' } },
                            }}
                        />
                        <Table sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Order Type</TableCell>
                                    <TableCell>Payment Method</TableCell>
                                    <TableCell>Total Orders</TableCell>
                                    <TableCell>Total Sales</TableCell>
                                    <TableCell>Earliest Order</TableCell>
                                    <TableCell>Latest Order</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{row.orderType}</TableCell>
                                        <TableCell>{row.paymentMethod}</TableCell>
                                        <TableCell>{row.totalOrders}</TableCell>
                                        <TableCell>{row.totalSales.toFixed(2)}</TableCell>
                                        <TableCell>{row.earliestOrderDate || 'N/A'}</TableCell>
                                        <TableCell>{row.latestOrderDate || 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </>
                );

            case "productsales":
                const productSalesLabels = reportData.map(item => item.productName);
                const productSalesData = reportData.map(item => item.totalRevenue);
                return (
                    <>
                        <Bar
                            data={{
                                labels: productSalesLabels,
                                datasets: [{
                                    label: 'Total Revenue',
                                    data: productSalesData,
                                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                    borderColor: 'rgba(54, 162, 235, 1)',
                                    borderWidth: 1,
                                }],
                            }}
                            options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' }, title: { display: true, text: 'Product Sales' } },
                            }}
                        />
                        <Table sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product Name</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Total Units Sold</TableCell>
                                    <TableCell>Total Revenue</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{row.productName}</TableCell>
                                        <TableCell>{row.categoryName}</TableCell>
                                        <TableCell>{row.totalUnitsSold}</TableCell>
                                        <TableCell>{row.totalRevenue.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </>
                );

            case "restock":
                const restockLabels = reportData.map(item => item.productName);
                const restockData = reportData.map(item => item.quantityRestocked);
                return (
                    <>
                        <Line
                            data={{
                                labels: restockLabels,
                                datasets: [{
                                    label: 'Quantity Restocked',
                                    data: restockData,
                                    borderColor: 'rgba(153, 102, 255, 1)',
                                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                                    fill: true,
                                }],
                            }}
                            options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' }, title: { display: true, text: 'Restock History' } },
                            }}
                        />
                        <Table sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product Name</TableCell>
                                    <TableCell>Supplier</TableCell>
                                    <TableCell>Quantity Restocked</TableCell>
                                    <TableCell>Buying Price</TableCell>
                                    <TableCell>Restock Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{row.productName}</TableCell>
                                        <TableCell>{row.supplierName}</TableCell>
                                        <TableCell>{row.quantityRestocked}</TableCell>
                                        <TableCell>{row.buyingPrice.toFixed(2)}</TableCell>
                                        <TableCell>{row.lastRestockDate || 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </>
                );

            case "customer":
                const customerLabels = reportData.map(item => item.customerUsername);
                const customerData = reportData.map(item => item.totalSpent);
                return (
                    <>
                        <Pie
                            data={{
                                labels: customerLabels,
                                datasets: [{
                                    label: 'Total Spent',
                                    data: customerData,
                                    backgroundColor: [
                                        'rgba(255, 99, 132, 0.2)',
                                        'rgba(54, 162, 235, 0.2)',
                                        'rgba(255, 206, 86, 0.2)',
                                        'rgba(75, 192, 192, 0.2)',
                                        'rgba(153, 102, 255, 0.2)',
                                    ],
                                    borderColor: [
                                        'rgba(255, 99, 132, 1)',
                                        'rgba(54, 162, 235, 1)',
                                        'rgba(255, 206, 86, 1)',
                                        'rgba(75, 192, 192, 1)',
                                        'rgba(153, 102, 255, 1)',
                                    ],
                                    borderWidth: 1,
                                }],
                            }}
                            options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' }, title: { display: true, text: 'Customer Purchases' } },
                            }}
                        />
                        <Table sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Customer</TableCell>
                                    <TableCell>Total Orders</TableCell>
                                    <TableCell>Total Spent</TableCell>
                                    <TableCell>Last Order Date</TableCell>
                                    <TableCell>Order Types</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{row.customerUsername}</TableCell>
                                        <TableCell>{row.totalOrders}</TableCell>
                                        <TableCell>{row.totalSpent.toFixed(2)}</TableCell>
                                        <TableCell>{row.lastOrderDate || 'N/A'}</TableCell>
                                        <TableCell>{row.orderTypes}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </>
                );

            case "profit":
                const profitLabels = reportData.map(item => item.productName);
                const profitData = reportData.map(item => item.profit);
                return (
                    <>
                        <Bar
                            data={{
                                labels: profitLabels,
                                datasets: [{
                                    label: 'Profit',
                                    data: profitData,
                                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                                    borderColor: 'rgba(255, 159, 64, 1)',
                                    borderWidth: 1,
                                }],
                            }}
                            options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' }, title: { display: true, text: 'Profitability' } },
                            }}
                        />
                        <Table sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product Name</TableCell>
                                    <TableCell>Total Units Sold</TableCell>
                                    <TableCell>Total Revenue</TableCell>
                                    <TableCell>Total Cost</TableCell>
                                    <TableCell>Profit</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{row.productName}</TableCell>
                                        <TableCell>{row.totalUnitsSold}</TableCell>
                                        <TableCell>{row.totalRevenue.toFixed(2)}</TableCell>
                                        <TableCell>{row.totalCost.toFixed(2)}</TableCell>
                                        <TableCell>{row.profit.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </>
                );

            default:
                return <Typography>No data available</Typography>;
        }
    };

    return (
        <Box sx={{ padding: 4, paddingTop: 7}}>
            <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                Reports
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Select value={reportType} onChange={(e) => setReportType(e.target.value)} sx={{ minWidth: 200 }}>
                    <MenuItem value="inventory">Inventory Stock Report</MenuItem>
                    <MenuItem value="sales">Sales Performance Report</MenuItem>
                    <MenuItem value="productsales">Product Sales Report</MenuItem>
                    {/*<MenuItem value="restock">Restock History Report</MenuItem>*/}
                    <MenuItem value="customer">Customer Purchase Report</MenuItem>
                    <MenuItem value="profit">Profitability Report</MenuItem>
                </Select>
                <Select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} sx={{ minWidth: 150 }}>
                    <MenuItem value="day">Last Day</MenuItem>
                    <MenuItem value="month">Last Month</MenuItem>
                    <MenuItem value="year">Last Year</MenuItem>
                    <MenuItem value="sofar">So Far</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
                {timePeriod === "custom" && (
                    <>
                        <TextField
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 150 }}
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 150 }}
                        />
                    </>
                )}
                <Button variant="contained" onClick={handleExportPDF} sx={{ ml: 2 }}>
                    Export PDF
                </Button>
            </Box>
            {renderChart()}
        </Box>
    );
};

export default Reports;