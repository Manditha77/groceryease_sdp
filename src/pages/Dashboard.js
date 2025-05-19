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

    const [salesData, setSalesData] = useState({ totalSales: 0, onlineSales: 0, posSales: 0 });
    const [creditCustomers, setCreditCustomers] = useState({ count: 0, totalDue: 0 });
    const [inventorySummary, setInventorySummary] = useState({ inHand: 0, toReceive: 0 });
    const [salesDistribution, setSalesDistribution] = useState([]);
    const [topCategories, setTopCategories] = useState([]);

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
            setLowStockProducts(response.data.filter(product => product.quantity < 10));
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
            setSalesData((await orderServices.getTodaySales()).data);
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
                response.data.slice(0, 4).map(item => ({ name: item.categoryName, sales: item.sales }))
            );
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
            await Promise.all([fetchProducts(), fetchLowStockProducts(), fetchInventoryData()]);
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
            console.error('Error sending notification:', error);
            setNotificationMessage(error.response?.data?.message || 'Failed to send notification.');
            setNotificationSeverity('error');
            setOpenNotificationSnackbar(true);
        }
    };
    const getProductName = productId => {
        const product = products.find(p => p.productId === productId);
        return product ? product.productName : `Product ID: ${productId} (Not Found)`;
    };
    const handleSwitchChange = event => setShowCompleted(event.target.checked);
    const TransitionRight = props => <Slide {...props} direction="left" />;
    const COLORS = ['#42A5F5', '#90CAF9'];

    return (
        <Box sx={{ padding: 4, paddingTop: 7, bgcolor: '#F5F7FA' }}>
            <Snackbar open={open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>{successMessage}</Alert>
            </Snackbar>
            <Snackbar open={openUpdateSnackbar} autoHideDuration={6000} onClose={handleUpdateSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleUpdateSnackbarClose} severity={updateSeverity} sx={{ width: '100%' }}>{updateMessage}</Alert>
            </Snackbar>
            <Snackbar open={openNewOrderSnackbar} autoHideDuration={6000} onClose={handleNewOrderSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} TransitionComponent={TransitionRight}>
                <Alert onClose={handleNewOrderSnackbarClose} severity="info" sx={{ width: '100%', bgcolor: '#0288d1', color: '#fff' }}>
                    New Order Received! Order ID: {newOrderNotification?.orderId} from {newOrderNotification?.customerName}
                </Alert>
            </Snackbar>
            <Snackbar open={openNotificationSnackbar} autoHideDuration={6000} onClose={handleNotificationSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleNotificationSnackbarClose} severity={notificationSeverity} sx={{ width: '100%' }}>{notificationMessage}</Alert>
            </Snackbar>

            <Typography variant="h4" gutterBottom sx={{ color: '#1E88E5', fontWeight: 'bold' }}>Dashboard</Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card sx={{ bgcolor: '#FFFFFF', borderRadius: 2, boxShadow: 1, mb: 3 }}>
                        <CardContent>
                            <Typography variant="h5" sx={{ color: '#1E88E5', fontWeight: 'bold', mb: 2 }}>Inventory Overview</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" sx={{ color: '#424242' }}>Total Products</Typography>
                                    <Typography variant="h4" sx={{ color: '#1E88E5' }}>{inventoryCount}</Typography>
                                    <Typography variant="body2" sx={{ color: '#FF5252' }}>Low Stock: {lowStockCount}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" sx={{ color: '#424242' }}>Current Stock</Typography>
                                    <Typography variant="h4" sx={{ color: '#2E7D32' }}>{inventorySummary.inHand}</Typography>
                                    <Typography variant="body2" sx={{ color: '#424242' }}>To Receive: {inventorySummary.toReceive}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" sx={{ color: '#424242' }}>Credit Customers</Typography>
                                    <Typography variant="h4" sx={{ color: '#1E88E5' }}>{creditCustomers.count}</Typography>
                                    <Typography variant="body2" sx={{ color: '#424242' }}>Total Due: Rs. {creditCustomers.totalDue.toLocaleString()}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                    <Card sx={{ bgcolor: '#FFFFFF', borderRadius: 2, boxShadow: 1, mb: 3 }}>
                        <CardContent>
                            <Typography variant="h5" sx={{ color: '#1E88E5', fontWeight: 'bold', mb: 2 }}>Today's Sales</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" sx={{ color: '#424242' }}>Total Sales</Typography>
                                    <Typography variant="h4" sx={{ color: '#1E88E5' }}>Rs. {salesData.totalSales.toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" sx={{ color: '#424242' }}>Online Sales</Typography>
                                    <Typography variant="h4" sx={{ color: '#1E88E5' }}>Rs. {salesData.onlineSales.toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" sx={{ color: '#424242' }}>POS Sales</Typography>
                                    <Typography variant="h4" sx={{ color: '#1E88E5' }}>Rs. {salesData.posSales.toLocaleString()}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ bgcolor: '#FFFFFF', borderRadius: 2, boxShadow: 1 }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ color: '#1E88E5', fontWeight: 'bold' }}>Sales Distribution</Typography>
                                    {isRechartsAvailable() && (
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie data={salesDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
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
                                    <Typography variant="h6" sx={{ color: '#1E88E5', fontWeight: 'bold' }}>Top Categories</Typography>
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
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#FFFFFF', borderRadius: 2, boxShadow: 1, mb: 3 }}>
                        <CardContent>
                            <Typography variant="h5" sx={{ color: '#1E88E5', fontWeight: 'bold', mb: 1 }}>Pre-Orders</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" sx={{ color: '#424242' }}>Completed: {completedPreOrdersCount}</Typography>
                                <Switch checked={showCompleted} onChange={handleSwitchChange} color="primary" title="Show Completed Orders" />
                            </Box>
                            {errorMessage && <Typography variant="body1" sx={{ color: '#FF5252', mb: 2 }}>{errorMessage}</Typography>}
                            {Array.isArray(orders) && orders.length > 0 ? (
                                <Grid container spacing={2}>
                                    {orders.map(order => (
                                        <Grid item xs={12} key={order.orderId || 'unknown'}>
                                            <Card onClick={() => handleOrderClick(order)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}>
                                                <CardContent>
                                                    <Typography variant="h6">{order.customerName || 'N/A'}</Typography>
                                                    <Typography variant="body2">Order ID: {order.orderId || 'N/A'}</Typography>
                                                    <Chip
                                                        label={order.status || 'N/A'}
                                                        color={order.status === 'COMPLETED' ? 'success' : 'warning'}
                                                        size="small"
                                                    />
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Typography variant="body1" sx={{ color: '#757575' }}>
                                    {showCompleted ? 'No pre-orders available.' : 'No pending/processing pre-orders.'}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                    <Card sx={{ bgcolor: '#FFFFFF', borderRadius: 2, boxShadow: 1 }}>
                        <CardContent>
                            <Typography variant="h5" sx={{ color: '#FF5252', fontWeight: 'bold', mb: 2 }}>Low Stock Products</Typography>
                            {lowStockProducts.length > 0 ? (
                                <Grid container spacing={2}>
                                    {lowStockProducts.map(product => (
                                        <Grid item xs={12} key={product.productId}>
                                            <Card>
                                                <CardContent>
                                                    <Typography variant="h6">{product.productName}</Typography>
                                                    <Chip
                                                        label={product.quantity === 0 ? 'Out of Stock' : `Qty: ${product.quantity}`}
                                                        color={product.quantity === 0 ? 'error' : 'warning'}
                                                        size="small"
                                                    />
                                                    <Typography variant="body2">Category: {product.categoryName}</Typography>
                                                    <Typography variant="body2">Company: {product.supplierCompanyName}</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Typography variant="body1" sx={{ color: '#757575' }}>No low stock products.</Typography>
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
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6">Customer: {selectedOrder.customerName || 'N/A'}</Typography>
                                    <Typography variant="body1">Payment: {selectedOrder.paymentMethod || 'N/A'}</Typography>
                                    <Typography variant="body1">Total: Rs.{selectedOrder.totalAmount ?? '0'}</Typography>
                                    <Typography variant="body1">Date: {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString() : 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
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
                            <Typography variant="h6" sx={{ mt: 2 }}>Items:</Typography>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Product</TableCell>
                                            <TableCell>Quantity</TableCell>
                                            <TableCell>Price</TableCell>
                                            <TableCell>Subtotal</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedOrder.items && Array.isArray(selectedOrder.items) ? (
                                            selectedOrder.items.map(item => (
                                                <TableRow key={item.id || 'unknown'}>
                                                    <TableCell>{getProductName(item.productId)}</TableCell>
                                                    <TableCell>{item.quantity ?? 'N/A'}</TableCell>
                                                    <TableCell>Rs.{item.sellingPrice ?? '0'}</TableCell>
                                                    <TableCell>Rs.{(item.quantity && item.sellingPrice) ? (item.quantity * item.sellingPrice) : '0'}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={4}>No items available.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleOrderDialogClose} disabled={isUpdating}>Close</Button>
                    <Button onClick={handleSendOrderReceivedNotification} color="secondary" variant="contained" disabled={isUpdating}>
                        Send Order Received Email
                    </Button>
                    <Button onClick={handleSendOrderCompletedNotification} color="success" variant="contained" disabled={isUpdating || selectedOrder?.status !== 'COMPLETED'}>
                        Send Order Completed Email
                    </Button>
                    <Button onClick={handleStatusUpdate} color="primary" variant="contained" disabled={newStatus === selectedOrder?.status || isUpdating}>
                        {isUpdating ? 'Saving...' : 'Save Status'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Dashboard;