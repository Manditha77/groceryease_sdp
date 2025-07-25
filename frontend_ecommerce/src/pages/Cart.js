import React, { useContext, useState, useEffect } from 'react';
import {
    Typography,
    Button,
    Box,
    Container,
    Grid,
    Divider,
    Paper,
    IconButton,
    Snackbar,
    Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { CartContext } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CartItem from '../components/CartItem';
import OrderSummary from '../components/OrderSummary';
import EmptyState from '../components/EmptyState';

function Cart() {
    const { cartItems, removeFromCart, updateUnits, wishlistItems, toggleWishlistItem, setEstimatedPickupDate } = useContext(CartContext);
    const [notification, setNotification] = useState(null);
    const navigate = useNavigate();

    // Calculate today's date as the estimated pickup date
    const today = new Date(); // Current date: May 19, 2025
    const estimatedPickupDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Store the estimated pickup date in CartContext
    useEffect(() => {
        setEstimatedPickupDate(estimatedPickupDate);
    }, [estimatedPickupDate, setEstimatedPickupDate]);

    const handleUpdateUnits = (productId, units) => {
        if (units <= 0) {
            handleRemoveFromCart(productId);
            return;
        }

        updateUnits(productId, units);
        setNotification({
            message: 'Cart updated successfully',
            type: 'success'
        });
    };

    const handleRemoveFromCart = (productId) => {
        removeFromCart(productId);
        setNotification({
            message: 'Item removed from cart',
            type: 'success'
        });
    };

    const handleSaveForLater = (productId) => {
        const item = cartItems.find(item => item.productId === productId);
        if (item) {
            toggleWishlistItem(item);
            removeFromCart(productId);
            setNotification({
                message: `${item.productName} saved for later`,
                type: 'success'
            });
        }
    };

    const isItemSaved = (productId) => {
        return wishlistItems?.some(item => item.productId === productId) || false;
    };

    const closeNotification = () => {
        setNotification(null);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    if (cartItems.length === 0) {
        return (
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <EmptyState
                    type="cart"
                    actionText="Browse Products"
                    onAction={() => navigate('/product-list')}
                />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Snackbar
                open={!!notification}
                autoHideDuration={3000}
                onClose={closeNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={closeNotification}
                    severity={notification?.type || 'success'}
                    sx={{ width: '100%' }}
                >
                    {notification?.message}
                </Alert>
            </Snackbar>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, paddingTop: 5 }}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{ mr: 1 }}
                        aria-label="Go back"
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" sx={{ color: '#549a54', fontWeight: 'bold' }}>
                        Your Cart
                    </Typography>
                </Box>
            </motion.div>

            <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <AnimatePresence>
                            {cartItems.map((item) => (
                                <CartItem
                                    key={item.productId}
                                    item={{
                                        ...item,
                                        maxUnits: item.units, // Updated from maxQuantity to maxUnits
                                    }}
                                    onUpdateUnits={handleUpdateUnits} // Updated from onUpdateQuantity
                                    onRemove={handleRemoveFromCart}
                                    onSaveForLater={handleSaveForLater}
                                    isSaved={isItemSaved(item.productId)}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/product-list')}
                            sx={{
                                borderRadius: 8,
                                px: 3,
                                py: 1.2,
                                textTransform: 'none',
                                color: '#108015',
                                borderColor: '#108015',
                            }}
                        >
                            Continue Shopping
                        </Button>

                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <Button
                                variant="contained"
                                onClick={() => navigate('/checkout')}
                                sx={{
                                    borderRadius: 8,
                                    px: 4,
                                    py: 1.2,
                                    textTransform: 'none',
                                    fontWeight: 'medium',
                                    boxShadow: '0 4px 12px rgba(4, 120, 192, 0.2)',
                                    bgcolor: '#549a54',
                                }}
                            >
                                Proceed to Checkout
                            </Button>
                        </motion.div>
                    </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                    <OrderSummary
                        cartItems={cartItems}
                        onAction={() => navigate('/checkout')}
                        noTax={true} // Indicate that tax should not be included
                    />

                    {/* Pickup Information */}
                    <Paper
                        elevation={0}
                        sx={{
                            mt: 3,
                            p: 3,
                            borderRadius: 2,
                            border: '1px solid #eaeaea',
                        }}
                    >
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Pickup Information
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Orders are available for pickup on the estimated date during our store hours.
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#108015' }}>
                            Estimated Pickup Date:
                        </Typography>
                        <Typography variant="body2">
                            {new Date(estimatedPickupDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#108015', mt: 2 }}>
                            Store Hours:
                        </Typography>
                        <Typography variant="body2">
                            Mon-Fri: 11:00 AM - 12:00 PM
                        </Typography>
                        <Typography variant="body2">
                            Sat-Sun: 10:00 AM - 12:00 PM
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default Cart;