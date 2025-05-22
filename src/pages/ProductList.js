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
    Button,
    Skeleton,
    CardMedia,
} from '@mui/material';
import { Search, FilterList, Close, ShoppingBag } from '@mui/icons-material';
import { CartContext } from './CartContext';
import productServices from '../services/productServices';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import EmptyState from '../components/EmptyState';
import logo from '../images/Rectangle 4139.png';

function ProductList() {
    const location = useLocation();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState(location.state?.success || '');
    const [errorMessage, setErrorMessage] = useState('');
    const [openSuccess, setOpenSuccess] = useState(!!location.state?.success);
    const [openError, setOpenError] = useState(false);
    const [sortOption, setSortOption] = useState('default');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [page, setPage] = useState(1);
    const { addToCart, cartItems, wishlistItems, toggleWishlistItem } = useContext(CartContext);
    const authToken = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');

    const itemsPerPage = 6;

    useEffect(() => {
        setLoading(true);
        productServices.getAllProducts()
            .then((response) => {
                const productsWithDescriptions = response.data.map((product) => ({
                    ...product,
                    description: generateSampleDescription(product.categoryName),
                }));
                setProducts(productsWithDescriptions);
                setFilteredProducts(productsWithDescriptions);
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
                'Farm-fresh vegetables harvested at peak ripeness for maximum flavor and nutrition.',
            ],
            'Fruits': [
                'Sweet and juicy fruits, perfect for a healthy snack or dessert.',
                'Seasonal fruits selected for optimal freshness and taste.',
                'Hand-picked fruits that are rich in nutrients and natural flavor.',
            ],
            'Dairy': [
                'Premium dairy products made from fresh milk from local farms.',
                'High-quality dairy products with rich, creamy texture and taste.',
                'Farm-fresh dairy products made using traditional methods for authentic taste.',
            ],
            'Bakery': [
                'Freshly baked goods made with premium ingredients.',
                'Artisanal bakery items made fresh daily using traditional recipes.',
                'Delicious baked goods made with organic flour and natural ingredients.',
            ],
            'Beverages': [
                'Refreshing beverages made with natural ingredients and no artificial additives.',
                'High-quality drinks to quench your thirst and refresh your day.',
                'Premium beverages with authentic flavors and carefully selected ingredients.',
            ],
            'Snacks': [
                'Delicious snacks perfect for any time of day.',
                'Premium quality snacks made with the finest ingredients.',
                'Tasty snack options for a quick energy boost or calm munching.',
            ],
        };

        const defaultDescriptions = [
            'High-quality product selected for optimal freshness and value.',
            'Premium product made with carefully chosen ingredients.',
            'Excellent quality product that meets our strict standards.',
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
        let result = [...products];

        if (searchTerm) {
            result = result.filter(product =>
                product.productName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategory !== 'All') {
            result = result.filter(product => product.categoryName === selectedCategory);
        }

        if (minPrice !== '') {
            result = result.filter(product => product.sellingPrice >= parseFloat(minPrice));
        }
        if (maxPrice !== '') {
            result = result.filter(product => product.sellingPrice <= parseFloat(maxPrice));
        }

        if (inStockOnly) {
            result = result.filter(product => product.units > 0);
        }

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
                break;
        }

        setFilteredProducts(result);
        setPage(1);
    }, [searchTerm, selectedCategory, products, sortOption, minPrice, maxPrice, inStockOnly]);

    const isInWishlist = (productId) => {
        return wishlistItems?.some(item => item.productId === productId) || false;
    };

    const handleAddToCart = (product, units) => {
        if (!authToken || userType !== 'CUSTOMER') {
            setErrorMessage('Please log in to add items to your cart.');
            setOpenError(true);
            return;
        }

        console.log(`ProductList: handleAddToCart called - Product: ${product.productName}, Units: ${units}, Unit Type: ${product.unitType}`);

        let newUnits;
        if (product.unitType === 'WEIGHT') {
            if (units === undefined) {
                console.log('ProductList: Units undefined for WEIGHT product, expecting dialog to handle');
                return; // Dialog will handle WEIGHT products
            }
            newUnits = units; // Use the units provided by the dialog
        } else {
            newUnits = (cartItems.find(item => item.productId === product.productId)?.units || 0) + 1;
        }

        if (newUnits <= product.units) {
            console.log(`ProductList: Adding product to cart with units: ${newUnits}`);
            addToCart(product, newUnits);
            setSuccessMessage(`${product.productName} added to cart with ${product.unitType === 'WEIGHT' ? newUnits.toFixed(2) : newUnits} units!`);
            setOpenSuccess(true);
        } else {
            console.log(`ProductList: Cannot add product. Requested units (${newUnits}) exceed stock (${product.units})`);
            setSuccessMessage(`Cannot add ${product.productName}. Only ${product.units} units in stock.`);
            setOpenSuccess(true);
        }
    };

    const handleToggleWishlist = (product) => {
        if (!authToken || userType !== 'CUSTOMER') {
            setErrorMessage('Please log in to manage your wishlist.');
            setOpenError(true);
            return;
        }
        toggleWishlistItem(product);
    };

    const handleCloseSuccess = () => {
        setOpenSuccess(false);
    };

    const handleCloseError = () => {
        setOpenError(false);
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4, mt: 8 }}>
            {/* Success Snackbar */}
            <Snackbar
                open={openSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSuccess}
                    severity="success"
                    sx={{ width: '100%', boxShadow: 3, borderRadius: 2, bgcolor: '#E8F5E9' }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={openError}
                autoHideDuration={3000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseError}
                    severity="warning"
                    sx={{ width: '100%', boxShadow: 3, borderRadius: 2, bgcolor: '#FFF3E0' }}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>

            <Box
                sx={{
                    bgcolor: '#E8F5E9',
                    borderRadius: 2,
                    p: 4,
                    mb: 4,
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Typography
                    variant="h3"
                    color="#2E7D32"
                    fontWeight="bold"
                    sx={{ mb: 2, textShadow: '1px 1px 3px rgba(0, 0, 0, 0.1)', zIndex: 1 }}
                >
                    Discover Fresh Groceries
                </Typography>
                <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ maxWidth: '600px', mx: 'auto', mb: 2, zIndex: 1 }}
                >
                    Pre-order your favorite groceries and enjoy a seamless shopping experience with fast pickup options!
                </Typography>
                <CardMedia
                    component="img"
                    image={logo}
                    alt="GroceryEase Logo"
                    sx={{
                        mt: 2,
                        borderRadius: 1,
                        objectFit: 'contain',
                        height: 200,
                        width: '100%',
                        maxWidth: 400,
                        mx: 'auto',
                        zIndex: 1,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(45deg, rgba(76, 175, 80, 0.1) 0%, transparent 70%)',
                        clipPath: 'polygon(0 0, 50% 0, 30% 100%, 0 100%)',
                        zIndex: 0,
                    }}
                />
            </Box>

            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        variant="outlined"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        fullWidth
                        sx={{ maxWidth: 400 }}
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
                            sx: { borderRadius: 2, bgcolor: '#FFFFFF', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
                        }}
                    />

                    <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                            value={sortOption}
                            onChange={handleSortChange}
                            label="Sort By"
                            sx={{ borderRadius: 2, bgcolor: '#FFFFFF', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
                        >
                            {sortOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <IconButton
                        color={filtersOpen ? 'primary' : 'default'}
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        sx={{
                            border: 1,
                            borderColor: filtersOpen ? 'primary.main' : '#E0E0E0',
                            borderRadius: 2,
                            p: 1,
                            bgcolor: '#FFFFFF',
                            '&:hover': { bgcolor: '#F5F5F5' },
                            display: { xs: 'flex', md: 'none' },
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
                            elevation={3}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                bgcolor: '#FAFAFA',
                                transition: 'all 0.3s ease',
                                '&:hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' },
                            }}
                        >
                            <Typography variant="h6" fontWeight="bold" color="#2E7D32" gutterBottom>
                                Filters
                            </Typography>

                            <Divider sx={{ my: 2, borderColor: '#E0E0E0' }} />

                            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, color: '#424242' }}>
                                Category
                            </Typography>
                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <Select
                                    value={selectedCategory}
                                    onChange={handleCategoryChange}
                                    displayEmpty
                                    sx={{ borderRadius: 2, bgcolor: '#FFFFFF' }}
                                >
                                    {categories.map((category) => (
                                        <MenuItem key={category} value={category}>
                                            {category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Typography variant="subtitle1" gutterBottom sx={{ color: '#424242' }}>
                                Price Range
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <TextField
                                    size="small"
                                    placeholder="Min"
                                    type="number"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    InputProps={{ sx: { borderRadius: 2, bgcolor: '#FFFFFF' } }}
                                    fullWidth
                                />
                                <TextField
                                    size="small"
                                    placeholder="Max"
                                    type="number"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    InputProps={{ sx: { borderRadius: 2, bgcolor: '#FFFFFF' } }}
                                    fullWidth
                                />
                            </Box>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={inStockOnly}
                                        onChange={(e) => setInStockOnly(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label={<Typography color="#424242">In Stock Only</Typography>}
                            />

                            <Divider sx={{ my: 2, borderColor: '#E0E0E0' }} />

                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleClearFilters}
                                        sx={{
                                            textTransform: 'none',
                                            bgcolor: '#2E7D32',
                                            '&:hover': { bgcolor: '#1B5E20' },
                                            borderRadius: 2,
                                        }}
                                    >
                                        Clear All
                                    </Button>
                                </motion.div>
                            </Box>
                        </Paper>
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" component="div" color="#2E7D32">
                                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Found
                            </Typography>

                            {(searchTerm || selectedCategory !== 'All' || minPrice || maxPrice || inStockOnly) && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {searchTerm && (
                                        <Chip
                                            label={`Search: ${searchTerm}`}
                                            onDelete={() => setSearchTerm('')}
                                            size="small"
                                            sx={{ bgcolor: '#E8F5E9', color: '#2E7D32' }}
                                        />
                                    )}

                                    {selectedCategory !== 'All' && (
                                        <Chip
                                            label={`Category: ${selectedCategory}`}
                                            onDelete={() => setSelectedCategory('All')}
                                            size="small"
                                            sx={{ bgcolor: '#E8F5E9', color: '#2E7D32' }}
                                        />
                                    )}

                                    {(minPrice || maxPrice) && (
                                        <Chip
                                            label={`Price: ${minPrice || '0'}-${maxPrice || '∞'}`}
                                            onDelete={() => { setMinPrice(''); setMaxPrice(''); }}
                                            size="small"
                                            sx={{ bgcolor: '#E8F5E9', color: '#2E7D32' }}
                                        />
                                    )}

                                    {inStockOnly && (
                                        <Chip
                                            label="In Stock Only"
                                            onDelete={() => setInStockOnly(false)}
                                            size="small"
                                            sx={{ bgcolor: '#E8F5E9', color: '#2E7D32' }}
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
                                                    {paginatedProducts.map((product) => (
                                                        <Grid item xs={12} sm={6} md={4} key={product.productId}>
                                                            <motion.div variants={itemVariants}>
                                                                <ProductCard
                                                                    product={product}
                                                                    onAddToCart={handleAddToCart}
                                                                    onAddToWishlist={handleToggleWishlist}
                                                                    isInWishlist={isInWishlist(product.productId)}
                                                                />
                                                            </motion.div>
                                                        </Grid>
                                                    ))}
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
                                                            bgcolor: '#FFFFFF',
                                                            '&:hover': { bgcolor: '#E8F5E9' },
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