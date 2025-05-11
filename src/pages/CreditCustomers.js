import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Button, Snackbar, Alert } from '@mui/material';
import orderServices from '../services/orderServices';
import productService from '../services/productServices';

const CreditCustomers = () => {
    const [creditOrders, setCreditOrders] = useState([]);
    const [products, setProducts] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch orders
                const response = await orderServices.getAllOrders();
                console.log('Raw API Response:', response);
                console.log('Orders Data:', response.data);
                const orders = response.data.filter(order => {
                    console.log('Order Payment Method:', order.paymentMethod);
                    return order.paymentMethod.toLowerCase() === 'credit purpose';
                });
                console.log('Filtered Credit Orders:', orders);
                setCreditOrders(orders);

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
        console.log('Credit Orders State:', creditOrders);
    }, [creditOrders]);

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

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                Credit Customers
            </Typography>
            {creditOrders.length === 0 ? (
                <Typography variant="body1">No credit customers found.</Typography>
            ) : (
                creditOrders.map((order, index) => {
                    console.log('Rendering Order:', order);
                    console.log('Credit Customer Details:', order.creditCustomerDetails);
                    return (
                        <Paper key={index} elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" gutterBottom>
                                    Order ID: {order.orderId}
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleSendNotification(order.orderId)}
                                    disabled={!order.creditCustomerDetails || (!order.creditCustomerDetails.email && !order.creditCustomerDetails.phone)}
                                    sx={{ mb: 2 }}
                                >
                                    Send Reminder
                                </Button>
                            </Box>
                            <Typography variant="body1">
                                Date: {new Date(order.orderDate).toLocaleString()}
                            </Typography>
                            <Typography variant="body1">
                                Customer: {order.customerName}
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
                            <Typography variant="h6">
                                Total Amount Due: Rs.{order.totalAmount.toFixed(2)}
                            </Typography>
                        </Paper>
                    );
                })
            )}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CreditCustomers;