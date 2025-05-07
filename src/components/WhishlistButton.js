import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface WishlistButtonProps {
    isInWishlist: boolean;
    onClick: () => void;
    size?: 'small' | 'medium' | 'large';
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
                                                           isInWishlist,
                                                           onClick,
                                                           size = 'medium',
                                                           tooltipPlacement = 'top',
                                                       }) => {
    return (
        <Tooltip
            title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            placement={tooltipPlacement}
        >
            <motion.div whileTap={{ scale: 0.9 }}>
                <IconButton
                    onClick={onClick}
                    size={size}
                    color={isInWishlist ? "error" : "default"}
                    sx={{
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: isInWishlist ? 'rgba(211, 47, 47, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        }
                    }}
                >
                    {isInWishlist ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                            <Favorite />
                        </motion.div>
                    ) : (
                        <FavoriteBorder />
                    )}
                </IconButton>
            </motion.div>
        </Tooltip>
    );
};

export default WishlistButton;