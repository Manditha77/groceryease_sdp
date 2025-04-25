import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
} from '@mui/material';
import { CartContext } from '../CartContext';
import productServices from '../services/productServices';

function ProductList() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const { addToCart, cartItems } = useContext(CartContext);

    useEffect(() => {
        productServices.getAllProducts().then((response) => {
            setProducts(response.data);
            setFilteredProducts(response.data);
        }).catch((error) => {
            console.error('Error fetching products:', error);
        });
    }, []);

    const categories = ['All', ...new Set(products.map(product => product.categoryName))];

    useEffect(() => {
        let filtered = products;
        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.productName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(product => product.categoryName === selectedCategory);
        }
        setFilteredProducts(filtered);
    }, [searchTerm, selectedCategory, products]);

    const getCartQuantity = (productId) => {
        const cartItem = cartItems.find(item => item.productId === productId);
        return cartItem ? cartItem.quantity : 0;
    };

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                Pre-Order Groceries
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center' }}>
                <FormControl sx={{ width: '30%' }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        label="Category"
                    >
                        {categories.map((category) => (
                            <MenuItem key={category} value={category}>{category}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    variant="outlined"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: '50%', backgroundColor: 'white', borderRadius: 1 }}
                />
            </Box>
            <Divider sx={{ mb: 4 }} />
            <Grid container spacing={3}>
                {filteredProducts.map((product) => {
                    const cartQuantity = getCartQuantity(product.productId);
                    const canAddToCart = cartQuantity < product.quantity;

                    return (
                        <Grid item xs={12} sm={6} md={4} key={product.productId}>
                            <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                                {product.base64Image && (
                                    <CardMedia
                                        component="img"
                                        height="160"
                                        image={`data:image/jpeg;base64,${product.base64Image}`}
                                        alt={product.productName}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                )}
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        {product.productName}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {product.categoryName}
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: '#0478C0', mt: 1 }}>
                                        Rs.{product.sellingPrice}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        In stock: {product.quantity}
                                    </Typography>
                                    {cartQuantity > 0 && (
                                        <Typography variant="body2" color="textSecondary">
                                            In cart: {cartQuantity}
                                        </Typography>
                                    )}
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => addToCart(product)}
                                        disabled={product.quantity === 0 || !canAddToCart}
                                        sx={{ mt: 2, width: '100%' }}
                                    >
                                        {product.quantity === 0
                                            ? 'Out of Stock'
                                            : !canAddToCart
                                                ? 'Stock Limit Reached'
                                                : 'Add to Cart'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}

export default ProductList;