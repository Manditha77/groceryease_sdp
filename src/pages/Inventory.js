import React, { useEffect, useState } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Grid, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Snackbar, Alert, Autocomplete } from "@mui/material";
import productServices from "../services/productServices";
import categoryService from "../services/categoryService";
import authService from "../services/authService";

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [filterType, setFilterType] = useState("productName"); // Default filter type

    const filterOptions = [
        { label: "Product Name", value: "productName" },
        { label: "Category", value: "categoryName" },
        { label: "Quantity", value: "quantity" },
        { label: "Buying Price", value: "buyingPrice" },
        { label: "Selling Price", value: "sellingPrice" },
        { label: "Supplier", value: "supplierCompanyName" },
    ];
    const [restockDialogOpen, setRestockDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newStock, setNewStock] = useState("");
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [formData, setFormData] = useState({
        productName: '',
        categoryName: '',
        quantity: '',
        buyingPrice: '',
        sellingPrice: '',
        supplierCompanyName: ''
    });
    const [formDataCategory, setFormDataCategory] = useState({
        newCategoryName: ''
    });
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [categoryRegisterDialogOpen, setCategoryRegisterDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarErrorOpen, setSnackbarErrorOpen] = useState(false);
    const [snackbarErrorMessage, setSnackbarErrorMessage] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        productServices.getAllProducts().then(response => {
            setProducts(response.data);
        });
    }, []);

    const filteredProducts = products.filter((product) => {
        const filterValue = product[filterType]?.toString().toLowerCase() || "";

        if (["quantity", "buyingPrice", "sellingPrice"].includes(filterType)) {
            // For numeric fields, match exact value
            return product[filterType]?.toString() === searchValue;
        }

        // For other fields, use partial match
        return filterValue.includes(searchValue.toLowerCase());
    });

    const handleOpenRestockDialog = () => {
        setRestockDialogOpen(true);
    };

    const handleCloseRestockDialog = () => {
        setRestockDialogOpen(false);
        setSelectedProduct(null);
        setNewStock("");
    };

    const handleRestock = async () => {
        if (!selectedProduct || !newStock || isNaN(newStock) || newStock <= 0) {
            setSnackbarMessage("Please select a product and enter a valid stock quantity");
            setSnackbarOpen(true);
            return;
        }

        try {
            const updatedProduct = {
                ...selectedProduct,
                quantity: selectedProduct.quantity + parseInt(newStock, 10),
            };

            // Update the product in the backend
            await productServices.updateProduct(selectedProduct.productId, updatedProduct);

            // Update the product in the frontend state
            setProducts((prevProducts) =>
                prevProducts.map((product) =>
                    product.productId === selectedProduct.productId ? updatedProduct : product
                )
            );

            setSnackbarMessage("Stock updated successfully");
            setSnackbarOpen(true);
        } catch (error) {
            console.error("Error updating stock:", error);
            setSnackbarMessage("Failed to update stock");
            setSnackbarOpen(true);
        } finally {
            handleCloseRestockDialog();
        }
    };

    useEffect(() => {
        categoryService.getAllCategories().then(response => {
            setCategories(response.data);
        });
    }, []);

    useEffect(() => {
        authService.getSuppliers().then(response => {
            setSuppliers(response); // Fetch and set suppliers
        }).catch(error => {
            console.error("Error fetching suppliers:", error);
        });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    }

    const handleChangeCategory = (e) => {
        const { name, value } = e.target;
        setFormDataCategory({
            ...formDataCategory,
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
        if (!formData.productName || !formData.categoryName || !formData.supplierCompanyName || !formData.quantity || !formData.buyingPrice || !formData.sellingPrice) {
            setSnackbarErrorMessage('Please fill in all required fields');
            setSnackbarErrorOpen(true);
            return;
        }

        if (formData.quantity <= 0) {
            setSnackbarErrorMessage('Quantity must be greater than zero');
            setSnackbarErrorOpen(true);
            return;
        }

        if (formData.buyingPrice > formData.sellingPrice) {
            setSnackbarErrorMessage('Buying price must be less than or equal to selling price');
            setSnackbarErrorOpen(true);
            return;
        }

        const productExists = products.some(product => product.productName === formData.productName);
        if (productExists) {
            setSnackbarErrorMessage('Product already exists');
            setSnackbarErrorOpen(true);
            return;
        }

        // Check if the category exists
        const categoryExists = categories.some(category => category.categoryName === formData.categoryName);
        if (!categoryExists) {
            setSnackbarErrorMessage('Category does not exist');
            setSnackbarErrorOpen(true);
            return;
        }

        // Check if the supplier exists
        const supplierExists = suppliers.some(supplier => supplier.companyName === formData.supplierCompanyName);
        if (!supplierExists) {
            setSnackbarErrorMessage('Supplier does not exist');
            setSnackbarErrorOpen(true);
            return;
        }

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
            setSnackbarMessage('Failed to add product');
            setSnackbarOpen(true);
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
        // Check if all required fields are filled
        if (!formData.productName || !formData.categoryName || !formData.supplierCompanyName || !formData.quantity || !formData.buyingPrice || !formData.sellingPrice) {
            setSnackbarErrorMessage('Please fill in all required fields');
            setSnackbarErrorOpen(true);
            return;
        }

        // Check if the quantity is valid
        if (formData.quantity <= 0) {
            setSnackbarErrorMessage('Quantity must be greater than zero');
            setSnackbarErrorOpen(true);
            return;
        }

        // Check if the buying price is less than or equal to the selling price
        if (formData.buyingPrice > formData.sellingPrice) {
            setSnackbarErrorMessage('Buying price must be less than or equal to selling price');
            setSnackbarErrorOpen(true);
            return;
        }

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

    const handleOpenCategoryRegisterDialog = () => {
        setCategoryRegisterDialogOpen(true);
    }

    const handleCloseCategoryRegisterDialog = () => {
        setCategoryRegisterDialogOpen(false);
    }

    const handleRegisterCategory = async () => {
        if (!formDataCategory.newCategoryName.trim()) {
            setSnackbarErrorMessage('Category name cannot be empty');
            setSnackbarErrorOpen(true);
            return;
        }
        // Check for duplicate category
        const categoryExists = categories.some(category => category.categoryName === formDataCategory.newCategoryName);
        if (categoryExists) {
            setSnackbarErrorMessage('Category already exists');
            setSnackbarErrorOpen(true);
            return;
        }

        try {
            const newCategory = {
                categoryName: formDataCategory.newCategoryName
            };
            const response = await categoryService.addCategory(newCategory);
            setCategories([...categories, response.data]);
            setSnackbarMessage('Category added successfully');
            setSnackbarOpen(true);
            setFormDataCategory({
                newCategoryName: ''
            });
        } catch (error) {
            console.error('Error adding category:', error);
            setSnackbarMessage('Failed to add category');
            setSnackbarOpen(true);
        } finally {
            handleCloseCategoryRegisterDialog();
        }
    }

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            <Box>
                <Typography variant="h4" gutterBottom sx={{ color: '#0478C0' }}>
                    Inventory
                </Typography>
                <Grid container spacing={2} sx={{ marginBottom: 3 }}>
                    <Grid item xs={12} md={2.2}>
                        <Autocomplete
                            options={filterOptions}
                            getOptionLabel={(option) => option.label}
                            value={filterOptions.find((option) => option.value === filterType)}
                            onChange={(event, newValue) => setFilterType(newValue?.value || "productName")}
                            renderInput={(params) => (
                                <TextField {...params} label="Filter By" variant="outlined" />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Search"
                            variant="outlined"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6.8} sx={{ textAlign: "right" }}>
                        <Button
                            variant="contained"
                            onClick={handleOpenRestockDialog}
                            sx={{ bgcolor: "#00ffff", textTransform: "none", color: "black" }}
                        >
                            Add Stock
                        </Button>
                    </Grid>
                </Grid>
                <Dialog
                    open={restockDialogOpen}
                    onClose={handleCloseRestockDialog}
                    maxWidth="md" // Set the maximum width to medium
                    sx={{ '& .MuiDialog-paper': { minHeight: '400px', minWidth: '600px' } }} // Custom size
                >
                    <DialogTitle>Restock Product</DialogTitle>
                    <DialogContent>
                        <Autocomplete
                            options={products}
                            getOptionLabel={(option) => option.productName}
                            onChange={(event, newValue) => setSelectedProduct(newValue)}
                            renderInput={(params) => (
                                <TextField {...params} label="Select Product" variant="outlined" sx={{ marginTop: 2 }}/>
                            )}
                        />
                        <TextField
                            fullWidth
                            label="New Stock Quantity"
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            sx={{ marginTop: 2 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseRestockDialog}>Cancel</Button>
                        <Button onClick={handleRestock} variant="contained">
                            Add Stock
                        </Button>
                    </DialogActions>
                </Dialog>
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
                            {filteredProducts.map((product) => (
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
                                    <Autocomplete
                                        options={categories.map((category) => category.categoryName)} // Map category names
                                        value={formData.categoryName}
                                        onChange={(event, newValue) => {
                                            setFormData({ ...formData, categoryName: newValue });
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Category"
                                                variant="outlined"
                                                required
                                            />
                                        )}
                                    />
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
                                    <Autocomplete
                                        options={suppliers.map((supplier) => supplier.companyName)} // Map supplier names
                                        value={formData.supplierCompanyName}
                                        onChange={(event, newValue) => {
                                            setFormData({ ...formData, supplierCompanyName: newValue });
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Supplier"
                                                variant="outlined"
                                                required
                                            />
                                        )}
                                    />
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
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.categoryId}>
                                    <TableCell>{category.categoryId}</TableCell>
                                    <TableCell>{category.categoryName}</TableCell>
                                    <TableCell>
                                        <Button variant="contained" sx={{ bgcolor: '#dc3545' }}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box sx={{ paddingTop: 5 }}>
                <Typography variant="h4" gutterBottom sx={{ color: '#0478C0' }}>
                    Add New Category
                </Typography>
                <Paper elevation={3} sx={{ padding: 4, marginTop: 2 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" align="center" sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}>
                                Category Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="New Category Name" name="newCategoryName" value={formDataCategory.newCategoryName} onChange={handleChangeCategory} variant="outlined" required />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                        <Button
                            variant="contained"
                            style={{ background: '#007bff', textTransform: 'none', width: '200px', height: '50px', fontSize: '19px' }}
                            onClick={handleOpenCategoryRegisterDialog}
                            size="large"
                        >
                            Add Category
                        </Button>
                    </Grid>
                </Paper>
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

            <Dialog open={categoryRegisterDialogOpen} onClose={handleCloseCategoryRegisterDialog}>
                <DialogTitle>Confirm Registration</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to add this category?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCategoryRegisterDialog}>
                        Cancel
                    </Button>
                    <Button onClick={handleRegisterCategory}>
                        Register
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%', height: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            <Snackbar open={snackbarErrorOpen} autoHideDuration={3000} onClose={() => setSnackbarErrorOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={() => setSnackbarErrorOpen(false)} severity="error" sx={{ width: '100%', height: '100%' }}>
                    {snackbarErrorMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Inventory;