import React from 'react';
import {
    Paper,
    Box,
    Typography,
    IconButton,
    Tooltip,
    CardMedia,
} from '@mui/material';
import { Add, Remove, Delete } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface CartItemProps {
    item: {
        productId: number;
        productName: string;
        sellingPrice: number;
        units: number;
        base64Image?: string;
        maxUnits: number;
        unitType: string;
    };
    onUpdateUnits: (productId: number, units: number) => void;
    onRemove: (productId: number) => void;
    onSaveForLater?: (productId: number) => void;
    isSaved?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({
                                               item,
                                               onUpdateUnits,
                                               onRemove,
                                               onSaveForLater,
                                               isSaved = false,
                                           }) => {
    const itemSubtotal = item.sellingPrice * item.units;

    const handleDecrement = () => {
        const decrement = item.unitType === 'WEIGHT' ? 0.01 : 1;
        const newUnits = Math.max(0, item.units - decrement);
        onUpdateUnits(item.productId, newUnits);
    };

    const handleIncrement = () => {
        const increment = item.unitType === 'WEIGHT' ? 0.01 : 1;
        const newUnits = item.unitType === 'WEIGHT'
            ? Number((item.units + increment).toFixed(2))
            : item.units + increment;
        console.log('handleIncrement:', {
            productId: item.productId,
            units: item.units,
            maxUnits: item.maxUnits,
            newUnits,
            increment,
            unitType: item.unitType
        });
        if (newUnits <= item.maxUnits) {
            onUpdateUnits(item.productId, newUnits);
        } else {
            console.warn('Cannot increment: newUnits exceeds maxUnits');
        }
    };

    const isIncrementDisabled = () => {
        // Safeguard for invalid data
        if (!Number.isFinite(item.units) || !Number.isFinite(item.maxUnits) || item.maxUnits <= 0) {
            console.warn('Invalid data for increment:', {
                units: item.units,
                maxUnits: item.maxUnits,
                unitType: item.unitType
            });
            return true;
        }

        const increment = item.unitType === 'WEIGHT' ? 0.01 : 1;
        const newUnits = item.unitType === 'WEIGHT'
            ? Number((item.units + increment).toFixed(2))
            : item.units + increment;
        const disabled = newUnits > item.maxUnits;
        console.log('isIncrementDisabled:', {
            productId: item.productId,
            units: item.units,
            maxUnits: item.maxUnits,
            newUnits,
            increment,
            disabled,
            unitType: item.unitType
        });
        return disabled;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Paper
                elevation={0}
                sx={{
                    mb: 2,
                    p: 2,
                    display: 'flex',
                    borderRadius: 2,
                    border: '1px solid #eaeaea',
                    overflow: 'hidden',
                    '&:hover': {
                        borderColor: '#d0d0d0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }
                }}
            >
                {/* Product Image */}
                <Box sx={{ width: { xs: 80, sm: 100 }, height: { xs: 80, sm: 100 }, mr: 2, position: 'relative' }}>
                    {item.base64Image ? (
                        <CardMedia
                            component="img"
                            image={`data:image/jpeg;base64,${item.base64Image}`}
                            alt={item.productName}
                            sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 1,
                            }}
                        />
                    ) : (
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: 1,
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">No image</Typography>
                        </Box>
                    )}
                </Box>

                {/* Product Details */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {item.productName}
                        </Typography>

                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => onRemove(item.productId)}
                            sx={{ ml: 1 }}
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Rs.{item.sellingPrice.toFixed(2)} each
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Tooltip title={item.units <= 0 ? "Remove from cart" : "Decrease units"}>
                                <IconButton
                                    size="small"
                                    onClick={handleDecrement}
                                    disabled={item.units <= (item.unitType === 'WEIGHT' ? 0.01 : 1)}
                                    sx={{
                                        backgroundColor: '#f5f5f5',
                                        '&:hover': { backgroundColor: '#e0e0e0' },
                                        borderRadius: '8px 0 0 8px',
                                    }}
                                >
                                    <Remove fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Box
                                sx={{
                                    px: 2,
                                    py: 0.5,
                                    minWidth: 40,
                                    textAlign: 'center',
                                    backgroundColor: '#f5f5f5',
                                    borderTop: '1px solid #f5f5f5',
                                    borderBottom: '1px solid #f5f5f5',
                                }}
                            >
                                <Typography>{item.unitType === 'WEIGHT' ? item.units.toFixed(2) : item.units}</Typography>
                            </Box>

                            <Tooltip title="Increase units">
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={handleIncrement}
                                        disabled={isIncrementDisabled()}
                                        sx={{
                                            backgroundColor: '#f5f5f5',
                                            '&:hover': { backgroundColor: '#e0e0e0' },
                                            borderRadius: '0 8px 8px 0',
                                        }}
                                    >
                                        <Add fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                            Rs.{itemSubtotal.toFixed(2)}
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </motion.div>
    );
};

export default CartItem;