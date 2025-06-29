import React from 'react';
import { Box, Typography, Button, SxProps } from '@mui/material';
import { ShoppingBag, ShoppingCart, Inventory } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    type: 'cart' | 'wishlist' | 'orders' | 'search';
    title?: string;
    message?: string;
    actionText?: string;
    onAction?: () => void;
    sx?: SxProps;
}

const EmptyState: React.FC<EmptyStateProps> = ({
                                                   type,
                                                   title,
                                                   message,
                                                   actionText,
                                                   onAction,
                                                   sx = {},
                                               }) => {
    const getIcon = () => {
        switch (type) {
            case 'cart':
                return <ShoppingCart sx={{ fontSize: 80, color: '#0478C0', opacity: 0.5 }} />;
            case 'wishlist':
                return <Inventory sx={{ fontSize: 80, color: '#0478C0', opacity: 0.5 }} />;
            case 'orders':
                return <ShoppingBag sx={{ fontSize: 80, color: '#0478C0', opacity: 0.5 }} />;
            case 'search':
                return <ShoppingBag sx={{ fontSize: 80, color: '#0478C0', opacity: 0.5 }} />;
            default:
                return <ShoppingBag sx={{ fontSize: 80, color: '#0478C0', opacity: 0.5 }} />;
        }
    };

    const getDefaultTitle = () => {
        switch (type) {
            case 'cart':
                return 'Your cart is empty';
            case 'wishlist':
                return 'Your wishlist is empty';
            case 'orders':
                return 'No orders found';
            case 'search':
                return 'No products found';
            default:
                return 'Nothing to show';
        }
    };

    const getDefaultMessage = () => {
        switch (type) {
            case 'cart':
                return 'Looks like you haven\'t added any products to your cart yet.';
            case 'wishlist':
                return 'Save items you like to your wishlist so you can find them later.';
            case 'orders':
                return 'You haven\'t placed any orders yet.';
            case 'search':
                return 'We couldn\'t find any products matching your search.';
            default:
                return 'There\'s nothing to show here right now.';
        }
    };

    const getDefaultAction = () => {
        switch (type) {
            case 'cart':
            case 'wishlist':
            case 'search':
                return 'Browse Products';
            case 'orders':
                return 'Start Shopping';
            default:
                return 'Go Back';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                    px: 2,
                    ...sx
                }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    {getIcon()}
                </motion.div>

                <Typography
                    variant="h5"
                    sx={{
                        mt: 3,
                        fontWeight: 'bold',
                        color: 'text.primary',
                    }}
                >
                    {title || getDefaultTitle()}
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        mt: 1,
                        mb: 4,
                        color: 'text.secondary',
                        textAlign: 'center',
                        maxWidth: '500px'
                    }}
                >
                    {message || getDefaultMessage()}
                </Typography>

                {onAction && (
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={onAction}
                            sx={{
                                borderRadius: 8,
                                px: 4,
                                py: 1.2,
                                textTransform: 'none',
                                fontWeight: 'medium',
                            }}
                        >
                            {actionText || getDefaultAction()}
                        </Button>
                    </motion.div>
                )}
            </Box>
        </motion.div>
    );
};

export default EmptyState;