import React, { useState, useEffect, useContext } from 'react';
import {
    Typography,
    TextField,
    Button,
    Box,
    Paper,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { CartContext } from '../CartContext';
import { useNavigate } from 'react-router-dom';
import orderServices from '../services/orderServices';

function Checkout() {
    const { cartItems, setCartItems } = useContext(CartContext);
    const [name, setName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash on Pickup');
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState(''); // Add state for error message
    const navigate = useNavigate();

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setName(storedUsername);
        }
    }, []);

    const totalPrice = cartItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);

    const handleSubmit = async () => {
        if (!name) {
            setErrorMessage('Please enter your name.');
            return;
        }

        setErrorMessage(''); // Clear previous errors
        if (paymentMethod === 'Online Payment') {
            setPaymentDialogOpen(true);
            return;
        }

        await submitOrder();
    };

    const submitOrder = async () => {
        const order = {
            customerName: name,
            paymentMethod: paymentMethod,
            items: cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
            totalAmount: totalPrice,
            status: 'PENDING',
        };

        try {
            const response = await orderServices.createOrder(order);
            console.log('Order creation response:', response);
            console.log('Response data:', response.data);

            if (!response.data.success) {
                throw new Error('Order creation failed according to backend response');
            }

            const orderId = response.data.order?.orderId;
            if (!orderId) {
                console.error('Order ID not found in response:', response.data);
                throw new Error('Order ID not returned from backend');
            }

            setCartItems([]);
            localStorage.removeItem('cart');
            alert(`Pre-order placed successfully! Your Order ID is ${orderId}. Please visit the shop to pick up your order.`);
            navigate('/product-list');
        } catch (error) {
            console.error('Error placing pre-order:', error);
            console.error('Error details:', error.response?.data || error.message);

            // Handle validation errors from backend
            if (error.response && error.response.status === 400) {
                const errors = error.response.data;
                // Convert error object to a readable string
                const errorMessages = Object.values(errors).join('; ');
                setErrorMessage(errorMessages || 'Failed to place pre-order. Please check your input.');
            } else {
                setErrorMessage(error.message || 'Failed to place pre-order. Please try again.');
            }
        }
    };

    const handlePaymentConfirm = () => {
        setPaymentDialogOpen(false);
        submitOrder();
    };

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                Pre-Order Checkout
            </Typography>
            {errorMessage && (
                <Typography variant="body1" sx={{ color: 'red', mb: 2 }}>
                    {errorMessage}
                </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 4 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>Order Summary</Typography>
                    {cartItems.map((item) => (
                        <Paper key={item.productId} sx={{ p: 2, mb: 2 }}>
                            <Typography variant="body1">
                                {item.productName} - Rs.{item.sellingPrice} x {item.quantity}
                            </Typography>
                        </Paper>
                    ))}
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6">
                        Total: Rs.{totalPrice.toFixed(2)}
                    </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>Customer Details</Typography>
                    <TextField
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                        variant="outlined"
                        sx={{ backgroundColor: 'white' }}
                        error={errorMessage.includes('name')} // Highlight field if error is related
                        helperText={errorMessage.includes('name') ? errorMessage : ''}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            label="Payment Method"
                        >
                            <MenuItem value="Cash on Pickup">Cash on Pickup</MenuItem>
                            <MenuItem value="Online Payment">Online Payment</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        sx={{ mt: 2, width: '100%', py: 1 }}
                    >
                        Place Pre-Order
                    </Button>
                </Box>
            </Box>

            <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
                <DialogTitle>Confirm Online Payment</DialogTitle>
                <DialogContent>
                    <Typography>
                        You are about to pay Rs.{totalPrice.toFixed(2)} via online payment. Proceed?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handlePaymentConfirm} color="primary">Confirm Payment</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Checkout;