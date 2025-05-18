import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Divider,
    Button,
    List,
    ListItem,
    ListItemText,
    Collapse,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface CartItem {
    productId: number;
    productName: string;
    sellingPrice: number;
    quantity: number;
}

interface OrderSummaryProps {
    cartItems: CartItem[];
    showItemsList?: boolean;
    showActionButton?: boolean;
    actionButtonText?: string;
    onAction?: () => void;
    isCheckout?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
                                                       cartItems,
                                                       showItemsList = true,
                                                       showActionButton = true,
                                                       actionButtonText = 'Proceed to Checkout',
                                                       onAction,
                                                       isCheckout = false,
                                                   }) => {
    const [expanded, setExpanded] = React.useState(false);

    // Calculate subtotal
    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.sellingPrice * item.quantity,
        0
    );

    // Total equals subtotal (no tax)
    const total = subtotal;

    // Set estimated pickup to today (May 08, 2025)
    const formattedDate = 'May 16, 2025';

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid #eaeaea',
                position: isCheckout ? 'sticky' : 'static',
                top: isCheckout ? 24 : 'auto',
            }}
        >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Order Summary
            </Typography>

            {showItemsList && cartItems.length > 0 && (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                        </Typography>
                        <Button
                            size="small"
                            endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                            onClick={() => setExpanded(!expanded)}
                            sx={{ textTransform: 'none', py: 0 }}
                        >
                            {expanded ? 'Hide details' : 'Show details'}
                        </Button>
                    </Box>

                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <List disablePadding sx={{ mt: 1, mb: 2 }}>
                            {cartItems.map((item) => (
                                <ListItem key={item.productId} sx={{ py: 0.5, px: 0 }}>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                {item.productName} × {item.quantity}
                                            </Typography>
                                        }
                                    />
                                    <Typography variant="body2">
                                        Rs.{(item.sellingPrice * item.quantity).toFixed(2)}
                                    </Typography>
                                </ListItem>
                            ))}
                        </List>
                        <Divider sx={{ my: 1 }} />
                    </Collapse>
                </>
            )}

            <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2">Rs.{subtotal.toFixed(2)}</Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0478C0' }}>
                        Rs.{total.toFixed(2)}
                    </Typography>
                </Box>

                {!isCheckout && (
                    <Box sx={{ backgroundColor: '#f8f8f8', p: 1.5, borderRadius: 1, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Estimated pickup by:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {formattedDate}
                        </Typography>
                    </Box>
                )}

                {showActionButton && (
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={onAction}
                        size="large"
                        sx={{
                            mt: 1,
                            py: 1.5,
                            borderRadius: 8,
                            textTransform: 'none',
                            fontWeight: 'medium'
                        }}
                    >
                        {actionButtonText}
                    </Button>
                )}
            </Box>
        </Paper>
    );
};

export default OrderSummary;