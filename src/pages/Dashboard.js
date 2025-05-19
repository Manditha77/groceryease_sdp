import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Snackbar,
    Alert,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slide,
    Chip,
    Button,
    Switch,
    CircularProgress,
    Badge,
    Divider,
    IconButton,
} from '@mui/material';
import { ShoppingCart, People, LocalShipping, Upload, Warning, ArrowForward, Refresh } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import productService from '../services/productServices';
import authService from '../services/authService';
import orderServices from '../services/orderServices';
import webSocketService from '../services/webSocketService';

const Dashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState(location.state?.success || '');
    const [open, setOpen] = useState(!!location.state?.success);
    const [errorMessage, setErrorMessage] = useState('');
    const [updateMessage, setUpdateMessage] = useState('');
    const [openUpdateSnackbar, setOpenUpdateSnackbar] = useState(false);
    const [updateSeverity, setUpdateSeverity] = useState('success');
    const [newOrderNotification, setNewOrderNotification] = useState(null);
    const [openNewOrderSnackbar, setOpenNewOrderSnackbar] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [openNotificationSnackbar, setOpenNotificationSnackbar] = useState(false);
    const [notificationSeverity, setNotificationSeverity] = useState('success');

    const [inventoryCount, setInventoryCount] = useState(0);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [expireSoonCount, setExpireSoonCount] = useState(0);
    const [expireSoonProducts, setExpireSoonProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [completedPreOrdersCount, setCompletedPreOrdersCount] = useState(0);
    const [showCompleted, setShowCompleted] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [userType, setUserType] = useState(localStorage.getItem('userType'));

    const [salesData, setSalesData] = useState({ totalSales: 0, onlineSales: 0, posSales: 0 });
    const [creditCustomers, setCreditCustomers] = useState({ count: 0, totalDue: 0 });
    const [inventorySummary, setInventorySummary] = useState({ discrete: 0, weight: 0, toReceive: 0 });
    const [salesDistribution, setSalesDistribution] = useState([]);
    const [topCategories, setTopCategories] = useState([]);

    const [isSendingReceivedEmail, setIsSendingReceivedEmail] = useState(false);
    const [isSendingCompletedEmail, setIsSendingCompletedEmail] = useState(false);

    const notificationSound = new Audio('/sounds/notification.wav');

    const isRechartsAvailable = () => typeof PieChart !== 'undefined' && typeof BarChart !== 'undefined';

    useEffect(() => {
        if (location.state?.success) setTimeout(() => setOpen(false), 3000);
    }, [location.state]);

    useEffect(() => {
        const handleStorageChange = () => setUserType(localStorage.getItem('userType'));
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const fetchInventoryData = async () => {
        try {
            const productResponse = await productService.getAllProducts();
            const preOrderResponse = await orderServices.getPendingPreOrdersQuantity();
            const products = productResponse.data;
            setInventoryCount(products.length);
            setLowStockCount(products.filter(product => product.units < 10).length);
            setInventorySummary({
                discrete: products.filter(p => p.unitType === 'DISCRETE').reduce((sum, p) => sum + p.units, 0),
                weight: products.filter(p => p.unitType === 'WEIGHT').reduce((sum, p) => sum + p.units, 0),
                toReceive: preOrderResponse.data.toReceive || 0,
            });
        } catch (error) {
            console.error('Error fetching inventory data:', error);
            setErrorMessage('Failed to load inventory data.');
        }
    };

    const fetchLowStockProducts = async () => {
        try {
            const response = await productService.getAllProducts();
            setLowStockProducts(response.data.filter(product => product.units < 10));
        } catch (error) {
            console.error('Error fetching low stock products:', error);
            setErrorMessage('Failed to load low stock products.');
        }
    };

    const fetchExpireSoonProducts = async () => {
        try {
            const response = await productService.getExpiringBatches();
            const expiringBatches = Array.isArray(response.data) ? response.data : [];
            setExpireSoonProducts(expiringBatches);
            setExpireSoonCount(expiringBatches.length);
        } catch (error) {
            console.error('Error fetching expiring batches:', error);
            setErrorMessage('Failed to load expiring batches.');
            setExpireSoonProducts([]);
            setExpireSoonCount(0);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await orderServices.getAllOrders();
            const fetchedOrders = response.data;
            if (Array.isArray(fetchedOrders)) {
                const preOrders = fetchedOrders.filter(order =>
                    order.orderType === 'ECOMMERCE' &&
                    (showCompleted
                        ? ['PENDING', 'PROCESSING', 'COMPLETED'].includes(order.status)
                        : ['PENDING', 'PROCESSING'].includes(order.status))
                );
                setOrders(preOrders);
                setCompletedPreOrdersCount(
                    fetchedOrders.filter(order => order.orderType === 'ECOMMERCE' && order.status === 'COMPLETED').length
                );
            } else {
                setOrders([]);
                setCompletedPreOrdersCount(0);
                setErrorMessage('Failed to load orders. Unexpected response format.');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
            setCompletedPreOrdersCount(0);
            setErrorMessage(error.response?.data?.message || error.message || 'Failed to load orders.');
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await productService.getAllProducts();
            setProducts(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        }
    };

    const fetchSalesData = async () => {
        try {
            const data = (await orderServices.getTodaySales()).data;
            setSalesData({
                totalSales: data.totalSales || 0,
                onlineSales: data.onlineSales || 0,
                posSales: data.posSales || 0,
            });
        } catch (error) {
            console.error('Error fetching sales data:', error);
            setErrorMessage('Failed to load sales data.');
            setSalesData({ totalSales: 0, onlineSales: 0, posSales: 0 });
        }
    };

    const fetchCreditCustomers = async () => {
        try {
            const response = await orderServices.getCreditOrdersByPaymentStatus(false);
            const unpaidOrders = response.data;
            setCreditCustomers({
                count: new Set(unpaidOrders.map(order => order.customerName)).size,
                totalDue: unpaidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
            });
        } catch (error) {
            console.error('Error fetching credit customers:', error);
            setErrorMessage('Failed to load credit customers.');
        }
    };

    const fetchSalesDistribution = async () => {
        try {
            const { onlineSales, posSales } = (await orderServices.getTodaySales()).data;
            setSalesDistribution([
                { name: 'Online Sales', value: onlineSales || 0 },
                { name: 'POS Sales', value: posSales || 0 },
            ]);
        } catch (error) {
            console.error('Error fetching sales distribution:', error);
            setErrorMessage('Failed to load sales distribution.');
            setSalesDistribution([]);
        }
    };

    const fetchTopCategories = async () => {
        try {
            const response = await orderServices.getTodaySalesByCategory();
            setTopCategories(
                response.data.slice(0, 5).map(item => ({
                    name: item.categoryName,
                    sales: item.sales || 0,
                    onlineSales: item.onlineSales || 0,
                }))
            );
        } catch (error) {
            console.error('Error fetching top categories:', error);
            setErrorMessage('Failed to load top categories.');
            setTopCategories([]);
        }
    };

    const refreshData = () => {
        fetchInventoryData();
        fetchLowStockProducts();
        fetchExpireSoonProducts();
        fetchOrders();
        fetchProducts();
        fetchSalesData();
        fetchCreditCustomers();
        fetchSalesDistribution();
        fetchTopCategories();
    };

    useEffect(() => {
        refreshData();

        webSocketService.connect((newOrder) => {
            setOrders(prev => [newOrder, ...prev].filter(order =>
                order.orderType === 'ECOMMERCE' &&
                (showCompleted
                    ? ['PENDING', 'PROCESSING', 'COMPLETED'].includes(order.status)
                    : ['PENDING', 'PROCESSING'].includes(order.status))
            ));
            setNewOrderNotification(newOrder);
            setOpenNewOrderSnackbar(true);
        });

        return () => webSocketService.disconnect();
    }, [showCompleted]);

    useEffect(() => {
        if (openNewOrderSnackbar) notificationSound.play().catch(error => console.error('Error playing sound:', error));
    }, [openNewOrderSnackbar]);

    const handleClose = () => setOpen(false);
    const handleUpdateSnackbarClose = () => setOpenUpdateSnackbar(false);
    const handleNewOrderSnackbarClose = () => {
        setOpenNewOrderSnackbar(false);
        setNewOrderNotification(null);
    };
    const handleNotificationSnackbarClose = () => setOpenNotificationSnackbar(false);
    const handleOrderClick = order => {
        setSelectedOrder(order);
        setNewStatus(order.status);
        setOrderDialogOpen(true);
    };
    const handleOrderDialogClose = () => {
        setOrderDialogOpen(false);
        setSelectedOrder(null);
        setNewStatus('');
    };
    const handleStatusChange = event => setNewStatus(event.target.value);
    const handleStatusUpdate = async () => {
        if (!selectedOrder || !newStatus) return;
        setIsUpdating(true);
        try {
            const orderId = selectedOrder.orderId;
            const response = await orderServices.updateOrderStatus(orderId, newStatus);
            await fetchOrders();
            const updatedOrder = (await orderServices.getOrderById(orderId)).data;
            setSelectedOrder(updatedOrder);
            setNewStatus(updatedOrder.status);
            await Promise.all([fetchProducts(), fetchLowStockProducts(), fetchInventoryData(), fetchExpireSoonProducts()]);
            const warnings = response.warnings || [];
            setUpdateMessage(warnings.length > 0
                ? `Order status updated, but issues occurred:\n${warnings.join('\n')}`
                : 'Order status updated successfully!');
            setUpdateSeverity(warnings.length > 0 ? 'warning' : 'success');
            setOpenUpdateSnackbar(true);
        } catch (error) {
            console.error('Error updating order status:', error);
            setUpdateMessage(error.response?.data?.message || error.message || 'Failed to update order status.');
            setUpdateSeverity('error');
            setOpenUpdateSnackbar(true);
        } finally {
            setIsUpdating(false);
        }
    };
    const handleSendOrderReceivedNotification = async () => {
        if (!selectedOrder) return;
        setIsSendingReceivedEmail(true);
        try {
            const response = await orderServices.sendOrderReceivedNotification(selectedOrder.orderId);
            setNotificationMessage(response.data.message);
            setNotificationSeverity('success');
            setOpenNotificationSnackbar(true);
        } catch (error) {
            console.error('Error sending notification:', error);
            setNotificationMessage(error.response?.data?.message || 'Failed to send notification.');
            setNotificationSeverity('error');
            setOpenNotificationSnackbar(true);
        } finally {
            setIsSendingReceivedEmail(false);
        }
    };
    const handleSendOrderCompletedNotification = async () => {
        if (!selectedOrder) return;
        setIsSendingCompletedEmail(true);
        try {
            const response = await orderServices.sendOrderCompletedNotification(selectedOrder.orderId);
            setNotificationMessage(response.data.message);
            setNotificationSeverity('success');
            setOpenNotificationSnackbar(true);
        } catch (error) {
            console.error('Error sending notification:', error);
            setNotificationMessage(error.response?.data?.message || 'Failed to send notification.');
            setNotificationSeverity('error');
            setOpenNotificationSnackbar(true);
        } finally {
            setIsSendingCompletedEmail(false);
        }
    };
    const getProductName = productId => {
        const product = products.find(p => p.productId === productId);
        return product ? product.productName : `Product ID: ${productId} (Not Found)`;
    };
    const handleSwitchChange = event => setShowCompleted(event.target.checked);
    const TransitionRight = props => <Slide {...props} direction="left" />;
    const COLORS = ['#1976d2', '#2e7d32', '#ed6c02'];

    // Status Chip color mapping
    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'PROCESSING': return 'info';
            case 'PENDING': return 'warning';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ padding: 1.5, paddingTop: 7, bgcolor: '#f7f9fc', minHeight: '100vh' }}>
            <Snackbar open={open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>{successMessage}</Alert>
            </Snackbar>
            <Snackbar open={openUpdateSnackbar} autoHideDuration={6000} onClose={handleUpdateSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleUpdateSnackbarClose} severity={updateSeverity} sx={{ width: '100%' }}>{updateMessage}</Alert>
            </Snackbar>
            <Snackbar open={openNewOrderSnackbar} autoHideDuration={6000} onClose={handleNewOrderSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} TransitionComponent={TransitionRight}>
                <Alert onClose={handleNewOrderSnackbarClose} severity="info" sx={{ width: '100%', bgcolor: '#0288d1', color: '#fff' }}>
                    <Badge badgeContent={<Warning color="error" />} color="error">
                        New Order Received! Order ID: {newOrderNotification?.orderId} from {newOrderNotification?.customerName}
                    </Badge>
                </Alert>
            </Snackbar>
            <Snackbar open={openNotificationSnackbar} autoHideDuration={6000} onClose={handleNotificationSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleNotificationSnackbarClose} severity={notificationSeverity} sx={{ width: '100%' }}>{notificationMessage}</Alert>
            </Snackbar>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: '600', fontSize: { xs: '1.5rem', md: '2rem' } }}>
                    Dashboard
                </Typography>
            </Box>

            {/* KPI Summary Cards */}
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                {/* Today Total Sales */}
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: '#1976d2', color: 'white', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <CardContent sx={{ p: '12px !important' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>Today's Total Sales</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: '600', mb: 0 }}>
                                        +{salesData.totalSales.toLocaleString()}
                                    </Typography>
                                </Box>
                                <ShoppingCart sx={{ opacity: 0.85 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Online Sales */}
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: '#2e7d32', color: 'white', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <CardContent sx={{ p: '12px !important' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>Online Sales</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: '600', mb: 0 }}>
                                        +{salesData.onlineSales.toLocaleString()}
                                    </Typography>
                                </Box>
                                <People sx={{ opacity: 0.85 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Last Credit Sell */}
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: '#ed6c02', color: 'white', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <CardContent sx={{ p: '12px !important' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>Credit Balance</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: '600', mb: 0 }}>
                                        +{creditCustomers.totalDue.toLocaleString()}
                                    </Typography>
                                </Box>
                                <LocalShipping sx={{ opacity: 0.85 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={1.5}>
                {/* Charts Row */}
                <Grid item xs={12} md={8}>
                    <Grid container spacing={1.5}>
                        {/* Top Selling Categories */}
                        <Grid item xs={12}>
                            <Card sx={{ bgcolor: '#ffffff', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <CardContent sx={{ p: '16px !important' }}>
                                    <Typography variant="h6" sx={{ color: '#263238', fontWeight: '600', mb: 1, fontSize: '1rem' }}>
                                        Top Selling Categories
                                    </Typography>
                                    {isRechartsAvailable() && (
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={topCategories} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                                <YAxis tick={{ fontSize: 10 }} />
                                                <ChartTooltip />
                                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                                <Bar dataKey="sales" name="Total Sales" fill="#1976d2" />
                                                <Bar dataKey="onlineSales" name="Online Sales" fill="#2e7d32" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Sales & Inventory Stats */}
                        <Grid item xs={12}>
                            <Grid container spacing={1.5}>
                                {/* Inventory Overview */}
                                <Grid item xs={12} sm={6}>
                                    <Card sx={{
                                        bgcolor: '#ffffff',
                                        borderRadius: '6px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                        height: '100%'
                                    }}>
                                        <CardContent sx={{ p: '16px !important' }}>
                                            <Typography variant="h6" sx={{ color: '#263238', fontWeight: '600', mb: 1, fontSize: '1rem' }}>
                                                Inventory Overview
                                            </Typography>
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#455a64', fontSize: '0.775rem', fontWeight: 500 }}>
                                                        Total Products
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
                                                        {inventoryCount}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#455a64', fontSize: '0.775rem', fontWeight: 500 }}>
                                                        Low Stock
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                                                        {lowStockCount}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#455a64', fontSize: '0.775rem', fontWeight: 500 }}>
                                                        Discrete Stock
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
                                                        {inventorySummary.discrete}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#455a64', fontSize: '0.775rem', fontWeight: 500 }}>
                                                        Weight Stock
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
                                                        {inventorySummary.weight.toFixed(2)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#455a64', fontSize: '0.775rem', fontWeight: 500 }}>
                                                        Expire Soon
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ color: '#ed6c02', fontWeight: 600 }}>
                                                        {expireSoonCount}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Sales Distribution */}
                                <Grid item xs={12} sm={6}>
                                    <Card sx={{
                                        bgcolor: '#ffffff',
                                        borderRadius: '6px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                        height: '100%'
                                    }}>
                                        <CardContent sx={{ p: '16px !important' }}>
                                            <Typography variant="h6" sx={{ color: '#263238', fontWeight: '600', mb: 1, fontSize: '1rem' }}>
                                                Sales Distribution
                                            </Typography>
                                            {isRechartsAvailable() && salesDistribution.length > 0 && (
                                                <ResponsiveContainer width="100%" height={150}>
                                                    <PieChart>
                                                        <Pie
                                                            data={salesDistribution}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={60}
                                                            fill="#1976d2"
                                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                            labelLine={false}
                                                        >
                                                            {salesDistribution.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <ChartTooltip formatter={(value) => `Rs.${value.toLocaleString()}`} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            )}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                                                <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600, fontSize: '0.8rem' }}>
                                                    Online: Rs.{salesData.onlineSales.toLocaleString()}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600, fontSize: '0.8rem' }}>
                                                    POS: Rs.{salesData.posSales.toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Right Side Content */}
                <Grid item xs={12} md={4}>
                    <Grid container spacing={1.5}>
                        {/* Pre-Orders */}
                        <Grid item xs={12}>
                            <Card sx={{ bgcolor: '#ffffff', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <CardContent sx={{ p: '16px !important' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="h6" sx={{ color: '#263238', fontWeight: '600', fontSize: '1rem' }}>
                                            Pre-Orders
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Badge badgeContent={orders.length} color="primary">
                                                <Switch
                                                    checked={showCompleted}
                                                    onChange={handleSwitchChange}
                                                    color="primary"
                                                    size="small"
                                                    title="Show Completed Orders"
                                                />
                                            </Badge>
                                        </Box>
                                    </Box>
                                    {errorMessage && (
                                        <Typography variant="body2" sx={{ color: '#d32f2f', mb: 1, fontSize: '0.775rem' }}>
                                            {errorMessage}
                                        </Typography>
                                    )}
                                    {Array.isArray(orders) && orders.length > 0 ? (
                                        <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                            {orders.map(order => (
                                                <Box
                                                    key={order.orderId || 'unknown'}
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        p: 1,
                                                        borderBottom: '1px solid #eceff1',
                                                        cursor: 'pointer',
                                                        '&:hover': { bgcolor: '#f5f5f5' },
                                                    }}
                                                    onClick={() => handleOrderClick(order)}
                                                >
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                                            {order.customerName || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#78909c' }}>
                                                            Order ID: {order.orderId || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={order.status || 'N/A'}
                                                        color={getStatusColor(order.status)}
                                                        size="small"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: '#78909c', fontSize: '0.775rem' }}>
                                            {showCompleted ? 'No pre-orders available.' : 'No pending/processing pre-orders.'}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" sx={{ color: '#78909c', display: 'block', mt: 1 }}>
                                        Completed: {completedPreOrdersCount}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Low Stock Products */}
                        <Grid item xs={12}>
                            <Card sx={{ bgcolor: '#ffffff', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <CardContent sx={{ p: '16px !important' }}>
                                    <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: '600', mb: 1, fontSize: '1rem' }}>
                                        Low Stock Products
                                    </Typography>
                                    {lowStockProducts.length > 0 ? (
                                        <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
                                            {lowStockProducts.slice(0, 5).map(product => (
                                                <Box
                                                    key={product.productId}
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        p: 1,
                                                        borderBottom: '1px solid #eceff1',
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                        {product.productName}
                                                    </Typography>
                                                    <Chip
                                                        label={product.units === 0 ? 'Out of Stock' : `Units: ${product.units}`}
                                                        color={product.units === 0 ? 'error' : 'warning'}
                                                        size="small"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                </Box>
                                            ))}
                                            {lowStockProducts.length > 5 && (
                                                <Typography variant="body2" sx={{ color: '#78909c', fontSize: '0.775rem', mt: 1 }}>
                                                    +{lowStockProducts.length - 5} more...
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: '#78909c', fontSize: '0.775rem' }}>
                                            No low stock products.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Expire Soon Products */}
                        <Grid item xs={12}>
                            <Card sx={{ bgcolor: '#ffffff', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <CardContent sx={{ p: '16px !important' }}>
                                    <Typography variant="h6" sx={{ color: '#ed6c02', fontWeight: '600', mb: 1, fontSize: '1rem' }}>
                                        Expire Soon Batches
                                    </Typography>
                                    {expireSoonProducts.length > 0 ? (
                                        <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
                                            {expireSoonProducts.slice(0, 5).map(batch => (
                                                <Box
                                                    key={batch.batchId}
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        p: 1,
                                                        borderBottom: '1px solid #eceff1',
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                            {batch.productName}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#78909c', fontSize: '0.75rem' }}>
                                                            Batch ID: {batch.batchId}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={`Expires: ${new Date(batch.expireDate.split('T')[0]).toLocaleDateString()}`}
                                                        color="warning"
                                                        size="small"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                </Box>
                                            ))}
                                            {expireSoonProducts.length > 5 && (
                                                <Typography variant="body2" sx={{ color: '#78909c', fontSize: '0.775rem', mt: 1 }}>
                                                    +{expireSoonProducts.length - 5} more...
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: '#78909c', fontSize: '0.775rem' }}>
                                            No expiring batches.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Order Details Dialog */}
            <Dialog open={orderDialogOpen} onClose={handleOrderDialogClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#f7f9fc', borderBottom: '1px solid #eceff1' }}>
                    Order Details - Order ID: {selectedOrder?.orderId || 'N/A'}
                </DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                    {selectedOrder && (
                        <Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                        Customer: {selectedOrder.customerName || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#455a64' }}>
                                        Payment: {selectedOrder.paymentMethod || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#455a64' }}>
                                        Total: Rs.{selectedOrder.totalAmount ?? '0'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#455a64' }}>
                                        Date: {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString() : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Status</InputLabel>
                                        <Select value={newStatus} onChange={handleStatusChange} label="Status">
                                            <MenuItem value="PENDING">Pending</MenuItem>
                                            <MenuItem value="PROCESSING">Processing</MenuItem>
                                            <MenuItem value="COMPLETED">Completed</MenuItem>
                                            <MenuItem value="CANCELLED">Cancelled</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                Items
                            </Typography>
                            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #eceff1' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, color: '#263238' }}>Product</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#263238' }}>Units</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#263238' }}>Price</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#263238' }}>Subtotal</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedOrder.items && Array.isArray(selectedOrder.items) ? (
                                            selectedOrder.items.map(item => (
                                                <TableRow key={item.id || 'unknown'}>
                                                    <TableCell>{getProductName(item.productId)}</TableCell>
                                                    <TableCell>{item.units ?? 'N/A'}</TableCell>
                                                    <TableCell>Rs.{item.sellingPrice ?? '0'}</TableCell>
                                                    <TableCell>
                                                        Rs.{(item.units && item.sellingPrice) ? (item.units * item.sellingPrice).toFixed(2) : '0'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} sx={{ color: '#78909c' }}>
                                                    No items available.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #eceff1' }}>
                    <Button onClick={handleOrderDialogClose} disabled={isUpdating} color="inherit">
                        Close
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            onClick={handleSendOrderReceivedNotification}
                            color="secondary"
                            variant="contained"
                            disabled={isUpdating || isSendingReceivedEmail}
                            size="small"
                            sx={{ mr: 1 }}
                        >
                            {isSendingReceivedEmail ? 'Sending...' : 'Send Order Received Email'}
                        </Button>
                        {isSendingReceivedEmail && <CircularProgress size={20} />}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            onClick={handleSendOrderCompletedNotification}
                            color="success"
                            variant="contained"
                            disabled={isUpdating || selectedOrder?.status !== 'COMPLETED' || isSendingCompletedEmail}
                            size="small"
                            sx={{ mr: 1 }}
                        >
                            {isSendingCompletedEmail ? 'Sending...' : 'Send Order Completed Email'}
                        </Button>
                        {isSendingCompletedEmail && <CircularProgress size={20} />}
                    </Box>
                    <Button
                        onClick={handleStatusUpdate}
                        color="primary"
                        variant="contained"
                        disabled={newStatus === selectedOrder?.status || isUpdating}
                        size="small"
                    >
                        {isUpdating ? 'Saving...' : 'Save Status'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Dashboard;