import React, { useContext } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    IconButton,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';

function Wishlist() {
    const { wishlistItems, toggleWishlistItem, addToCart, cartItems } = useContext(CartContext);
    const navigate = useNavigate();

    const getCartQuantity = (productId: number) => {
        const cartItem = cartItems.find(item => item.productId === productId);
        return cartItem ? cartItem.quantity : 0;
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

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (!wishlistItems || wishlistItems.length === 0) {
        return (
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{ mr: 1 }}
                        aria-label="Go back"
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                        My Wishlist
                    </Typography>
                </Box>

                <EmptyState
                    type="wishlist"
                    actionText="Browse Products"
                    onAction={() => navigate('/product-list')}
                />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton
                    onClick={() => navigate(-1)}
                    sx={{ mr: 1 }}
                    aria-label="Go back"
                >
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4" sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                    My Wishlist
                </Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" paragraph>
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later
            </Typography>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <Grid container spacing={3}>
                    <AnimatePresence>
                        {wishlistItems.map((item) => {
                            const cartQuantity = getCartQuantity(item.productId);

                            return (
                                <Grid item xs={12} sm={6} md={4} key={item.productId}>
                                    <motion.div variants={itemVariants}>
                                        <ProductCard
                                            product={item}
                                            onAddToCart={addToCart}
                                            cartQuantity={cartQuantity}
                                            onAddToWishlist={toggleWishlistItem}
                                            isInWishlist={true}
                                        />
                                    </motion.div>
                                </Grid>
                            );
                        })}
                    </AnimatePresence>
                </Grid>
            </motion.div>
        </Container>
    );
}

export default Wishlist;