import React, { useState, useContext } from 'react';
import {
    Typography,
    TextField,
    Button,
    Box,
    Paper,
    Divider,
} from '@mui/material';
import { CartContext } from '../CartContext';
import { useNavigate } from 'react-router-dom';
import orderServices from '../services/orderServices';

function Checkout() {
    const { cartItems, setCartItems } = useContext(CartContext);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const navigate = useNavigate();

    const totalPrice = cartItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);

    const handleSubmit = async () => {
        if (!name || !address) {
            alert('Please fill in all fields.');
            return;
        }

        const order = {
            customerName: name,
            customerAddress: address,
            items: cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        };

        try {
            await orderServices.createOrder(order);
            setCartItems([]);
            localStorage.removeItem('cart');
            alert('Order placed successfully!');
            navigate('/product-list');
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        }
    };

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                Checkout
            </Typography>
            <Box sx={{ display: 'flex', gap: 4 }}>
                {/* Order Summary */}
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
                {/* Customer Details Form */}
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
                    />
                    <TextField
                        label="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                        variant="outlined"
                        multiline
                        rows={3}
                        sx={{ backgroundColor: 'white' }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        sx={{ mt: 2, width: '100%', py: 1 }}
                    >
                        Place Order
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

export default Checkout;