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
} from '@mui/material';
import { ShoppingCart, People, LocalShipping, Upload } from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
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
    const [orders, setOrders] = useState([]);
    const [completedPreOrdersCount, setCompletedPreOrdersCount] = useState(0);
    const [showCompleted, setShowCompleted] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [userType, setUserType] = useState(localStorage.getItem('userType'));

    // State for new features
    const [salesData, setSalesData] = useState({
        totalSales: 0,
        onlineSales: 0,
        posSales: 0,
    });
    const [creditCustomers, setCreditCustomers] = useState({
        count: 0,
        totalDue: 0,
    });
    const [inventorySummary, setInventorySummary] = useState({
        inHand: 0,
        toReceive: 0,
    });
    const [salesDistribution, setSalesDistribution] = useState([]);
    const [topCategories, setTopCategories] = useState([]);

    const notificationSound = new Audio('/sounds/notification.wav');

    const isRechartsAvailable = () => {
        return typeof PieChart !== 'undefined' && typeof BarChart !== 'undefined';
    };

    useEffect(() => {
        if (location.state?.success) {
            setTimeout(() => setOpen(false), 3000);
        }
    }, [location.state]);

    useEffect(() => {
        const handleStorageChange = () => {
            setUserType(localStorage.getItem('userType'));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const fetchInventoryData = async () => {
        try {
            const productResponse = await productService.getAllProducts();
            const preOrderResponse = await orderServices.getPendingPreOrdersQuantity();
            const products = productResponse.data;
            setInventoryCount(products.length);
            setLowStockCount(products.filter(product => product.quantity < 10).length);
            setInventorySummary({
                inHand: products.reduce((sum, p) => sum + p.quantity, 0),
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
            const products = response.data;
            setLowStockProducts(products.filter(product => product.quantity < 10));
        } catch (error) {
            console.error('Error fetching low stock products:', error);
            setErrorMessage('Failed to load low stock products.');
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
                        ? (order.status === 'PENDING' || order.status === 'PROCESSING' || order.status === 'COMPLETED')
                        : (order.status === 'PENDING' || order.status === 'PROCESSING'))
                );
                setOrders(preOrders);

                const completedCount = fetchedOrders.filter(order =>
                    order.orderType === 'ECOMMERCE' && order.status === 'COMPLETED'
                ).length;
                setCompletedPreOrdersCount(completedCount);
            } else {
                console.error('Fetched orders is not an array:', fetchedOrders);
                setOrders([]);
                setCompletedPreOrdersCount(0);
                setErrorMessage('Failed to load orders. Unexpected response format.');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
            setCompletedPreOrdersCount(0);
            const message = error.response?.data?.message || error.message || 'Failed to load orders. Please try again later.';
            setErrorMessage(message);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await productService.getAllProducts();
            const fetchedProducts = response.data;
            if (Array.isArray(fetchedProducts)) {
                setProducts(fetchedProducts);
            } else {
                console.error('Fetched products is not an array:', fetchedProducts);
                setProducts([]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        }
    };

    const fetchSalesData = async () => {
        try {
            const response = await orderServices.getTodaySales();
            setSalesData(response.data);
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
            const response = await orderServices.getTodaySales();
            const { onlineSales, posSales } = response.data;
            const distribution = [
                { name: 'Online Sales', value: onlineSales || 0 },
                { name: 'POS Sales', value: posSales || 0 },
            ];
            setSalesDistribution(distribution);
        } catch (error) {
            console.error('Error fetching sales distribution:', error);
            setErrorMessage('Failed to load sales distribution.');
            setSalesDistribution([]);
        }
    };

    const fetchTopCategories = async () => {
        try {
            const response = await orderServices.getTodaySalesByCategory();
            const topCategories = response.data
                .slice(0, 4)
                .map(item => ({
                    name: item.categoryName,
                    sales: item.sales,
                }));
            setTopCategories(topCategories);
        } catch (error) {
            console.error('Error fetching top categories:', error);
            setErrorMessage('Failed to load top categories.');
            setTopCategories([]);
        }
    };

    useEffect(() => {
        fetchInventoryData();
        fetchLowStockProducts();
        fetchOrders();
        fetchProducts();
        fetchSalesData();
        fetchCreditCustomers();
        fetchSalesDistribution();
        fetchTopCategories();

        webSocketService.connect((newOrder) => {
            setOrders((prevOrders) => {
                const updatedOrders = [newOrder, ...prevOrders].filter(order =>
                    order.orderType === 'ECOMMERCE' &&
                    (showCompleted
                        ? (order.status === 'PENDING' || order.status === 'PROCESSING' || order.status === 'COMPLETED')
                        : (order.status === 'PENDING' || order.status === 'PROCESSING'))
                );
                return updatedOrders;
            });
            setNewOrderNotification(newOrder);
            setOpenNewOrderSnackbar(true);
        });

        return () => {
            webSocketService.disconnect();
        };
    }, [showCompleted]);

    useEffect(() => {
        if (openNewOrderSnackbar) {
            notificationSound.play().catch((error) => {
                console.error('Error playing notification sound:', error);
            });
        }
    }, [openNewOrderSnackbar]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleUpdateSnackbarClose = () => {
        setOpenUpdateSnackbar(false);
    };

    const handleNewOrderSnackbarClose = () => {
        setOpenNewOrderSnackbar(false);
        setNewOrderNotification(null);
    };

    const handleNotificationSnackbarClose = () => {
        setOpenNotificationSnackbar(false);
    };

    const handleOrderClick = (order) => {
        setSelectedOrder(order);
        setNewStatus(order.status);
        setOrderDialogOpen(true);
    };

    const handleOrderDialogClose = () => {
        setOrderDialogOpen(false);
        setSelectedOrder(null);
        setNewStatus('');
    };

    const handleStatusChange = (event) => {
        setNewStatus(event.target.value);
    };

    const handleStatusUpdate = async () => {
        if (!selectedOrder || !newStatus) return;

        setIsUpdating(true);
        try {
            const orderId = selectedOrder.orderId;
            const response = await orderServices.updateOrderStatus(orderId, newStatus);
            console.log('Updated order from backend:', response.data);

            await fetchOrders();
            const updatedOrderResponse = await orderServices.getOrderById(orderId);
            const updatedOrder = updatedOrderResponse.data;
            setSelectedOrder(updatedOrder);

            await fetchProducts();
            await fetchLowStockProducts();
            await fetchInventoryData();

            const warnings = response.warnings || [];
            if (warnings.length > 0) {
                setUpdateMessage('Order status updated, but some inventory adjustments failed:\n' + warnings.join('\n'));
                setUpdateSeverity('warning');
            } else {
                setUpdateMessage('Order status updated successfully!');
                setUpdateSeverity('success');
            }
            setOpenUpdateSnackbar(true);
        } catch (error) {
            console.error('Error updating order status:', error);
            const message = error.response?.data?.message || error.message || 'Failed to update order status. Please try again.';
            setUpdateMessage(message);
            setUpdateSeverity('error');
            setOpenUpdateSnackbar(true);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendOrderReceivedNotification = async () => {
        if (!selectedOrder) return;

        try {
            const response = await orderServices.sendOrderReceivedNotification(selectedOrder.orderId);
            setNotificationMessage(response.data.message);
            setNotificationSeverity('success');
            setOpenNotificationSnackbar(true);
        } catch (error) {
            console.error('Error sending order received notification:', error);
            const message = error.response?.data?.message || 'Failed to send order received notification.';
            setNotificationMessage(message);
            setNotificationSeverity('error');
            setOpenNotificationSnackbar(true);
        }
    };

    const handleSendOrderCompletedNotification = async () => {
        if (!selectedOrder) return;

        try {
            const response = await orderServices.sendOrderCompletedNotification(selectedOrder.orderId);
            setNotificationMessage(response.data.message);
            setNotificationSeverity('success');
            setOpenNotificationSnackbar(true);
        } catch (error) {
            console.error('Error sending order completed notification:', error);
            const message = error.response?.data?.message || 'Failed to send order completed notification.';
            setNotificationMessage(message);
            setNotificationSeverity('error');
            setOpenNotificationSnackbar(true);
        }
    };

    const getProductName = (productId) => {
        const product = products.find(p => p.productId === productId);
        return product ? product.productName : `Product ID: ${productId} (Not Found)`;
    };

    const handleSwitchChange = (event) => {
        setShowCompleted(event.target.checked);
    };

    const TransitionRight = (props) => {
        return <Slide {...props} direction="left" />;
    };

    const COLORS = ['#42A5F5', '#90CAF9'];

    return (
        <Box sx={{ padding: 4, paddingTop: 7, bgcolor: '#F5F7FA' }}>
            <Snackbar open={open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            <Snackbar
                open={openUpdateSnackbar}
                autoHideDuration={6000}
                onClose={handleUpdateSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleUpdateSnackbarClose} severity={updateSeverity} sx={{ width: '100%' }}>
                    {updateMessage}
                </Alert>
            </Snackbar>

            <Snackbar
                open={openNewOrderSnackbar}
                autoHideDuration={6000}
                onClose={handleNewOrderSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                TransitionComponent={TransitionRight}
            >
                <Alert
                    onClose={handleNewOrderSnackbarClose}
                    severity="info"
                    sx={{ width: '100%', bgcolor: '#0288d1', color: '#fff' }}
                >
                    New Order Received! Order ID: {newOrderNotification?.orderId} from {newOrderNotification?.customerName}
                </Alert>
            </Snackbar>

            <Snackbar
                open={openNotificationSnackbar}
                autoHideDuration={6000}
                onClose={handleNotificationSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleNotificationSnackbarClose} severity={notificationSeverity} sx={{ width: '100%' }}>
                    {notificationMessage}
                </Alert>
            </Snackbar>

            <Typography variant="h4" gutterBottom sx={{ color: '#1E88E5', fontWeight: 'bold' }}>
                Dashboard
            </Typography>

            <Grid container spacing={3}>
                {/* Left Side: 2/3 of the screen */}
                <Grid item xs={12} md={8}>
                    {/* Inventory Overview and Sales */}
                    <Card sx={{ bgcolor: '#FFFFFF', borderRadius: 2, boxShadow: 1, mb: 3 }}>
                        <CardContent>
                            <Typography variant="h5" sx={{ color: '#1E88E5', fontWeight: 'bold', mb: 2 }}>
                                Inventory Overview
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" sx={{ color: '#424242' }}>Total Products</Typography>
                                    <Typography variant="h4" sx={{ color: '#1E88E5' }}>{inventoryCount}</Typography>
                                    <Typography variant="body2" sx={{ color: '#FF5252' }}>
                                        Low Stock: {lowStockCount}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" sx={{ color: '#424242' }}>Current Stock</Typography>
                                    <Typography variant="h4" sx={{ color: '#2E7D32' }}>{inventorySummary.inHand}</Typography>
                                    <Typography variant="body2" sx={{ color: '#424242' }}>
                                        To Receive: {inventorySummary.toReceive}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" sx={{ color: '#424242' }}>Credit Customers</Typography>
                                    <Typography variant="h4" sx={{ color: '#1E88E5' }}>{creditCustomers.count}</Typography>
                                    <Typography variant="body2" sx={{ color: '#424242' }}>
                                        Total Due: Rs. {creditCustomers.totalDue.toLocaleString()}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Sales Data */}
                    <Card sx={{ bgcolor: '#FFFFFF', borderRadius: 2, boxShadow: 1, mb: 3 }}>
                        <CardContent>
                            <Typography variant="h5" sx={{ color: '#1E88E5', fontWeight: 'bold', mb: 2 }}>
                                Today's Sales
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" sx={{ color: '#424242' }}>Total Sales</Typography>
                                    <Typography variant="h4" sx={{ color: '#1E88E5' }}>
                                        Rs. {salesData.totalSales.toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" sx={{ color: '#424242' }}>Online Sales</Typography>
                                    <Typography variant="h4" sx={{ color: '#1E88E5' }}>
                                        Rs. {salesData.onlineSales.toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" sx={{ color: '#424242' }}>POS Sales</Typography>
                                    <Typography variant="h4" sx={{ color: '#1E88E5' }}>
                                        Rs. {salesData.posSales.toLocaleString()}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Charts */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ bgcolor: '#FFFFFF', borderRadius: 2, boxShadow: 1 }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ color: '#1E88E5', fontWeight: 'bold' }}>
                                        Sales Distribution
                                    </Typography>
                                    {isRechartsAvailable() && (
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={salesDistribution}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    label
                                                >
                                                    {salesDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <ChartTooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ bgcolor: '#FFFFFF', borderRadius: 2, boxShadow: 1 }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ color: '#1E88E5', fontWeight: 'bold' }}>
                                        Top Categories
                                    </Typography>
                                    {isRechartsAvailable() && (
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={topCategories}>
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <ChartTooltip />
                                                <Bar dataKey="sales" fill="#90CAF9" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Right Side: 1/3 of the screen */}
                <Grid item xs={12} md={4}>
                    {/* Pre-Orders */}
                    <Card sx={{ bgcolor: '#FFFFFF', borderRadius: 2, boxShadow: 1, mb: 3 }}>
                        <CardContent>
                            <Typography variant="h5" sx={{ color: '#1E88E5', fontWeight: 'bold', mb: 1 }}>
                                Pre-Orders
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" sx={{ color: '#424242' }}>
                                    Completed Pre-Orders: {completedPreOrdersCount}
                                </Typography>
                                <Box>
                                    <Switch
                                        checked={showCompleted}
                                        onChange={handleSwitchChange}
                                        color="primary"
                                        inputProps={{ 'aria-label': 'Show Completed Orders' }}
                                        title="Show Completed Orders"
                                    />
                                </Box>
                            </Box>
                            {errorMessage && (
                                <Typography variant="body1" sx={{ color: '#FF5252', mb: 2 }}>
                                    {errorMessage}
                                </Typography>
                            )}
                            {Array.isArray(orders) && orders.length > 0 ? (
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Order ID</TableCell>
                                                <TableCell>Customer Name</TableCell>
                                                <TableCell>Payment Method</TableCell>
                                                <TableCell>Total Amount</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Order Date</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {orders.map((order) => (
                                                <TableRow
                                                    key={order.orderId || 'unknown'}
                                                    onClick={() => handleOrderClick(order)}
                                                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                                >
                                                    <TableCell>{order.orderId || 'N/A'}</TableCell>
                                                    <TableCell>{order.customerName || 'N/A'}</TableCell>
                                                    <TableCell>{order.paymentMethod || 'N/A'}</TableCell>
                                                    <TableCell>Rs.{order.totalAmount !== undefined ? order.totalAmount : '0'}</TableCell>
                                                    <TableCell>{order.status || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        {order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography variant="body1" sx={{ color: '#757575' }}>
                                    {showCompleted
                                        ? 'No pending, processing, or completed pre-orders available.'
                                        : 'No pending or processing pre-orders available.'}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>

                    {/* Low Stock Products */}
                    <Card sx={{ bgcolor: '#FFFFFF', borderRadius: 2, boxShadow: 1 }}>
                        <CardContent>
                            <Typography variant="h5" sx={{ color: '#FF5252', fontWeight: 'bold', mb: 2 }}>
                                Low Stock Products
                            </Typography>
                            {lowStockProducts.length > 0 ? (
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Product Name</TableCell>
                                                <TableCell align="right">Quantity</TableCell>
                                                <TableCell align="right">Category</TableCell>
                                                <TableCell align="right">Company</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {lowStockProducts.map((product) => (
                                                <TableRow key={product.productId}>
                                                    <TableCell>
                                                        {product.productName}
                                                        {product.quantity === 0 && (
                                                            <Chip
                                                                label="Out of Stock"
                                                                color="error"
                                                                size="small"
                                                                sx={{ ml: 1, bgcolor: '#FF5252', color: '#fff' }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">{product.quantity}</TableCell>
                                                    <TableCell align="right">{product.categoryName}</TableCell>
                                                    <TableCell align="right">{product.supplierCompanyName}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography variant="body1" sx={{ color: '#757575' }}>
                                    No products are running low on stock.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Dialog open={orderDialogOpen} onClose={handleOrderDialogClose} maxWidth="md" fullWidth>
                <DialogTitle>Order Details - Order ID: {selectedOrder?.orderId || 'N/A'}</DialogTitle>
                <DialogContent>
                    {selectedOrder && (
                        <Box>
                            <Typography variant="h6">Customer Name: {selectedOrder.customerName || 'N/A'}</Typography>
                            <Typography variant="body1">Payment Method: {selectedOrder.paymentMethod || 'N/A'}</Typography>
                            <Typography variant="body1">
                                Total Amount: Rs.{selectedOrder.totalAmount !== undefined ? selectedOrder.totalAmount : '0'}
                            </Typography>
                            <Typography variant="body1">
                                Order Date: {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString() : 'N/A'}
                            </Typography>
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={newStatus}
                                        onChange={handleStatusChange}
                                        label="Status"
                                    >
                                        <MenuItem value="PENDING">Pending</MenuItem>
                                        <MenuItem value="PROCESSING">Processing</MenuItem>
                                        <MenuItem value="COMPLETED">Completed</MenuItem>
                                        <MenuItem value="CANCELLED">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Typography variant="h6" sx={{ mt: 2 }}>Items:</Typography>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Product</TableCell>
                                            <TableCell>Quantity</TableCell>
                                            <TableCell>Selling Price</TableCell>
                                            <TableCell>Subtotal</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedOrder.items && Array.isArray(selectedOrder.items) ? (
                                            selectedOrder.items.map((item) => (
                                                <TableRow key={item.id || 'unknown'}>
                                                    <TableCell>{getProductName(item.productId)}</TableCell>
                                                    <TableCell>{item.quantity !== undefined ? item.quantity : 'N/A'}</TableCell>
                                                    <TableCell>Rs.{item.sellingPrice !== undefined ? item.sellingPrice : '0'}</TableCell>
                                                    <TableCell>
                                                        Rs.{item.sellingPrice !== undefined && item.quantity !== undefined ? (item.quantity * item.sellingPrice) : '0'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4}>No items available.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleOrderDialogClose} disabled={isUpdating}>Close</Button>
                    <Button
                        onClick={handleSendOrderReceivedNotification}
                        color="secondary"
                        variant="contained"
                        disabled={isUpdating}
                    >
                        Send Order Received Email
                    </Button>
                    <Button
                        onClick={handleSendOrderCompletedNotification}
                        color="success"
                        variant="contained"
                        disabled={isUpdating || selectedOrder?.status !== 'COMPLETED'}
                    >
                        Send Order Completed Email
                    </Button>
                    <Button
                        onClick={handleStatusUpdate}
                        color="primary"
                        variant="contained"
                        disabled={newStatus === selectedOrder?.status || isUpdating}
                    >
                        {isUpdating ? 'Saving...' : 'Save Status'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Dashboard;