import React, { useState } from 'react';
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
} from '@mui/material';
import { ShoppingCart, Favorite, FavoriteBorder, ZoomIn } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface Product {
    productId: number;
    productName: string;
    categoryName: string;
    sellingPrice: number;
    quantity: number;
    base64Image: string;
    description?: string;
    rating?: number;
}

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    cartQuantity: number;
    onAddToWishlist?: (product: Product) => void;
    isInWishlist?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
                                                     product,
                                                     onAddToCart,
                                                     cartQuantity,
                                                     onAddToWishlist,
                                                     isInWishlist = false,
                                                 }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [openQuickView, setOpenQuickView] = useState(false);

    const canAddToCart = cartQuantity < product.quantity;
    const isOutOfStock = product.quantity === 0;

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

                    {onAddToWishlist && (
                        <IconButton
                            sx={{
                                position: 'absolute',
                                top: 10,
                                left: 10,
                                zIndex: 2,
                                backgroundColor: 'rgba(255,255,255,0.8)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                }
                            }}
                            onClick={() => onAddToWishlist(product)}
                        >
                            {isInWishlist ? (
                                <Favorite color="error" />
                            ) : (
                                <FavoriteBorder />
                            )}
                        </IconButton>
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
                                <Typography variant="h6" sx={{ color: '#0478C0', fontWeight: 700 }}>
                                    Rs.{product.sellingPrice.toFixed(2)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {isOutOfStock ? (
                                        <span style={{ color: '#d32f2f' }}>Out of stock</span>
                                    ) : (
                                        <>Stock: {product.quantity}</>
                                    )}
                                </Typography>
                            </Box>

                            {cartQuantity > 0 && (
                                <Typography variant="body2" sx={{ mb: 1, color: '#0478C0' }}>
                                    In cart: {cartQuantity}
                                </Typography>
                            )}

                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<ShoppingCart />}
                                onClick={() => onAddToCart(product)}
                                disabled={isOutOfStock || !canAddToCart}
                                fullWidth
                                sx={{
                                    borderRadius: 8,
                                    py: 1,
                                    textTransform: 'none',
                                    boxShadow: 'none',
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

                            <Typography variant="h4" sx={{ color: '#0478C0', fontWeight: 700, mb: 2 }}>
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
                                    <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{product.quantity} in stock</span>
                                )}
                                </Typography>

                                {cartQuantity > 0 && (
                                    <Typography variant="body2" sx={{ mb: 2, color: '#0478C0' }}>
                                        Currently in your cart: {cartQuantity}
                                    </Typography>
                                )}

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<ShoppingCart />}
                                        onClick={() => onAddToCart(product)}
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
        </>
    );
};

export default ProductCard;