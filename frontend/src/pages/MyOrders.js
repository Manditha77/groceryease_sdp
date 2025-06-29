import React, { useState, useEffect, useContext } from 'react';
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
    Divider,
    Modal,
    Backdrop,
    Fade,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import orderServices from '../services/orderServices';
import { CartContext } from '../CartContext';

function MyOrders() {
    const { estimatedPickupDate } = useContext(CartContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState('');
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

    const handleViewDetails = async (orderId) => {
        if (selectedOrder && selectedOrder.orderId === orderId) {
            setSelectedOrder(null);
            setDetailsError('');
            return;
        }

        setDetailsLoading(true);
        setDetailsError('');
        try {
            const response = await orderServices.getOrderById(orderId);
            setSelectedOrder(response.data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            setDetailsError('Failed to load order details. Please try again.');
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleCloseDetails = () => {
        setSelectedOrder(null);
        setDetailsError('');
    };

    const getStatusTimeline = (status) => {
        const timelines = {
            PENDING: ['Order Placed', 'Processing'],
            'READY FOR PICKUP': ['Order Placed', 'Processing', 'Ready for Pickup'],
            COMPLETED: ['Order Placed', 'Processing', 'Ready for Pickup', 'Completed'],
            CANCELLED: ['Order Placed', 'Cancelled'],
        };
        return timelines[status] || ['Order Placed'];
    };

    const handleReorder = (items) => {
        // Logic to add items back to cart (simplified, assumes CartContext is updated elsewhere)
        const cartItems = items.map(item => ({ ...item, quantity: item.quantity }));
        // This would typically update CartContext; for now, navigate to cart
        navigate('/cart');
    };

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
                <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Order Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.orderId} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                                    <TableCell>{new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                                    <TableCell>{order.totalAmount} LKR</TableCell>
                                    <TableCell sx={{ color: order.status === 'COMPLETED' ? '#2e7d32' : order.status === 'CANCELLED' ? '#d32f2f' : '#ed6c02' }}>
                                        {order.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => handleViewDetails(order.orderId)}
                                            sx={{ textTransform: 'none', backgroundColor: '#0478C0', '&:hover': { backgroundColor: '#035d8c' } }}
                                        >
                                            {selectedOrder && selectedOrder.orderId === order.orderId ? 'Close' : 'Track Order'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Modal
                open={!!selectedOrder}
                onClose={handleCloseDetails}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 500 }}
            >
                <Fade in={!!selectedOrder}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: { xs: '90%', sm: '80%', md: '600px' },
                            bgcolor: 'background.paper',
                            boxShadow: 24,
                            p: 4,
                            borderRadius: 2,
                            maxHeight: '80vh',
                            overflowY: 'auto',
                        }}
                    >
                        {detailsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : detailsError ? (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {detailsError}
                            </Alert>
                        ) : selectedOrder ? (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0478C0' }}>
                                        Order Details
                                    </Typography>
                                    <IconButton onClick={handleCloseDetails} sx={{ color: '#0478C0' }}>
                                        <Close />
                                    </IconButton>
                                </Box>
                                <Divider sx={{ mb: 3 }} />
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Order Summary
                                    </Typography>
                                    <Typography variant="body2">Order ID: {selectedOrder.orderId}</Typography>
                                    <Typography variant="body2">Date: {new Date(selectedOrder.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Typography>
                                    <Typography variant="body2">Total: {selectedOrder.totalAmount} LKR</Typography>
                                    <Typography variant="body2" sx={{ color: selectedOrder.status === 'COMPLETED' ? '#2e7d32' : selectedOrder.status === 'CANCELLED' ? '#d32f2f' : '#ed6c02' }}>
                                        Status: {selectedOrder.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                    </Typography>
                                    {estimatedPickupDate && (
                                        <Typography variant="body2">
                                            Estimated Pickup: {new Date(estimatedPickupDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Items
                                    </Typography>
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                        selectedOrder.items.map((item, index) => (
                                            <Box key={index} sx={{ mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                                <Typography variant="body2">
                                                    {item.productName || `Item ${index + 1}`} - Qty: {item.quantity}
                                                </Typography>
                                            </Box>
                                        ))
                                    ) : (
                                        <Typography variant="body2">No items found.</Typography>
                                    )}
                                </Box>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Status Timeline
                                    </Typography>
                                    {getStatusTimeline(selectedOrder.status).map((step, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    bgcolor: index < getStatusTimeline(selectedOrder.status).length - 1 ? '#0478C0' : '#e0e0e0',
                                                    borderRadius: '50%',
                                                    mr: 2,
                                                }}
                                            />
                                            <Typography variant="body2" sx={{ color: index < getStatusTimeline(selectedOrder.status).length - 1 ? '#0478C0' : 'text.secondary' }}>
                                                {step} {index === getStatusTimeline(selectedOrder.status).length - 1 && new Date(selectedOrder.orderDate).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Contact Support
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            href="mailto:support@yourstore.com"
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Email Support
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            href="tel:+1234567890"
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Call Support (+1-234-567-890)
                                        </Button>
                                    </Box>
                                </Box>
                                {/*<Button*/}
                                {/*    variant="contained"*/}
                                {/*    color="primary"*/}
                                {/*    onClick={() => handleReorder(selectedOrder.items)}*/}
                                {/*    sx={{ textTransform: 'none', mt: 2 }}*/}
                                {/*>*/}
                                {/*    Reorder*/}
                                {/*</Button>*/}
                            </>
                        ) : null}
                    </Box>
                </Fade>
            </Modal>

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