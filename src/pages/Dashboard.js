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
    Button,
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
} from '@mui/material';
import { ShoppingCart, People, LocalShipping, Report } from '@mui/icons-material';
import productService from '../services/productServices';
import authService from '../services/authService';
import orderServices from '../services/orderServices';
import webSocketService from '../services/webSocketService';

const Dashboard = () => {
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.success || '');
    const [open, setOpen] = useState(!!location.state?.success);
    const [errorMessage, setErrorMessage] = useState('');
    const [updateMessage, setUpdateMessage] = useState('');
    const [openUpdateSnackbar, setOpenUpdateSnackbar] = useState(false);
    const [updateSeverity, setUpdateSeverity] = useState('success');
    const [newOrderNotification, setNewOrderNotification] = useState(null);
    const [openNewOrderSnackbar, setOpenNewOrderSnackbar] = useState(false);
    const navigate = useNavigate();

    const [inventoryCount, setInventoryCount] = useState(0);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [employeeCount, setEmployeeCount] = useState(0);
    const [supplierCount, setSupplierCount] = useState(0);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);

    const notificationSound = new Audio('/sounds/notification.wav');

    useEffect(() => {
        if (location.state?.success) {
            setTimeout(() => setOpen(false), 3000);
        }
    }, [location.state]);

    const fetchInventoryData = async () => {
        try {
            const response = await productService.getAllProducts();
            const products = response.data;
            setInventoryCount(products.length);
            setLowStockCount(products.filter(product => product.quantity < 10).length);
        } catch (error) {
            console.error('Error fetching inventory data:', error);
        }
    };

    const fetchEmployeeData = async () => {
        try {
            const employees = await authService.getEmployees();
            setEmployeeCount(employees.length);
        } catch (error) {
            console.error('Error fetching employee data:', error);
        }
    };

    const fetchSupplierData = async () => {
        try {
            const suppliers = await authService.getSuppliers();
            setSupplierCount(suppliers.length);
        } catch (error) {
            console.error('Error fetching supplier data:', error);
        }
    };

    const fetchLowStockProducts = async () => {
        try {
            const response = await productService.getAllProducts();
            const products = response.data;
            const lowStock = products.filter(product => product.quantity < 10);
            setLowStockProducts(lowStock);
        } catch (error) {
            console.error('Error fetching low stock products:', error);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await orderServices.getAllOrders();
            const fetchedOrders = response.data;
            if (Array.isArray(fetchedOrders)) {
                setOrders(fetchedOrders);
            } else {
                console.error('Fetched orders is not an array:', fetchedOrders);
                setOrders([]);
                setErrorMessage('Failed to load orders. Unexpected response format.');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
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

    useEffect(() => {
        fetchInventoryData();
        fetchEmployeeData();
        fetchSupplierData();
        fetchLowStockProducts();
        fetchOrders();
        fetchProducts();

        webSocketService.connect((newOrder) => {
            setOrders((prevOrders) => [newOrder, ...prevOrders]);
            setNewOrderNotification(newOrder);
            setOpenNewOrderSnackbar(true);
        });

        return () => {
            webSocketService.disconnect();
        };
    }, []);

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

            // Update the order status
            const response = await orderServices.updateOrderStatus(orderId, newStatus);
            console.log('Updated order from backend:', response.data); // Log the response to debug

            // Refetch all orders to ensure the table is updated with complete data
            await fetchOrders();

            // Fetch the specific order to update the dialog
            const updatedOrderResponse = await orderServices.getOrderById(orderId);
            const updatedOrder = updatedOrderResponse.data;
            setSelectedOrder(updatedOrder);

            // Refresh product and inventory data
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

    const getProductName = (productId) => {
        const product = products.find(p => p.productId === productId);
        return product ? product.productName : `Product ID: ${productId} (Not Found)`;
    };

    const TransitionRight = (props) => {
        return <Slide {...props} direction="left" />;
    };

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
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

            <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                Dashboard
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                    <Card sx={{ bgcolor: '#E3F2FD', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#1565C0', fontWeight: 'bold' }}>
                                New Orders
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#1E88E5', fontWeight: 'bold' }}>
                                {inventoryCount}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#1565C0' }}>
                                Total Products
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#FF6F00' }}>
                                Low Stock: {lowStockCount}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <Card sx={{ bgcolor: '#E3F2FD', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#1565C0', fontWeight: 'bold' }}>
                                Inventory Overview
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#1E88E5', fontWeight: 'bold' }}>
                                {inventoryCount}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#1565C0' }}>
                                Total Products
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#FF6F00' }}>
                                Low Stock: {lowStockCount}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <Card sx={{ bgcolor: '#E8F5E9', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                                Employees
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#43A047', fontWeight: 'bold' }}>
                                {employeeCount}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#2E7D32' }}>
                                Total Employees
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <Card sx={{ bgcolor: '#FFF3E0', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#EF6C00', fontWeight: 'bold' }}>
                                Suppliers
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#FB8C00', fontWeight: 'bold' }}>
                                {supplierCount}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#EF6C00' }}>
                                Active Suppliers
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <Card sx={{ bgcolor: '#FCE4EC', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#C2185B', fontWeight: 'bold' }}>
                                Reports
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#E91E63', fontWeight: 'bold' }}>
                                10
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#C2185B' }}>
                                Generated Reports
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ marginTop: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                    Quick Actions
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Button
                            variant="contained"
                            startIcon={<ShoppingCart />}
                            sx={{ width: '100%', height: 60, bgcolor: '#1E88E5', color: '#fff', fontWeight: 'bold' }}
                            onClick={() => navigate('/inventory')}
                        >
                            Add New Product
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button
                            variant="contained"
                            startIcon={<People />}
                            sx={{ width: '100%', height: 60, bgcolor: '#43A047', color: '#fff', fontWeight: 'bold' }}
                            onClick={() => navigate('/manage-employees')}
                        >
                            Manage Employees
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button
                            variant="contained"
                            startIcon={<LocalShipping />}
                            sx={{ width: '100%', height: 60, bgcolor: '#FB8C00', color: '#fff', fontWeight: 'bold' }}
                            onClick={() => navigate('/manage-suppliers')}
                        >
                            Manage Suppliers
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ marginTop: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                    Pre-Orders
                </Typography>
                {errorMessage && (
                    <Typography variant="body1" sx={{ color: 'red', mb: 2 }}>
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
                        No pre-orders available.
                    </Typography>
                )}
            </Box>

            <Box sx={{ marginTop: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ color: '#FF6F00', fontWeight: 'bold' }}>
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
                                        <TableCell>{product.productName}</TableCell>
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
            </Box>

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