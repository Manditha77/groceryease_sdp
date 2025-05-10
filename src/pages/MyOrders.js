import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Alert,
    Collapse,
    CircularProgress,
    IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import orderServices from '../services/orderServices';

function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const customerName = localStorage.getItem('username');
                if (!customerName) {
                    setErrorMessage('Please log in to view your orders.');
                    setLoading(false);
                    return;
                }
                const response = await orderServices.getOrdersByCustomer(customerName);
                setOrders(response.data);
            } catch (error) {
                console.error('Error fetching orders:', error);
                setErrorMessage('Failed to load orders. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, paddingTop: 2 }}>
                <Typography variant="h4" sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                    My Orders
                </Typography>
            </Box>

            <Collapse in={!!errorMessage}>
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    action={
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={() => setErrorMessage('')}
                        >
                            <Close fontSize="inherit" />
                        </IconButton>
                    }
                >
                    {errorMessage}
                </Alert>
            </Collapse>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : orders.length === 0 ? (
                <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                    You have no orders yet.
                </Typography>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #eaeaea' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Order ID</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Total Amount</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.orderId}>
                                    <TableCell>{order.orderId}</TableCell>
                                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                                    <TableCell>{order.totalAmount} LKR</TableCell>
                                    <TableCell>{order.status}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => navigate(`/order-details/${order.orderId}`)}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/product-list')}
                    sx={{ borderRadius: 8, px: 4, py: 1.2, textTransform: 'none' }}
                >
                    Continue Shopping
                </Button>
            </Box>
        </Container>
    );
}

export default MyOrders;