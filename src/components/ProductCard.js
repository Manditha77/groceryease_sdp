import React, { useState, useContext, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Box,
    Chip,
    IconButton,
    Rating,
    Tooltip,
    CardActionArea,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    TextField,
} from '@mui/material';
import { ShoppingCart, Favorite, FavoriteBorder, ZoomIn } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { CartContext } from '../pages/CartContext';

interface Product {
    productId: number;
    productName: string;
    categoryName: string;
    sellingPrice: number;
    units: number;
    base64Image: string;
    description?: string;
    rating?: number;
    unitType: string;
}

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product, units?: number) => void;
    onAddToWishlist?: (product: Product) => void;
    isInWishlist?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
                                                     product,
                                                     onAddToCart,
                                                     onAddToWishlist,
                                                     isInWishlist = false,
                                                 }) => {
    const { cartItems } = useContext(CartContext);
    const [isHovered, setIsHovered] = useState(false);
    const [openQuickView, setOpenQuickView] = useState(false);
    const [openUnitsDialog, setOpenUnitsDialog] = useState(false);
    const [manualUnits, setManualUnits] = useState('');

    const cartQuantity = cartItems.find(item => item.productId === product.productId)?.units || 0;
    const canAddToCart = cartQuantity < product.units;
    const isOutOfStock = product.units <= 0;

    useEffect(() => {
        console.log(`ProductCard: cartItems updated for ${product.productName}:`, cartItems);
        console.log(`ProductCard: Current cartQuantity for ${product.productName}: ${cartQuantity}`);
    }, [cartItems, product.productName, cartQuantity]);

    const handleAddToCart = () => {
        console.log(`ProductCard: Attempting to add to cart: ${product.productName}, Type: ${product.unitType}, Current units in cart: ${cartQuantity}, Available stock: ${product.units}`);
        if (product.unitType === 'WEIGHT') {
            setOpenUnitsDialog(true);
        } else {
            const newUnits = cartQuantity + 1;
            if (newUnits <= product.units) {
                console.log(`ProductCard: Adding DISCRETE product with units: ${newUnits}`);
                onAddToCart(product, newUnits);
            } else {
                console.log(`ProductCard: Cannot add more units for DISCRETE product. Max units: ${product.units}`);
            }
        }
    };

    const handleConfirmUnits = () => {
        let units = parseFloat(manualUnits);
        if (isNaN(units) || units <= 0) {
            units = 0.25; // Default to minimum if invalid
        } else {
            units = Math.max(0.25, Math.round(units * 100) / 100); // Round to two decimal places
        }

        console.log(`ProductCard: Confirming units for WEIGHT product: Entered units: ${units}, Available stock: ${product.units}, Current cart units: ${cartQuantity}`);

        if (units <= product.units) {
            console.log(`ProductCard: Adding WEIGHT product with units: ${units}`);
            onAddToCart(product, units); // Pass product and units as separate arguments
            setOpenUnitsDialog(false);
            setManualUnits('');
        } else {
            console.log(`ProductCard: Cannot add ${units} units for WEIGHT product. Max available: ${product.units}`);
            alert(`Cannot add ${units} units. Only ${product.units} units available in stock.`);
        }
    };

    const handleUnitsChange = (e) => {
        const value = e.target.value;
        const regex = /^(\d+)?(\.\d{0,2})?$/;
        if (regex.test(value) || value === '') {
            setManualUnits(value);
        }
    };

    return (
        <>
            <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
            >
                <Card
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {isOutOfStock && (
                        <Chip
                            label="Out of Stock"
                            color="error"
                            size="small"
                            sx={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                zIndex: 2,
                                opacity: 0.9,
                            }}
                        />
                    )}

                    <CardActionArea onClick={() => setOpenQuickView(true)}>
                        <Box sx={{ position: 'relative', overflow: 'hidden', paddingTop: '75%' }}>
                            {product.base64Image && (
                                <CardMedia
                                    component="img"
                                    image={`data:image/jpeg;base64,${product.base64Image}`}
                                    alt={product.productName}
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.5s ease',
                                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                                    }}
                                />
                            )}

                            {isHovered && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <Tooltip title="Quick View">
                                        <IconButton
                                            sx={{ backgroundColor: 'white' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenQuickView(true);
                                            }}
                                        >
                                            <ZoomIn />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )}
                        </Box>
                    </CardActionArea>

                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ mb: 1 }}>
                            <Chip
                                label={product.categoryName}
                                size="small"
                                sx={{
                                    backgroundColor: '#e8f4fd',
                                    color: '#0478C0',
                                    fontSize: '0.7rem',
                                    height: 20,
                                }}
                            />
                        </Box>

                        <Typography variant="h6" component="h2" sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.2,
                            height: '2.4em',
                        }}>
                            {product.productName}
                        </Typography>

                        {product.rating && (
                            <Rating
                                value={product.rating}
                                readOnly
                                precision={0.5}
                                size="small"
                                sx={{ mb: 1 }}
                            />
                        )}

                        <Box sx={{ mt: 'auto', pt: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" sx={{ color: '#108015', fontWeight: 700 }}>
                                    Rs.{product.sellingPrice.toFixed(2)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {isOutOfStock ? (
                                        <span style={{ color: '#d32f2f' }}>Out of stock</span>
                                    ) : (
                                        <>Stock: {product.unitType === 'WEIGHT' ? product.units.toFixed(2) : product.units}</>
                                    )}
                                </Typography>
                            </Box>

                            {cartQuantity > 0 && (
                                <Typography variant="body2" sx={{ mb: 1, color: '#549a54' }}>
                                    In cart: {product.unitType === 'WEIGHT' ? cartQuantity.toFixed(2) : cartQuantity}
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<ShoppingCart />}
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock || !canAddToCart}
                                    fullWidth
                                    sx={{
                                        borderRadius: 8,
                                        py: 1,
                                        textTransform: 'none',
                                        boxShadow: 'none',
                                        bgcolor: '#549a54',
                                        '&:hover': {
                                            boxShadow: '0 4px 8px rgba(4, 120, 192, 0.2)',
                                        }
                                    }}
                                >
                                    {isOutOfStock
                                        ? 'Out of Stock'
                                        : !canAddToCart
                                            ? 'Max Limit Reached'
                                            : 'Add to Cart'}
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </motion.div>

            <Dialog
                open={openQuickView}
                onClose={() => setOpenQuickView(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {product.productName}
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpenQuickView(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                        }}
                    >
                        ×
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: '50%' } }}>
                            {product.base64Image && (
                                <CardMedia
                                    component="img"
                                    image={`data:image/jpeg;base64,${product.base64Image}`}
                                    alt={product.productName}
                                    sx={{ borderRadius: 1, objectFit: 'contain', maxHeight: 400 }}
                                />
                            )}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                                {product.productName}
                            </Typography>

                            <Chip
                                label={product.categoryName}
                                size="small"
                                sx={{ mb: 2, backgroundColor: '#e8f4fd', color: '#0478C0' }}
                            />

                            {product.rating && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Rating value={product.rating} readOnly precision={0.5} />
                                    <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                                        ({product.rating.toFixed(1)})
                                    </Typography>
                                </Box>
                            )}

                            <Typography variant="h4" sx={{ color: '#2e7d32', fontWeight: 700, mb: 2 }}>
                                Rs.{product.sellingPrice.toFixed(2)}
                            </Typography>

                            <Typography variant="body1" paragraph>
                                {product.description || 'No description available for this product.'}
                            </Typography>

                            <Box sx={{ mt: 3 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Availability: {isOutOfStock ? (
                                    <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>Out of stock</span>
                                ) : (
                                    <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                        {product.unitType === 'WEIGHT' ? product.units.toFixed(2) : product.units} in stock
                                    </span>
                                )}
                                </Typography>

                                {cartQuantity > 0 && (
                                    <Typography variant="body2" sx={{ mb: 2, color: '#2e7d32' }}>
                                        Currently in your cart: {product.unitType === 'WEIGHT' ? cartQuantity.toFixed(2) : cartQuantity}
                                    </Typography>
                                )}

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<ShoppingCart />}
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock || !canAddToCart}
                                        sx={{
                                            borderRadius: 8,
                                            py: 1.5,
                                            px: 3,
                                            flex: 2,
                                            textTransform: 'none',
                                        }}
                                    >
                                        {isOutOfStock
                                            ? 'Out of Stock'
                                            : !canAddToCart
                                                ? 'Max Limit Reached'
                                                : 'Add to Cart'}
                                    </Button>

                                    {onAddToWishlist && (
                                        <Button
                                            variant="outlined"
                                            color={isInWishlist ? "error" : "primary"}
                                            startIcon={isInWishlist ? <Favorite /> : <FavoriteBorder />}
                                            onClick={() => onAddToWishlist(product)}
                                            sx={{
                                                borderRadius: 8,
                                                py: 1.5,
                                                flex: 1,
                                                textTransform: 'none',
                                            }}
                                        >
                                            {isInWishlist ? 'Saved' : 'Save'}
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenQuickView(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openUnitsDialog}
                onClose={() => { setOpenUnitsDialog(false); setManualUnits(''); }}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Enter Units for {product.productName}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Units (e.g., 1.24, 1.45)"
                        type="text"
                        fullWidth
                        value={manualUnits}
                        onChange={handleUnitsChange}
                        inputProps={{
                            step: 0.01,
                            min: 0.25,
                        }}
                        helperText="Enter units with up to two decimal places (min 0.25)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setOpenUnitsDialog(false); setManualUnits(''); }}>Cancel</Button>
                    <Button onClick={handleConfirmUnits} color="primary">Add to Cart</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ProductCard;