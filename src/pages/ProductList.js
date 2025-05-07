import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Grid,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Alert,
    Snackbar,
    InputAdornment,
    Container,
    Chip,
    Paper,
    IconButton,
    FormControlLabel,
    Switch,
    Pagination,
    Skeleton,
} from '@mui/material';
import { Search, FilterList, Close, ShoppingBag } from '@mui/icons-material';
import { CartContext } from '../CartContext';
import productServices from '../services/productServices';
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import EmptyState from '../components/EmptyState';

function ProductList() {
    const location = useLocation();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState(location.state?.success || '');
    const [open, setOpen] = useState(!!location.state?.success);
    const [sortOption, setSortOption] = useState('default');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [page, setPage] = useState(1);
    const { addToCart, cartItems, wishlistItems, toggleWishlistItem } = useContext(CartContext);

    const itemsPerPage = 6;

    useEffect(() => {
        // Simulate network request
        setLoading(true);
        productServices.getAllProducts()
            .then((response) => {
                // Add sample ratings for demonstration
                const productsWithRatings = response.data.map((product) => ({
                    ...product,
                    rating: Math.floor(Math.random() * 5) + 1,
                    description: generateSampleDescription(product.categoryName),
                }));
                setProducts(productsWithRatings);
                setFilteredProducts(productsWithRatings);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching products:', error);
                setLoading(false);
            });
    }, []);

    const generateSampleDescription = (category) => {
        const descriptions = {
            'Vegetables': [
                'Fresh and organic vegetables sourced locally. Rich in vitamins and minerals.',
                'High-quality vegetables from local farms. Perfect for healthy cooking.',
                'Farm-fresh vegetables harvested at peak ripeness for maximum flavor and nutrition.'
            ],
            'Fruits': [
                'Sweet and juicy fruits, perfect for a healthy snack or dessert.',
                'Seasonal fruits selected for optimal freshness and taste.',
                'Hand-picked fruits that are rich in nutrients and natural flavor.'
            ],
            'Dairy': [
                'Premium dairy products made from fresh milk from local farms.',
                'High-quality dairy products with rich, creamy texture and taste.',
                'Farm-fresh dairy products made using traditional methods for authentic taste.'
            ],
            'Bakery': [
                'Freshly baked goods made with premium ingredients.',
                'Artisanal bakery items made fresh daily using traditional recipes.',
                'Delicious baked goods made with organic flour and natural ingredients.'
            ],
            'Beverages': [
                'Refreshing beverages made with natural ingredients and no artificial additives.',
                'High-quality drinks to quench your thirst and refresh your day.',
                'Premium beverages with authentic flavors and carefully selected ingredients.'
            ],
            'Snacks': [
                'Delicious snacks perfect for any time of day.',
                'Premium quality snacks made with the finest ingredients.',
                'Tasty snack options for a quick energy boost or casual munching.'
            ],
        };

        // Default description if category not found
        const defaultDescriptions = [
            'High-quality product selected for optimal freshness and value.',
            'Premium product made with carefully chosen ingredients.',
            'Excellent quality product that meets our strict standards.'
        ];

        const categoryDescriptions = descriptions[category] || defaultDescriptions;
        return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
    };

    const sortOptions = [
        { label: 'Default', value: 'default' },
        { label: 'Price: Low to High', value: 'priceLow' },
        { label: 'Price: High to Low', value: 'priceHigh' },
        { label: 'Name: A to Z', value: 'nameAsc' },
        { label: 'Name: Z to A', value: 'nameDesc' },
    ];

    const categories = ['All', ...new Set(products.map(product => product.categoryName))];

    useEffect(() => {
        // Apply filtering and sorting
        let result = [...products];

        // Filter by search term
        if (searchTerm) {
            result = result.filter(product =>
                product.productName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== 'All') {
            result = result.filter(product => product.categoryName === selectedCategory);
        }

        // Filter by price range
        if (minPrice !== '') {
            result = result.filter(product => product.sellingPrice >= parseFloat(minPrice));
        }
        if (maxPrice !== '') {
            result = result.filter(product => product.sellingPrice <= parseFloat(maxPrice));
        }

        // Filter by stock
        if (inStockOnly) {
            result = result.filter(product => product.quantity > 0);
        }

        // Apply sorting
        switch (sortOption) {
            case 'priceLow':
                result.sort((a, b) => a.sellingPrice - b.sellingPrice);
                break;
            case 'priceHigh':
                result.sort((a, b) => b.sellingPrice - a.sellingPrice);
                break;
            case 'nameAsc':
                result.sort((a, b) => a.productName.localeCompare(b.productName));
                break;
            case 'nameDesc':
                result.sort((a, b) => b.productName.localeCompare(b.productName));
                break;
            default:
                // Default sorting (could be by popularity or featured)
                break;
        }

        setFilteredProducts(result);

        // Reset to first page when filters change
        setPage(1);
    }, [searchTerm, selectedCategory, products, sortOption, minPrice, maxPrice, inStockOnly]);

    const getCartQuantity = (productId) => {
        const cartItem = cartItems.find(item => item.productId === productId);
        return cartItem ? cartItem.quantity : 0;
    };

    const isInWishlist = (productId) => {
        return wishlistItems?.some(item => item.productId === productId) || false;
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
    };

    const handleSortChange = (event) => {
        setSortOption(event.target.value);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('All');
        setSortOption('default');
        setMinPrice('');
        setMaxPrice('');
        setInStockOnly(false);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
        // Scroll to top on page change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Pagination
    const paginatedProducts = filteredProducts.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);

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

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Snackbar
                open={open}
                autoHideDuration={5000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleClose}
                    severity="success"
                    sx={{ width: '100%', boxShadow: 3, borderRadius: 2 }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>

            <Box sx={{ mb: 4 }}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Typography
                        variant="h4"
                        gutterBottom
                        sx={{
                            color: '#0478C0',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            paddingTop: 2,
                        }}
                    >
                        <ShoppingBag /> Pre-Order Groceries
                    </Typography>

                    <Typography variant="body1" color="text.secondary" paragraph>
                        Browse our selection of fresh groceries and pre-order for pickup. Save time and avoid the queue!
                    </Typography>
                </motion.div>

                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                    <TextField
                        variant="outlined"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                                        <Close fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 2 }
                        }}
                    />

                    <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                            value={sortOption}
                            onChange={handleSortChange}
                            label="Sort By"
                            sx={{ borderRadius: 2 }}
                        >
                            {sortOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <IconButton
                        color={filtersOpen ? "primary" : "default"}
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        sx={{
                            border: 1,
                            borderColor: filtersOpen ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            display: { xs: 'flex', md: 'none' }
                        }}
                    >
                        <FilterList />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Box
                        sx={{
                            display: { xs: filtersOpen ? 'block' : 'none', md: 'block' },
                            width: { xs: '100%', md: 250 },
                            flexShrink: 0,
                        }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                border: '1px solid #eaeaea',
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Filters
                            </Typography>

                            <Divider sx={{ my: 1.5 }} />

                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Category
                            </Typography>
                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <Select
                                    value={selectedCategory}
                                    onChange={handleCategoryChange}
                                    displayEmpty
                                    sx={{ borderRadius: 2 }}
                                >
                                    {categories.map((category) => (
                                        <MenuItem key={category} value={category}>{category}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Typography variant="subtitle2" gutterBottom>
                                Price Range
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <TextField
                                    size="small"
                                    placeholder="Min"
                                    type="number"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                    fullWidth
                                />
                                <TextField
                                    size="small"
                                    placeholder="Max"
                                    type="number"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                    fullWidth
                                />
                            </Box>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={inStockOnly}
                                        onChange={(e) => setInStockOnly(e.target.checked)}
                                    />
                                }
                                label="In Stock Only"
                            />

                            <Divider sx={{ my: 1.5 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <IconButton
                                        onClick={handleClearFilters}
                                        color="primary"
                                        sx={{
                                            fontSize: '0.75rem',
                                            textTransform: 'none',
                                            backgroundColor: '#f0f7fd',
                                            '&:hover': {
                                                backgroundColor: '#e1f0fc',
                                            }
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ mr: 0.5 }}>Clear All</Typography>
                                        <Close fontSize="small" />
                                    </IconButton>
                                </motion.div>
                            </Box>
                        </Paper>
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" component="div">
                                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                            </Typography>

                            {(searchTerm || selectedCategory !== 'All' || minPrice || maxPrice || inStockOnly) && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {searchTerm && (
                                        <Chip
                                            label={`Search: ${searchTerm}`}
                                            onDelete={() => setSearchTerm('')}
                                            size="small"
                                        />
                                    )}

                                    {selectedCategory !== 'All' && (
                                        <Chip
                                            label={`Category: ${selectedCategory}`}
                                            onDelete={() => setSelectedCategory('All')}
                                            size="small"
                                        />
                                    )}

                                    {(minPrice || maxPrice) && (
                                        <Chip
                                            label={`Price: ${minPrice || '0'}-${maxPrice || '∞'}`}
                                            onDelete={() => { setMinPrice(''); setMaxPrice(''); }}
                                            size="small"
                                        />
                                    )}

                                    {inStockOnly && (
                                        <Chip
                                            label="In Stock Only"
                                            onDelete={() => setInStockOnly(false)}
                                            size="small"
                                        />
                                    )}
                                </Box>
                            )}
                        </Box>

                        {loading ? (
                            <Grid container spacing={3}>
                                {Array.from(new Array(6)).map((_, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <ProductSkeleton />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <>
                                {filteredProducts.length > 0 ? (
                                    <>
                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <Grid container spacing={3}>
                                                <AnimatePresence>
                                                    {paginatedProducts.map((product) => {
                                                        const cartQuantity = getCartQuantity(product.productId);

                                                        return (
                                                            <Grid item xs={12} sm={6} md={4} key={product.productId}>
                                                                <motion.div variants={itemVariants}>
                                                                    <ProductCard
                                                                        product={product}
                                                                        onAddToCart={() => addToCart(product)}
                                                                        cartQuantity={cartQuantity}
                                                                        onToggleWishlist={() => toggleWishlistItem(product)}
                                                                        isWishlisted={isInWishlist(product.productId)}
                                                                    />
                                                                </motion.div>
                                                            </Grid>
                                                        );
                                                    })}
                                                </AnimatePresence>
                                            </Grid>
                                        </motion.div>

                                        {pageCount > 1 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                                <Pagination
                                                    count={pageCount}
                                                    page={page}
                                                    onChange={handlePageChange}
                                                    color="primary"
                                                    sx={{
                                                        '& .MuiPaginationItem-root': {
                                                            borderRadius: 2,
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        )}
                                    </>
                                ) : (
                                    <EmptyState
                                        type="products"
                                        actionText="Clear Filters"
                                        onAction={handleClearFilters}
                                    />
                                )}
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}

export default ProductList;