import React, { useContext } from 'react';
import {
    Typography,
    Button,
    Box,
    Paper,
    Divider,
    IconButton,
} from '@mui/material';
import { Add, Remove, Delete } from '@mui/icons-material';
import { CartContext } from '../CartContext';
import { useNavigate } from 'react-router-dom';

function Cart() {
    const { cartItems, removeFromCart, updateQuantity } = useContext(CartContext);
    const navigate = useNavigate();

    const totalPrice = cartItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);

    return (
        <Box sx={{ padding: 4, paddingTop: 7}}>
            <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                Your Cart
            </Typography>
            {cartItems.length === 0 ? (
                <Typography variant="h6" sx={{ mt: 4, textAlign: 'center' }}>
                    Your cart is empty. <Button color="primary" onClick={() => navigate('/product-list')}>Start Shopping</Button>
                </Typography>
            ) : (
                <Box>
                    {cartItems.map((item) => (
                        <Paper key={item.productId} sx={{ mb: 2, p: 2, display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h6">{item.productName}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Rs.{item.sellingPrice} x {item.quantity}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton
                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                >
                                    <Remove />
                                </IconButton>
                                <Typography sx={{ mx: 2 }}>{item.quantity}</Typography>
                                <IconButton onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                                    <Add />
                                </IconButton>
                                <IconButton onClick={() => removeFromCart(item.productId)} color="error">
                                    <Delete />
                                </IconButton>
                            </Box>
                        </Paper>
                    ))}
                    <Divider sx={{ my: 3 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5">
                            Total: Rs.{totalPrice.toFixed(2)}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate('/checkout')}
                            sx={{ px: 4, py: 1 }}
                        >
                            Proceed to Checkout
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default Cart;