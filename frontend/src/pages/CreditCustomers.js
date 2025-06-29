import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Button, Snackbar, Alert, Collapse, IconButton, Switch, FormControlLabel, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import orderServices from '../services/orderServices';
import productService from '../services/productServices';

const CreditCustomers = () => {
    const [unpaidOrders, setUnpaidOrders] = useState([]);
    const [paidOrders, setPaidOrders] = useState([]);
    const [products, setProducts] = useState({});
    const [expandedUnpaidCustomer, setExpandedUnpaidCustomer] = useState(null); // Separate state for unpaid
    const [expandedPaidCustomer, setExpandedPaidCustomer] = useState(null);    // Separate state for paid
    const [showPaidOrders, setShowPaidOrders] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, orderId: null });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch unpaid credit orders
                const unpaidResponse = await orderServices.getCreditOrdersByPaymentStatus(false);
                console.log('Unpaid Orders Data:', unpaidResponse.data);
                setUnpaidOrders(unpaidResponse.data);

                // Fetch paid credit orders
                const paidResponse = await orderServices.getCreditOrdersByPaymentStatus(true);
                console.log('Paid Orders Data:', paidResponse.data);
                setPaidOrders(paidResponse.data);

                // Fetch products
                const productResponse = await productService.getAllProducts();
                const productMap = productResponse.data.reduce((map, product) => {
                    map[product.productId] = product.productName;
                    return map;
                }, {});
                setProducts(productMap);
            } catch (error) {
                console.error('Error fetching data:', error);
                setSnackbar({ open: true, message: 'Failed to fetch credit orders', severity: 'error' });
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        console.log('Unpaid Orders State:', unpaidOrders);
        console.log('Paid Orders State:', paidOrders);
    }, [unpaidOrders, paidOrders]);

    const handleMarkAsPaid = async (orderId) => {
        try {
            const response = await orderServices.updateOrderStatus(orderId, 'PAID');
            setUnpaidOrders(unpaidOrders.filter(order => order.orderId !== orderId));
            setPaidOrders([...paidOrders, response.data.data]);
            setSnackbar({ open: true, message: `Order ID ${orderId} marked as PAID`, severity: 'success' });
        } catch (error) {
            const errorMessage = error.response?.data?.message || `Failed to mark Order ID ${orderId} as paid`;
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        }
    };

    const handleConfirmMarkAsPaid = (orderId) => {
        setConfirmDialog({ open: true, orderId });
    };

    const handleConfirmDialogClose = (confirmed) => {
        if (confirmed && confirmDialog.orderId) {
            handleMarkAsPaid(confirmDialog.orderId);
        }
        setConfirmDialog({ open: false, orderId: null });
    };

    const handleSendNotification = async (orderId) => {
        try {
            const response = await orderServices.sendLoanNotification(orderId);
            setSnackbar({ open: true, message: response.data.message, severity: 'success' });
        } catch (error) {
            const errorMessage = error.response?.data?.message || `Failed to send notification for Order ID: ${orderId}`;
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Group orders by customer for a specific order list
    const groupOrdersByCustomer = (orders) => {
        return orders.reduce((acc, order) => {
            const customerName = order.customerName;
            if (!acc[customerName]) {
                acc[customerName] = [];
            }
            acc[customerName].push(order);
            return acc;
        }, {});
    };

    const unpaidCustomers = groupOrdersByCustomer(unpaidOrders);
    const paidCustomers = groupOrdersByCustomer(paidOrders);

    const renderCustomerOrders = (customers, isPaid, expandedState, setExpandedState) => {
        return Object.entries(customers).map(([customerName, orders], index) => {
            const firstOrder = orders[0];
            const totalAmountDue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const hasContact = firstOrder.creditCustomerDetails && (firstOrder.creditCustomerDetails.email || firstOrder.creditCustomerDetails.phone);

            return (
                <Paper key={index} elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            Customer: {customerName}
                        </Typography>
                        <IconButton
                            onClick={() => setExpandedState(expandedState === customerName ? null : customerName)}
                            aria-expanded={expandedState === customerName}
                            aria-label="show more"
                        >
                            {expandedState === customerName ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>
                    <Collapse in={expandedState === customerName} timeout="auto" unmountOnExit>
                        {orders.map((order, orderIndex) => (
                            <Box key={orderIndex} sx={{ mt: orderIndex > 0 ? 2 : 0, border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Order ID: {order.orderId}
                                </Typography>
                                <Typography variant="body1">
                                    Date: {new Date(order.orderDate).toLocaleString()}
                                </Typography>
                                <Typography variant="body1">
                                    Status: {isPaid ? 'PAID' : 'UNPAID'}
                                </Typography>
                                <Typography variant="body1">
                                    Email: {order.creditCustomerDetails ? order.creditCustomerDetails.email : 'Not provided'}
                                </Typography>
                                <Typography variant="body1">
                                    Phone: {order.creditCustomerDetails ? order.creditCustomerDetails.phone : 'Not available'}
                                </Typography>
                                <Typography variant="body1">
                                    Address: {order.creditCustomerDetails ? order.creditCustomerDetails.address : 'Not available'}
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Purchased Products
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {order.items.map((item, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{products[item.productId] || 'Unknown Product'}</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell>Rs.{item.sellingPrice.toFixed(2)}</TableCell>
                                                    <TableCell>Rs.{(item.quantity * item.sellingPrice).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ borderLeft: '4px solid #0478C0', pl: 2, mb: 2 }}>
                                    <Typography variant="h6" sx={{ color: '#0478C0' }}>
                                        Total Amount Due for Order ID {order.orderId}: Rs.{order.totalAmount.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 2 }}>
                                    {!isPaid && (
                                        <>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleSendNotification(order.orderId)}
                                                disabled={!hasContact}
                                            >
                                                Send Reminder
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                onClick={() => handleConfirmMarkAsPaid(order.orderId)}
                                            >
                                                Mark as Paid
                                            </Button>
                                        </>
                                    )}
                                </Box>
                                {orderIndex < orders.length - 1 && <Divider sx={{ my: 2 }} />}
                            </Box>
                        ))}
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            Total Amount Due: Rs.{totalAmountDue.toFixed(2)}
                        </Typography>
                    </Collapse>
                </Paper>
            );
        });
    };

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                    Credit Customers
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={showPaidOrders}
                            onChange={(e) => setShowPaidOrders(e.target.checked)}
                            color="primary"
                        />
                    }
                    label="Show Paid Orders"
                />
            </Box>

            {/* Unpaid Orders Section */}
            <Typography variant="h5" gutterBottom sx={{ color: '#333', fontWeight: 'medium', mb: 2 }}>
                Unpaid Orders
            </Typography>
            {Object.keys(unpaidCustomers).length === 0 ? (
                <Typography variant="body1" sx={{ mb: 4 }}>
                    No unpaid credit orders found.
                </Typography>
            ) : (
                renderCustomerOrders(unpaidCustomers, false, expandedUnpaidCustomer, setExpandedUnpaidCustomer)
            )}

            {/* Paid Orders Section (conditionally rendered) */}
            {showPaidOrders && (
                <>
                    <Typography variant="h5" gutterBottom sx={{ color: '#333', fontWeight: 'medium', mb: 2, mt: 4 }}>
                        Paid Orders (History)
                    </Typography>
                    {Object.keys(paidCustomers).length === 0 ? (
                        <Typography variant="body1" sx={{ mb: 4 }}>
                            No paid credit orders found.
                        </Typography>
                    ) : (
                        renderCustomerOrders(paidCustomers, true, expandedPaidCustomer, setExpandedPaidCustomer)
                    )}
                </>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Dialog
                open={confirmDialog.open}
                onClose={() => handleConfirmDialogClose(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">Confirm Payment</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure this customer has paid for Order ID {confirmDialog.orderId}? This action will mark the order as PAID and disable reminders.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleConfirmDialogClose(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={() => handleConfirmDialogClose(true)} color="success" autoFocus>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CreditCustomers;