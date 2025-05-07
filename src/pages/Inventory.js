import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Grid, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Snackbar, Alert, Autocomplete } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import defaultImage from '../images/unnamed.jpg';
import productServices from "../services/productServices";
import categoryService from "../services/categoryService";
import authService from "../services/authService";
import { Html5QrcodeScanner } from "html5-qrcode";

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [filterType, setFilterType] = useState("productName");

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
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [newStock, setNewStock] = useState("");
    const [newBuyingPrice, setNewBuyingPrice] = useState("");
    const [newSellingPrice, setNewSellingPrice] = useState("");
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [formData, setFormData] = useState({
        productName: '',
        categoryName: '',
        quantity: '',
        buyingPrice: '',
        sellingPrice: '',
        supplierCompanyName: '',
        image: defaultImage,
        barcode: '',
    });
    const [formDataCategory, setFormDataCategory] = useState({
        newCategoryName: ''
    });
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false);
    const [categoryRegisterDialogOpen, setCategoryRegisterDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarErrorOpen, setSnackbarErrorOpen] = useState(false);
    const [snackbarErrorMessage, setSnackbarErrorMessage] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [openImageDialog, setOpenImageDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [scannerDialogOpen, setScannerDialogOpen] = useState(false);
    const scannerRef = useRef(null);
    const readerRef = useRef(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await productServices.getAllProducts();
            setProducts(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const filteredProducts = products.filter((product) => {
        const filterValue = product[filterType]?.toString().toLowerCase() || "";
        if (["quantity", "buyingPrice", "sellingPrice"].includes(filterType)) {
            return product[filterType]?.toString() === searchValue;
        }
        return filterValue.includes(searchValue.toLowerCase());
    });

    const handleOpenRestockDialog = async (product) => {
        setSelectedProduct(product);
        try {
            const response = await productServices.getProductBatches(product.productId);
            setBatches(response.data);
        } catch (error) {
            console.error("Error fetching batches:", error);
            setBatches([]);
        }
        setRestockDialogOpen(true);
    };

    const handleCloseRestockDialog = () => {
        setRestockDialogOpen(false);
        setSelectedProduct(null);
        setSelectedBatch(null);
        setBatches([]);
        setNewStock("");
        setNewBuyingPrice("");
        setNewSellingPrice("");
    };

    const handleRestock = async () => {
        if (!selectedProduct || !newStock || isNaN(newStock) || newStock <= 0) {
            setSnackbarErrorMessage("Please enter a valid stock quantity");
            setSnackbarErrorOpen(true);
            return;
        }

        if (!selectedBatch && (!newBuyingPrice || !newSellingPrice || newBuyingPrice <= 0 || newSellingPrice <= 0)) {
            setSnackbarErrorMessage("Please enter valid buying and selling prices for a new batch");
            setSnackbarErrorOpen(true);
            return;
        }

        try {
            await productServices.restockProduct(
                selectedProduct.productId,
                parseInt(newStock, 10),
                selectedBatch ? selectedBatch.buyingPrice : parseFloat(newBuyingPrice),
                selectedBatch ? selectedBatch.sellingPrice : parseFloat(newSellingPrice),
                selectedBatch ? selectedBatch.batchId : null
            );

            setSnackbarMessage("Stock updated successfully");
            setSnackbarOpen(true);
            fetchProducts(); // Refresh the product list
        } catch (error) {
            console.error("Error updating stock:", error);
            setSnackbarErrorMessage("Failed to update stock: " + (error.response?.data?.message || error.message));
            setSnackbarErrorOpen(true);
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
            setSuppliers(response);
        }).catch(error => {
            console.error("Error fetching suppliers:", error);
        });
    }, []);

    useEffect(() => {
        if (!scannerDialogOpen) return;

        const initializeScanner = () => {
            const readerElement = document.getElementById("reader");
            if (!readerElement) {
                setTimeout(initializeScanner, 100);
                return;
            }

            const scanner = new Html5QrcodeScanner("reader", {
                fps: 10,
                qrbox: { width: 350, height: 350 },
                rememberLastUsedCamera: true,
                aspectRatio: 1.0,
            }, false);

            scannerRef.current = scanner;

            scanner.render((data) => {
                setFormData(prev => ({ ...prev, barcode: data }));
                setSnackbarMessage("Barcode scanned and set: " + data);
                setSnackbarOpen(true);
                handleCloseScannerDialog();
            }, (error) => {
                console.error("Scan error:", error);
            });
        };

        if (scannerRef.current) {
            scannerRef.current.clear().catch((err) => console.error("Failed to clear previous scanner:", err));
            scannerRef.current = null;
        }

        initializeScanner();

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((err) => console.error("Failed to clear scanner on unmount:", err));
                scannerRef.current = null;
            }
        };
    }, [scannerDialogOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleChangeCategory = (e) => {
        const { name, value } = e.target;
        setFormDataCategory({
            ...formDataCategory,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, image: e.target.files[0] }));
    };

    const handleImageClick = (image) => {
        setSelectedImage(image);
        setOpenImageDialog(true);
    };

    const handleOpenScannerDialog = () => {
        setScannerDialogOpen(true);
    };

    const handleCloseScannerDialog = () => {
        setScannerDialogOpen(false);
        if (scannerRef.current) {
            scannerRef.current.clear().catch((err) => console.error("Failed to clear scanner on dialog close:", err));
            scannerRef.current = null;
        }
    };

    const handleCloseImageDialog = () => {
        setOpenImageDialog(false);
        setSelectedImage(null);
    };

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

        const categoryExists = categories.some(category => category.categoryName === formData.categoryName);
        if (!categoryExists) {
            setSnackbarErrorMessage('Category does not exist');
            setSnackbarErrorOpen(true);
            return;
        }

        const supplierExists = suppliers.some(supplier => supplier.companyName === formData.supplierCompanyName);
        if (!supplierExists) {
            setSnackbarErrorMessage('Supplier does not exist');
            setSnackbarErrorOpen(true);
            return;
        }

        try {
            const response = await productServices.addProduct(formData);
            setProducts([...products, response]);
            setSnackbarMessage('Product added successfully');
            setSnackbarOpen(true);
            setFormData({
                productName: '',
                categoryName: '',
                quantity: '',
                buyingPrice: '',
                sellingPrice: '',
                supplierCompanyName: '',
                image: defaultImage,
                barcode: '',
            });
        } catch (error) {
            console.error('Error adding product:', error);
            setSnackbarErrorMessage('Failed to add product: ' + (error.response?.data?.message || error.message));
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseRegisterDialog();
        }
    };

    const updateSectionRef = useRef(null);

    const handleUpdateProduct = (productId) => {
        const product = products.find((product) => product.productId === productId);
        setFormData({
            productName: product.productName,
            categoryName: product.categoryName,
            quantity: 0, // Quantity will be handled via restocking
            buyingPrice: product.buyingPrice,
            sellingPrice: product.sellingPrice,
            supplierCompanyName: product.supplierCompanyName,
            image: product.base64Image || defaultImage,
            barcode: product.barcode || '',
        });
        setSelectedProductId(productId);
        setIsEditMode(true);
        updateSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleOpenUpdateDialog = () => {
        setUpdateDialogOpen(true);
    };

    const handleCloseUpdateDialog = () => {
        setUpdateDialogOpen(false);
        setSelectedProductId(null);
        setIsEditMode(false);
    };

    const handleConfirmUpdateProduct = async () => {
        if (!formData.productName || !formData.categoryName || !formData.supplierCompanyName) {
            setSnackbarErrorMessage('Please fill in all required fields');
            setSnackbarErrorOpen(true);
            return;
        }

        try {
            const response = await productServices.updateProduct(selectedProductId, {
                productName: formData.productName,
                categoryName: formData.categoryName,
                quantity: parseInt(formData.quantity) || 0,
                buyingPrice: parseFloat(formData.buyingPrice) || 0.0,
                sellingPrice: parseFloat(formData.sellingPrice) || 0.0,
                supplierCompanyName: formData.supplierCompanyName,
                barcode: formData.barcode,
                image: formData.image
            });
            const updatedProducts = products.map((product) =>
                product.productId === selectedProductId ? response : product
            );
            setProducts(updatedProducts);
            setSnackbarMessage('Product updated successfully');
            setSnackbarOpen(true);
            setFormData({
                productName: '',
                categoryName: '',
                quantity: '',
                buyingPrice: '',
                sellingPrice: '',
                supplierCompanyName: '',
                image: defaultImage,
                barcode: '',
            });
        } catch (error) {
            console.error('Error updating product:', error);
            setSnackbarErrorMessage('Failed to update product: ' + (error.response?.data?.message || error.message));
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseUpdateDialog();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleOpenCategoryDeleteDialog = (categoryId) => {
        setSelectedCategoryId(categoryId);
        setCategoryDeleteDialogOpen(true);
    }

    const handleCloseCategoryDeleteDialog = () => {
        setCategoryDeleteDialogOpen(false);
    }

    const handleDeleteCategory = async () => {
        try {
            await categoryService.deleteCategory(selectedCategoryId);
            const updatedCategories = categories.filter((category) => category.categoryId !== selectedCategoryId);
            setCategories(updatedCategories);
            setSnackbarMessage('Category deleted successfully');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error deleting category:', error);
            setSnackbarErrorMessage('Failed to delete category');
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseCategoryDeleteDialog();
        }
    }

    const handleOpenCategoryRegisterDialog = () => {
        setCategoryRegisterDialogOpen(true);
    };

    const handleCloseCategoryRegisterDialog = () => {
        setCategoryRegisterDialogOpen(false);
    };

    const handleRegisterCategory = async () => {
        if (!formDataCategory.newCategoryName.trim()) {
            setSnackbarErrorMessage('Category name cannot be empty');
            setSnackbarErrorOpen(true);
            return;
        }
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
            setSnackbarErrorMessage('Failed to add category');
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseCategoryRegisterDialog();
        }
    };



    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            <Box>
                <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
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
                            onClick={() => handleOpenRestockDialog(null)}
                            sx={{ bgcolor: "#00ffff", textTransform: "none", color: "black" }}
                            startIcon={<AddCircleIcon/>}
                        >
                            Add Stock
                        </Button>
                    </Grid>
                </Grid>
                <Dialog
                    open={restockDialogOpen}
                    onClose={handleCloseRestockDialog}
                    maxWidth="md"
                    sx={{ '& .MuiDialog-paper': { minHeight: '400px', minWidth: '600px' } }}
                >
                    <DialogTitle>Restock Product</DialogTitle>
                    <DialogContent>
                        <Autocomplete
                            options={products}
                            getOptionLabel={(option) => option.productName}
                            onChange={(event, newValue) => handleOpenRestockDialog(newValue)}
                            value={selectedProduct}
                            renderInput={(params) => (
                                <TextField {...params} label="Select Product" variant="outlined" sx={{ marginTop: 2 }}/>
                            )}
                        />
                        <Autocomplete
                            options={[{ batchId: null, label: "Create New Batch" }, ...batches.map(batch => ({
                                batchId: batch.batchId,
                                label: `Batch #${batch.batchId} (Qty: ${batch.quantity}, Buy: ${batch.buyingPrice}, Sell: ${batch.sellingPrice})`
                            }))]}
                            getOptionLabel={(option) => option.label}
                            onChange={(event, newValue) => setSelectedBatch(newValue?.batchId ? batches.find(b => b.batchId === newValue.batchId) : null)}
                            renderInput={(params) => (
                                <TextField {...params} label="Select Batch" variant="outlined" sx={{ marginTop: 2 }}/>
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
                        {!selectedBatch && (
                            <>
                                <TextField
                                    fullWidth
                                    label="Buying Price"
                                    type="number"
                                    value={newBuyingPrice}
                                    onChange={(e) => setNewBuyingPrice(e.target.value)}
                                    sx={{ marginTop: 2 }}
                                />
                                <TextField
                                    fullWidth
                                    label="Selling Price"
                                    type="number"
                                    value={newSellingPrice}
                                    onChange={(e) => setNewSellingPrice(e.target.value)}
                                    sx={{ marginTop: 2 }}
                                />
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseRestockDialog}>Cancel</Button>
                        <Button onClick={handleRestock} variant="contained">
                            Add Stock
                        </Button>
                    </DialogActions>
                </Dialog>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Product ID</TableCell>
                                <TableCell>Image</TableCell>
                                <TableCell>Product Name</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Buying Price</TableCell>
                                <TableCell>Selling Price</TableCell>
                                <TableCell>Supplier</TableCell>
                                <TableCell>BarCode</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProducts.map((product) => (
                                <TableRow key={product.productId}>
                                    <TableCell>{product.productId}</TableCell>
                                    <TableCell>
                                        {product.base64Image && (
                                            <img
                                                src={`data:image/jpeg;base64,${product.base64Image}`}
                                                alt={product.productName}
                                                style={{
                                                    width: "60px",
                                                    height: "60px",
                                                    objectFit: "cover",
                                                    border: "1px solid #ccc",
                                                    borderRadius: "4px",
                                                    padding: "2px",
                                                    backgroundColor: "#f9f9f9",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => handleImageClick(product.base64Image)}
                                                title="Click to view"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>{product.productName}</TableCell>
                                    <TableCell>{product.categoryName}</TableCell>
                                    <TableCell>{product.quantity}</TableCell>
                                    <TableCell>{product.buyingPrice}</TableCell>
                                    <TableCell>{product.sellingPrice}</TableCell>
                                    <TableCell>{product.supplierCompanyName}</TableCell>
                                    <TableCell>{product.barcode}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            sx={{
                                                bgcolor: '#007bff',
                                                minWidth: '40px',
                                                padding: '4px',
                                                marginRight: '4px',
                                                '&:hover': { bgcolor: '#0056b3' }
                                            }}
                                            onClick={() => handleUpdateProduct(product.productId)}
                                            title="Edit Product"
                                        >
                                            <EditIcon fontSize="small" />
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            sx={{
                                                bgcolor: '#dc3545',
                                                minWidth: '40px',
                                                padding: '4px',
                                                marginRight: '4px',
                                                '&:hover': { bgcolor: '#a71d2a' }
                                            }}
                                            onClick={() => handleOpenDeleteDialog(product.productId)}
                                            title="Delete Product"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            sx={{
                                                bgcolor: '#28a745',
                                                minWidth: '40px',
                                                padding: '4px',
                                                '&:hover': { bgcolor: '#1e7e34' }
                                            }}
                                            onClick={() => handleOpenRestockDialog(product)}
                                            title="Restock Product"
                                        >
                                            <AddCircleIcon fontSize="small" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Dialog open={openImageDialog} onClose={handleCloseImageDialog} maxWidth="md">
                <DialogContent>
                    {selectedImage && (
                        <img
                            src={`data:image/jpeg;base64,${selectedImage}`}
                            alt="Product"
                            style={{
                                width: "100%",
                                height: "auto",
                                objectFit: "contain",
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Box ref={updateSectionRef} sx={{ paddingTop: 5 }}>
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
                                        options={categories.map((category) => category.categoryName)}
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
                                {!isEditMode && (
                                    <>
                                        <Grid item xs={12}>
                                            <TextField fullWidth label="Initial Quantity" name="quantity" value={formData.quantity} onChange={handleChange} variant="outlined" required />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField fullWidth label="Buying Price" name="buyingPrice" value={formData.buyingPrice} onChange={handleChange} variant="outlined" required />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField fullWidth label="Selling Price" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} variant="outlined" required />
                                        </Grid>
                                    </>
                                )}
                                <Grid item xs={12}>
                                    <Autocomplete
                                        options={suppliers.map((supplier) => supplier.companyName)}
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
                                <Grid item xs={12}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={9}>
                                            <TextField
                                                fullWidth
                                                label="Barcode"
                                                name="barcode"
                                                value={formData.barcode}
                                                onChange={handleChange}
                                                variant="outlined"
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Button
                                                variant="contained"
                                                onClick={handleOpenScannerDialog}
                                                sx={{ bgcolor: "#007bff", textTransform: "none" }}
                                            >
                                                Scan
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="h6" align="center" sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}>
                                Product Image
                            </Typography>
                            <Box
                                sx={{
                                    width: '200px',
                                    height: '200px',
                                    border: '2px dashed #ccc',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: '#f9f9f9',
                                    position: 'relative',
                                }}
                                onClick={() => document.getElementById('fileInput').click()}
                            >
                                {!formData.image && (
                                    <Typography variant="h4" sx={{ color: '#ccc' }}>+</Typography>
                                )}
                                <input
                                    id="fileInput"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                {formData.image && (
                                    <img
                                        src={formData.image instanceof File ? URL.createObjectURL(formData.image) : formData.image}
                                        alt="Preview"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                        }}
                                    />
                                )}
                            </Box>
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
                                        <Button variant="contained" sx={{ bgcolor: '#dc3545' }} onClick={() => handleOpenCategoryDeleteDialog(category.categoryId)} startIcon={<DeleteIcon/>}>Delete</Button>
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

            <Dialog open={categoryDeleteDialogOpen} onClose={handleCloseCategoryDeleteDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this category?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCategoryDeleteDialog}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteCategory}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={scannerDialogOpen}
                onClose={handleCloseScannerDialog}
                maxWidth="lg"
                fullWidth
                sx={{ '& .MuiDialog-paper': { width: '90vw', maxWidth: '600px', height: '70vh', maxHeight: '500px' } }}
            >
                <DialogTitle>Scan Barcode</DialogTitle>
                <DialogContent>
                    <div
                        id="reader"
                        ref={readerRef}
                        style={{ width: '100%', height: 'calc(100% - 20px)', minHeight: '300px', border: '1px solid #ccc' }}
                    ></div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseScannerDialog}>Cancel</Button>
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