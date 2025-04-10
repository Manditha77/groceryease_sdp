import React, { useEffect, useState } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Grid, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Snackbar, Alert } from "@mui/material";
import productServices from "../services/productServices";
import categoryService from "../services/categoryService";

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        productName: '',
        categoryName: '',
        quantity: '',
        buyingPrice: '',
        sellingPrice: '',
        supplierCompanyName: ''
    });
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        productServices.getAllProducts().then(response => {
            setProducts(response.data);
        });
    }, []);

    useEffect(() => {
        categoryService.getAllCategories().then(response => {
            setCategories(response.data);
        });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    }

    const handleOpenDeleteDialog = (productId) => {
        setSelectedProductId(productId);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSelectedProductId(null);
    };

    const handleConfirmDelete = async () => {
        try {
            await productServices.deleteProduct(selectedProductId);
            const updatedProducts = products.filter((product) => product.productId !== selectedProductId);
            setProducts(updatedProducts);
            setSnackbarMessage('Product deleted successfully');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error deleting product:', error);
        } finally {
            handleCloseDeleteDialog();
        }
    };

    const handleOpenRegisterDialog = () => {
        setRegisterDialogOpen(true);
    };

    const handleCloseRegisterDialog = () => {
        setRegisterDialogOpen(false);
    };

    const handleConfirmRegisterProduct = async () => {
        try {
            const newProduct = {
                productName: formData.productName,
                categoryName: formData.categoryName,
                quantity: formData.quantity,
                buyingPrice: formData.buyingPrice,
                sellingPrice: formData.sellingPrice,
                supplierCompanyName: formData.supplierCompanyName
            };
            const response = await productServices.addProduct(newProduct);
            setProducts([...products, response.data]);
            setSnackbarMessage('Product added successfully');
            setSnackbarOpen(true);
            setFormData({
                productName: '',
                categoryName: '',
                quantity: '',
                buyingPrice: '',
                sellingPrice: '',
                supplierCompanyName: ''
            });
        } catch (error) {
            console.error('Error adding product:', error);
        } finally {
            handleCloseRegisterDialog();
        }
    };

    const handleUpdateProduct = (productId) => {
        const product = products.find((product) => product.productId === productId);
        setFormData({
            productName: product.productName,
            categoryName: product.categoryName,
            quantity: product.quantity,
            buyingPrice: product.buyingPrice,
            sellingPrice: product.sellingPrice,
            supplierCompanyName: product.supplierCompanyName
        });
        setSelectedProductId(productId);
        setIsEditMode(true);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const handleOpenUpdateDialog = () => {
        setUpdateDialogOpen(true);
    }

    const handleCloseUpdateDialog = () => {
        setUpdateDialogOpen(false);
        setSelectedProductId(null);
        setIsEditMode(false);
    };

    const handleConfirmUpdateProduct = async () => {
        try {
            const updatedProduct = {
                productName: formData.productName,
                categoryName: formData.categoryName,
                quantity: formData.quantity,
                buyingPrice: formData.buyingPrice,
                sellingPrice: formData.sellingPrice,
                supplierCompanyName: formData.supplierCompanyName
            };
            const response = await productServices.updateProduct(selectedProductId, updatedProduct);
            const updatedProducts = products.map((product) =>
                product.productId === selectedProductId ? response.data : product
            );
            setProducts(updatedProducts);
            setSnackbarMessage('Product updated successfully');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error updating product:', error);
        } finally {
            handleCloseUpdateDialog();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            <Box>
                <Typography variant="h4" gutterBottom sx={{ color: '#0478C0' }}>
                    Inventory
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Product ID</TableCell>
                                <TableCell>Product Name</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Buying Price</TableCell>
                                <TableCell>Selling Price</TableCell>
                                <TableCell>Supplier</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.productId}>
                                    <TableCell>{product.productId}</TableCell>
                                    <TableCell>{product.productName}</TableCell>
                                    <TableCell>{product.categoryName}</TableCell>
                                    <TableCell>{product.quantity}</TableCell>
                                    <TableCell>{product.buyingPrice}</TableCell>
                                    <TableCell>{product.sellingPrice}</TableCell>
                                    <TableCell>{product.supplierCompanyName}</TableCell>
                                    <TableCell>
                                        <Button variant="contained" style={{ marginRight: 8 }} sx={{ bgcolor: '#007bff' }} onClick={() => handleUpdateProduct(product.productId)}>Edit</Button>
                                        <Button variant="contained" sx={{ bgcolor: '#dc3545' }} onClick={() => handleOpenDeleteDialog(product.productId)}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box sx={{ paddingTop: 5 }}>
                <Typography variant="h4" gutterBottom sx={{ color: '#0478C0' }}>
                    {isEditMode ? 'Update Product' : 'Add New Product'}
                </Typography>
                <Paper elevation={3} sx={{ padding: 4, marginTop: 2 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" align="center" sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}>
                                Product Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Product Name" name="productName" value={formData.productName} onChange={handleChange} variant="outlined" required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Category" name="categoryName" value={formData.categoryName} onChange={handleChange} variant="outlined" required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Quantity" name="quantity" value={formData.quantity} onChange={handleChange} variant="outlined" required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Buying Price" name="buyingPrice" value={formData.buyingPrice} onChange={handleChange} variant="outlined" required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Selling Price" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} variant="outlined" required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Supplier" name="supplierCompanyName" value={formData.supplierCompanyName} onChange={handleChange} variant="outlined" required />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                        <Button
                            variant="contained"
                            style={{ background: '#007bff', textTransform: 'none', width: '200px', height: '50px', fontSize: '19px' }}
                            onClick={isEditMode ? handleOpenUpdateDialog : handleOpenRegisterDialog}
                            size="large"
                        >
                            {isEditMode ? 'Update Product' : 'Add Product'}
                        </Button>
                    </Grid>
                </Paper>
            </Box>

            <Box>
                <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', paddingTop: 5 }}>
                    Categories
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Category ID</TableCell>
                                <TableCell>Category Name</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.categoryId}>
                                    <TableCell>{category.categoryId}</TableCell>
                                    <TableCell>{category.categoryName}</TableCell>
                                    <TableCell>
                                        <Button variant="contained" style={{ marginRight: 8 }} sx={{ bgcolor: '#007bff' }}>Edit</Button>
                                        <Button variant="contained" sx={{ bgcolor: '#dc3545' }}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this product?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={registerDialogOpen} onClose={handleCloseRegisterDialog}>
                <DialogTitle>Confirm Registration</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to register this product?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRegisterDialog}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmRegisterProduct}>
                        Register
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={updateDialogOpen} onClose={handleCloseUpdateDialog}>
                <DialogTitle>Confirm Update</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to update this product?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUpdateDialog}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmUpdateProduct}>
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%', height: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Inventory;