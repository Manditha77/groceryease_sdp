import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Snackbar, Alert, Grid, Card, CardContent, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ShoppingCart, People, LocalShipping, Report } from '@mui/icons-material';
import productService from '../services/productServices';
import authService from '../services/authService';

const Dashboard = () => {
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.success || '');
    const [open, setOpen] = useState(!!location.state?.success);
    const navigate = useNavigate();

    // State for dynamic data
    const [inventoryCount, setInventoryCount] = useState(0);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [employeeCount, setEmployeeCount] = useState(0);
    const [supplierCount, setSupplierCount] = useState(0);
    const [lowStockProducts, setLowStockProducts] = useState([]);

    useEffect(() => {
        if (location.state?.success) {
            setTimeout(() => setOpen(false), 3000); // Hide Snackbar after 3 seconds
        }
    }, [location.state]);

    useEffect(() => {
        // Fetch inventory data
        const fetchInventoryData = async () => {
            try {
                const response = await productService.getAllProducts();
                const products = response.data;

                setInventoryCount(products.length);
                setLowStockCount(products.filter(product => product.quantity < 10).length); // Example threshold
            } catch (error) {
                console.error('Error fetching inventory data:', error);
            }
        };

        // Fetch employee data
        const fetchEmployeeData = async () => {
            try {
                const employees = await authService.getEmployees(); // Assuming this method exists
                setEmployeeCount(employees.length);
            } catch (error) {
                console.error('Error fetching employee data:', error);
            }
        };

        // Fetch supplier data
        const fetchSupplierData = async () => {
            try {
                const suppliers = await authService.getSuppliers(); // Assuming this method exists
                setSupplierCount(suppliers.length);
            } catch (error) {
                console.error('Error fetching supplier data:', error);
            }
        };

        const fetchLowStockProducts = async () => {
            try {
                const response = await productService.getAllProducts();
                const products = response.data;

                const lowStock = products.filter(product => product.quantity < 10); // Example threshold
                setLowStockProducts(lowStock);
            } catch (error) {
                console.error('Error fetching low stock products:', error);
            }
        };

        fetchInventoryData();
        fetchEmployeeData();
        fetchSupplierData();
        fetchLowStockProducts();
    }, []);

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            {/* Success Snackbar */}
            <Snackbar open={open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                Dashboard
            </Typography>

            {/* Grid Layout */}
            <Grid container spacing={3}>
                {/* Inventory Overview */}
                <Grid item xs={12} md={6} lg={3}>
                    <Card sx={{ bgcolor: '#E3F2FD', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#1565C0', fontWeight: 'bold' }}>
                                Inventory Overview
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#1E88E5', fontWeight: 'bold' }}>
                                {inventoryCount}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#1565C0' }}>
                                Total Products
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#FF6F00' }}>
                                Low Stock: {lowStockCount}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Employee Overview */}
                <Grid item xs={12} md={6} lg={3}>
                    <Card sx={{ bgcolor: '#E8F5E9', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                                Employees
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#43A047', fontWeight: 'bold' }}>
                                {employeeCount}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#2E7D32' }}>
                                Total Employees
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Supplier Overview */}
                <Grid item xs={12} md={6} lg={3}>
                    <Card sx={{ bgcolor: '#FFF3E0', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#EF6C00', fontWeight: 'bold' }}>
                                Suppliers
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#FB8C00', fontWeight: 'bold' }}>
                                {supplierCount}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#EF6C00' }}>
                                Active Suppliers
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Reports */}
                <Grid item xs={12} md={6} lg={3}>
                    <Card sx={{ bgcolor: '#FCE4EC', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#C2185B', fontWeight: 'bold' }}>
                                Reports
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#E91E63', fontWeight: 'bold' }}>
                                10
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#C2185B' }}>
                                Generated Reports
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Box sx={{ marginTop: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                    Quick Actions
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Button
                            variant="contained"
                            startIcon={<ShoppingCart />}
                            sx={{ width: '100%', height: 60, bgcolor: '#1E88E5', color: '#fff', fontWeight: 'bold' }}
                            onClick={() => navigate('/inventory')}
                        >
                            Add New Product
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button
                            variant="contained"
                            startIcon={<People />}
                            sx={{ width: '100%', height: 60, bgcolor: '#43A047', color: '#fff', fontWeight: 'bold' }}
                            onClick={() => navigate('/manage-employees')}
                        >
                            Manage Employees
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button
                            variant="contained"
                            startIcon={<LocalShipping />}
                            sx={{ width: '100%', height: 60, bgcolor: '#FB8C00', color: '#fff', fontWeight: 'bold' }}
                            onClick={() => navigate('/manage-suppliers')}
                        >
                            Manage Suppliers
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ marginTop: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ color: '#FF6F00', fontWeight: 'bold' }}>
                    Low Stock Products
                </Typography>
                {lowStockProducts.length > 0 ? (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product Name</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Category</TableCell>
                                    <TableCell align="right">Company</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {lowStockProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>{product.productName}</TableCell>
                                        <TableCell align="right">{product.quantity}</TableCell>
                                        <TableCell align="right">{product.categoryName}</TableCell>
                                        <TableCell align="right">{product.supplierCompanyName}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Typography variant="body1" sx={{ color: '#757575' }}>
                        No products are running low on stock.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default Dashboard;