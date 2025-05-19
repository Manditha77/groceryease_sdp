import React, { useEffect, useState, useRef } from "react";
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Grid,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Snackbar,
    Alert,
    Autocomplete,
    FormControlLabel,
    Checkbox,
    IconButton,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import UpdateIcon from "@mui/icons-material/Update";
import defaultImage from "../images/unnamed.jpg";
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
        { label: "Units", value: "units" },
        { label: "Buying Price", value: "buyingPrice" },
        { label: "Selling Price", value: "sellingPrice" },
        { label: "Supplier", value: "supplierCompanyName" },
        { label: "Expire Date", value: "expireDate" },
    ];

    const [restockDialogOpen, setRestockDialogOpen] = useState(false);
    const [updateBatchDialogOpen, setUpdateBatchDialogOpen] = useState(false);
    const [restockConfirmDialogOpen, setRestockConfirmDialogOpen] = useState(false);
    const [updateBatchConfirmDialogOpen, setUpdateBatchConfirmDialogOpen] = useState(false);
    const [deleteBatchDialogOpen, setDeleteBatchDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [newStock, setNewStock] = useState("");
    const [newBuyingPrice, setNewBuyingPrice] = useState("");
    const [newSellingPrice, setNewSellingPrice] = useState("");
    const [newExpireDate, setNewExpireDate] = useState("");
    const [updatedUnits, setUpdatedUnits] = useState("");
    const [updatedBuyingPrice, setUpdatedBuyingPrice] = useState("");
    const [updatedSellingPrice, setUpdatedSellingPrice] = useState("");
    const [updatedExpireDate, setUpdatedExpireDate] = useState("");
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [formData, setFormData] = useState({
        productName: "",
        categoryName: "",
        units: "",
        buyingPrice: "",
        sellingPrice: "",
        supplierCompanyName: "",
        image: defaultImage,
        barcode: "",
        unitType: "DISCRETE",
        expireDate: "",
    });
    const [useBarcode, setUseBarcode] = useState(true);
    const [formDataCategory, setFormDataCategory] = useState({
        newCategoryName: "",
    });
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false);
    const [categoryUpdateDialogOpen, setCategoryUpdateDialogOpen] = useState(false);
    const [categoryRegisterDialogOpen, setCategoryRegisterDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarErrorOpen, setSnackbarErrorOpen] = useState(false);
    const [snackbarErrorMessage, setSnackbarErrorMessage] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [openImageDialog, setOpenImageDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [scannerDialogOpen, setScannerDialogOpen] = useState(false);
    const scannerRef = useRef(null);
    const readerRef = useRef(null);
    const [isManualBarcode, setIsManualBarcode] = useState(false);

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

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAllCategories();
            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const filteredProducts = products.filter((product) => {
        const filterValue = product[filterType]?.toString().toLowerCase() || "";
        if (["units", "buyingPrice", "sellingPrice"].includes(filterType)) {
            return product[filterType]?.toString() === searchValue;
        } else if (filterType === "expireDate") {
            return product.expireDate?.toString().split("T")[0].toLowerCase().includes(searchValue.toLowerCase()) || "";
        }
        return filterValue.includes(searchValue.toLowerCase());
    });

    const handleOpenRestockDialog = async (product) => {
        setSelectedProduct(product);
        if (product) {
            try {
                const response = await productServices.getProductBatches(product.productId);
                setBatches(response.data);
            } catch (error) {
                console.error("Error fetching batches:", error);
                setBatches([]);
            }
        } else {
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
        setNewExpireDate("");
    };

    const handleOpenRestockConfirmDialog = () => {
        if (!selectedProduct || !newStock || isNaN(newStock) || Number(newStock) <= 0) {
            setSnackbarErrorMessage("Please select a product and enter a valid stock quantity");
            setSnackbarErrorOpen(true);
            handleCloseRestockDialog();
            return;
        }

        if (selectedProduct?.unitType === "DISCRETE" && Number(newStock) % 1 !== 0) {
            setSnackbarErrorMessage("Units for DISCRETE products must be an integer (e.g., 1, 2, 10)");
            setSnackbarErrorOpen(true);
            handleCloseRestockDialog();
            return;
        }

        if (!selectedBatch && (!newBuyingPrice || !newSellingPrice || Number(newBuyingPrice) <= 0 || Number(newSellingPrice) <= 0)) {
            setSnackbarErrorMessage("Please enter valid buying and selling prices for a new batch");
            setSnackbarErrorOpen(true);
            handleCloseRestockDialog();
            return;
        }

        if (!selectedBatch && !newExpireDate) {
            setSnackbarErrorMessage("Please enter a valid expiration date for a new batch");
            setSnackbarErrorOpen(true);
            handleCloseRestockDialog();
            return;
        }

        setRestockConfirmDialogOpen(true);
    };

    const handleCloseRestockConfirmDialog = () => {
        setRestockConfirmDialogOpen(false);
        handleCloseRestockDialog();
    };

    const handleRestock = async () => {
        try {
            const formattedExpireDate = newExpireDate ? `${newExpireDate}T00:00:00` : "";
            await productServices.restockProduct(
                selectedProduct.productId,
                Number(newStock),
                selectedBatch ? selectedBatch.buyingPrice : Number(newBuyingPrice),
                selectedBatch ? selectedBatch.sellingPrice : Number(newSellingPrice),
                selectedBatch ? selectedBatch.batchId : null,
                formattedExpireDate
            );

            setSnackbarMessage("Stock updated successfully");
            setSnackbarOpen(true);
            fetchProducts();
        } catch (error) {
            console.error("Error updating stock:", error);
            setSnackbarErrorMessage("Failed to update stock: " + (error.response?.data?.message || error.message));
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseRestockConfirmDialog();
        }
    };

    const handleOpenUpdateBatchDialog = async (product) => {
        setSelectedProduct(product);
        if (product) {
            try {
                const response = await productServices.getProductBatches(product.productId);
                setBatches(response.data);
            } catch (error) {
                console.error("Error fetching batches:", error);
                setBatches([]);
            }
        } else {
            setBatches([]);
        }
        setUpdateBatchDialogOpen(true);
    };

    const handleCloseUpdateBatchDialog = () => {
        setUpdateBatchDialogOpen(false);
        setSelectedProduct(null);
        setSelectedBatch(null);
        setBatches([]);
        setUpdatedUnits("");
        setUpdatedBuyingPrice("");
        setUpdatedSellingPrice("");
        setUpdatedExpireDate("");
    };

    const handleOpenUpdateBatchConfirmDialog = () => {
        if (!selectedProduct || !selectedBatch) {
            setSnackbarErrorMessage("Please select a product and batch");
            setSnackbarErrorOpen(true);
            handleCloseUpdateBatchDialog();
            return;
        }

        if (!updatedUnits || isNaN(updatedUnits) || Number(updatedUnits) < 0) {
            setSnackbarErrorMessage("Please enter a valid units value (non-negative)");
            setSnackbarErrorOpen(true);
            handleCloseUpdateBatchDialog();
            return;
        }

        if (selectedProduct.unitType === "DISCRETE" && Number(updatedUnits) % 1 !== 0) {
            setSnackbarErrorMessage("Units for DISCRETE products must be an integer (e.g., 1, 2, 10)");
            setSnackbarErrorOpen(true);
            handleCloseUpdateBatchDialog();
            return;
        }

        if (!updatedBuyingPrice || !updatedSellingPrice || Number(updatedBuyingPrice) <= 0 || Number(updatedSellingPrice) <= 0) {
            setSnackbarErrorMessage("Please enter valid buying and selling prices (greater than zero)");
            setSnackbarErrorOpen(true);
            handleCloseUpdateBatchDialog();
            return;
        }

        if (Number(updatedBuyingPrice) > Number(updatedSellingPrice)) {
            setSnackbarErrorMessage("Buying price must be less than or equal to selling price");
            setSnackbarErrorOpen(true);
            handleCloseUpdateBatchDialog();
            return;
        }

        if (!updatedExpireDate) {
            setSnackbarErrorMessage("Please enter a valid expiration date");
            setSnackbarErrorOpen(true);
            handleCloseUpdateBatchDialog();
            return;
        }

        setUpdateBatchConfirmDialogOpen(true);
    };

    const handleCloseUpdateBatchConfirmDialog = () => {
        setUpdateBatchConfirmDialogOpen(false);
        handleCloseUpdateBatchDialog();
    };

    const handleUpdateBatch = async () => {
        try {
            const formattedExpireDate = updatedExpireDate ? `${updatedExpireDate}T00:00:00` : "";
            await productServices.updateBatch(
                selectedBatch.batchId,
                Number(updatedUnits),
                Number(updatedBuyingPrice),
                Number(updatedSellingPrice),
                formattedExpireDate
            );

            setSnackbarMessage("Batch updated successfully");
            setSnackbarOpen(true);
            fetchProducts();
        } catch (error) {
            console.error("Error updating batch:", error);
            setSnackbarErrorMessage("Failed to update batch: " + (error.response?.data?.message || error.message));
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseUpdateBatchConfirmDialog();
        }
    };

    const handleOpenDeleteBatchDialog = () => {
        if (!selectedProduct || !selectedBatch) {
            setSnackbarErrorMessage("Please select a product and batch to delete");
            setSnackbarErrorOpen(true);
            handleCloseUpdateBatchDialog();
            return;
        }
        setDeleteBatchDialogOpen(true);
    };

    const handleCloseDeleteBatchDialog = () => {
        setDeleteBatchDialogOpen(false);
    };

    const handleConfirmDeleteBatch = async () => {
        try {
            await productServices.deleteBatch(selectedBatch.batchId);
            setBatches(batches.filter((batch) => batch.batchId !== selectedBatch.batchId));
            setSnackbarMessage("Batch deleted successfully");
            setSnackbarOpen(true);
            fetchProducts();
        } catch (error) {
            console.error("Error deleting batch:", error);
            setSnackbarErrorMessage("Failed to delete batch: " + (error.response?.data?.message || error.message));
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseDeleteBatchDialog();
            handleCloseUpdateBatchDialog();
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        authService
            .getSuppliers()
            .then((response) => {
                setSuppliers(response);
            })
            .catch((error) => {
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

            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 350, height: 350 },
                    rememberLastUsedCamera: true,
                    aspectRatio: 1.0,
                },
                false
            );

            scannerRef.current = scanner;

            scanner.render(
                (data) => {
                    setFormData((prev) => ({ ...prev, barcode: data }));
                    setIsManualBarcode(false);
                    setSnackbarMessage("Barcode scanned and set: " + data);
                    setSnackbarOpen(true);
                    handleCloseScannerDialog();
                },
                (error) => {
                    console.error("Scan error:", error);
                }
            );
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

    const handleCategoryChange = (event, newValue) => {
        setFormData({ ...formData, categoryName: newValue || "" });
    };

    const handleSupplierChange = (event, newValue) => {
        setFormData({ ...formData, supplierCompanyName: newValue || "" });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "barcode") {
            setIsManualBarcode(true);
        }
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleChangeCategory = (e) => {
        const { name, value } = e.target;
        setFormDataCategory({
            ...formDataCategory,
            [name]: value,
        });
    };

    const handleFileChange = (e) => {
        setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
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
            setSnackbarMessage("Product deleted successfully");
            setSnackbarOpen(true);
        } catch (error) {
            console.error("Error deleting product:", error);
        } finally {
            handleCloseDeleteDialog();
        }
    };

    const handleOpenRegisterDialog = () => {
        if (useBarcode && formData.barcode && isManualBarcode) {
            const barcodePattern = /^\d{13}$/;
            if (!barcodePattern.test(formData.barcode)) {
                setSnackbarErrorMessage("Barcode must be exactly 13 digits with no letters or special characters");
                setSnackbarErrorOpen(true);
                return;
            }

            const barcodeExists = products.some(
                (product) => product.barcode === formData.barcode && (!isEditMode || product.productId !== selectedProductId)
            );
            if (barcodeExists) {
                setSnackbarErrorMessage("This barcode is already associated with another product");
                setSnackbarErrorOpen(true);
                return;
            }
        }
        setRegisterDialogOpen(true);
    };

    const handleCloseRegisterDialog = () => {
        setRegisterDialogOpen(false);
    };

    const handleConfirmRegisterProduct = async () => {
        const requiredFields = {
            productName: formData.productName?.trim(),
            categoryName: formData.categoryName?.trim(),
            supplierCompanyName: formData.supplierCompanyName?.trim(),
        };

        if (!requiredFields.productName || !requiredFields.categoryName || !requiredFields.supplierCompanyName) {
            setSnackbarErrorMessage("Please fill in all required fields");
            setSnackbarErrorOpen(true);
            return;
        }

        if (!isEditMode) {
            if (!formData.units || Number(formData.units) <= 0) {
                setSnackbarErrorMessage("Units must be greater than zero");
                setSnackbarErrorOpen(true);
                return;
            }

            if (formData.unitType === "DISCRETE" && Number(formData.units) % 1 !== 0) {
                setSnackbarErrorMessage("Units for DISCRETE products must be an integer (e.g., 1, 2, 10)");
                setSnackbarErrorOpen(true);
                return;
            }

            if (
                !formData.buyingPrice ||
                !formData.sellingPrice ||
                Number(formData.buyingPrice) <= 0 ||
                Number(formData.sellingPrice) <= 0
            ) {
                setSnackbarErrorMessage("Buying and selling prices must be greater than zero");
                setSnackbarErrorOpen(true);
                return;
            }

            if (Number(formData.buyingPrice) > Number(formData.sellingPrice)) {
                setSnackbarErrorMessage("Buying price must be less than or equal to selling price");
                setSnackbarErrorOpen(true);
                return;
            }

            if (!formData.expireDate) {
                setSnackbarErrorMessage("Please enter a valid expiration date");
                setSnackbarErrorOpen(true);
                return;
            }
        }

        const categoryExists = categories.some((category) => category.categoryName === requiredFields.categoryName);
        if (!categoryExists) {
            setSnackbarErrorMessage("Category does not exist");
            setSnackbarErrorOpen(true);
            return;
        }

        const supplierExists = suppliers.some((supplier) => supplier.companyName === requiredFields.supplierCompanyName);
        if (!supplierExists) {
            setSnackbarErrorMessage("Supplier does not exist");
            setSnackbarErrorOpen(true);
            return;
        }

        const duplicate = products.find(
            (product) =>
                product.productName.replace(/\s*\([^)]+\)\s*$/, "").trim() === requiredFields.productName &&
                product.supplierCompanyName === requiredFields.supplierCompanyName &&
                (product.barcode == null || product.barcode === formData.barcode) &&
                (!isEditMode || product.productId !== selectedProductId)
        );
        if (duplicate && !isEditMode) {
            setSnackbarErrorMessage(
                "Product with name '" + requiredFields.productName + "' from supplier '" + requiredFields.supplierCompanyName + "' already exists"
            );
            setSnackbarErrorOpen(true);
            return;
        }

        try {
            const formattedExpireDate = formData.expireDate ? `${formData.expireDate}T00:00:00` : "";
            const productData = {
                productName: requiredFields.productName,
                categoryName: requiredFields.categoryName,
                units: Number(formData.units) || 0,
                buyingPrice: Number(formData.buyingPrice) || 0.0,
                sellingPrice: Number(formData.sellingPrice) || 0.0,
                supplierCompanyName: requiredFields.supplierCompanyName,
                barcode: useBarcode ? formData.barcode : "",
                image: formData.image,
                unitType: formData.unitType,
                expireDate: formattedExpireDate,
            };

            const response = await productServices.addProduct(productData);
            setProducts([...products, response]);
            setSnackbarMessage("Product added successfully");
            setSnackbarOpen(true);
            setFormData({
                productName: "",
                categoryName: "",
                units: "",
                buyingPrice: "",
                sellingPrice: "",
                supplierCompanyName: "",
                image: defaultImage,
                barcode: "",
                unitType: "DISCRETE",
                expireDate: "",
            });
            setUseBarcode(true);
            setIsManualBarcode(false);
        } catch (error) {
            console.error("Error adding product:", error);
            setSnackbarErrorMessage("Failed to add product: " + (error.response?.data?.message || error.message));
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseRegisterDialog();
        }
    };

    const updateSectionRef = useRef(null);

    const handleUpdateProduct = (productId) => {
        const product = products.find((product) => product.productId === productId);
        const rawProductName = product.productName.replace(/\s*\([^)]+\)\s*$/, "").trim();
        setFormData({
            productName: rawProductName,
            categoryName: product.categoryName,
            supplierCompanyName: product.supplierCompanyName,
            units: "",
            buyingPrice: "",
            sellingPrice: "",
            image: product.base64Image ? `data:image/jpeg;base64,${product.base64Image}` : defaultImage,
            barcode: product.barcode || "",
            unitType: product.unitType || "DISCRETE",
            expireDate: "",
        });
        setUseBarcode(!!product.barcode);
        setSelectedProductId(productId);
        setIsEditMode(true);
        setIsManualBarcode(false);
        updateSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleOpenUpdateDialog = () => {
        if (useBarcode && formData.barcode && isManualBarcode) {
            const barcodePattern = /^\d{13}$/;
            if (!barcodePattern.test(formData.barcode)) {
                setSnackbarErrorMessage("Barcode must be exactly 13 digits with no letters or special characters");
                setSnackbarErrorOpen(true);
                return;
            }

            const barcodeExists = products.some((product) => product.barcode === formData.barcode && product.productId !== selectedProductId);
            if (barcodeExists) {
                setSnackbarErrorMessage("This barcode is already associated with another product");
                setSnackbarErrorOpen(true);
                return;
            }
        }
        setUpdateDialogOpen(true);
    };

    const handleCloseUpdateDialog = () => {
        setUpdateDialogOpen(false);
        setSelectedProductId(null);
        setIsEditMode(false);
        setFormData({
            productName: "",
            categoryName: "",
            units: "",
            buyingPrice: "",
            sellingPrice: "",
            supplierCompanyName: "",
            image: defaultImage,
            barcode: "",
            unitType: "DISCRETE",
            expireDate: "",
        });
        setIsManualBarcode(false);
    };

    const handleConfirmUpdateProduct = async () => {
        const requiredFields = {
            productName: formData.productName?.trim(),
            categoryName: formData.categoryName?.trim(),
            supplierCompanyName: formData.supplierCompanyName?.trim(),
        };

        if (!requiredFields.productName || !requiredFields.categoryName || !requiredFields.supplierCompanyName) {
            setSnackbarErrorMessage("Please fill in all required fields");
            setSnackbarErrorOpen(true);
            return;
        }

        const categoryExists = categories.some((category) => category.categoryName === requiredFields.categoryName);
        if (!categoryExists) {
            setSnackbarErrorMessage("Category does not exist");
            setSnackbarErrorOpen(true);
            return;
        }

        const supplierExists = suppliers.some((supplier) => supplier.companyName === requiredFields.supplierCompanyName);
        if (!supplierExists) {
            setSnackbarErrorMessage("Supplier does not exist");
            setSnackbarErrorOpen(true);
            return;
        }

        try {
            const productData = {
                productName: requiredFields.productName,
                categoryName: requiredFields.categoryName,
                supplierCompanyName: requiredFields.supplierCompanyName,
                units: products.find((p) => p.productId === selectedProductId).units,
                buyingPrice: products.find((p) => p.productId === selectedProductId).buyingPrice,
                sellingPrice: products.find((p) => p.productId === selectedProductId).sellingPrice,
                barcode: products.find((p) => p.productId === selectedProductId).barcode,
                unitType: products.find((p) => p.productId === selectedProductId).unitType,
                image: formData.image,
                expireDate: products.find((p) => p.productId === selectedProductId).expireDate,
            };

            const response = await productServices.updateProduct(selectedProductId, productData);
            const updatedProducts = products.map((product) => (product.productId === selectedProductId ? response : product));
            setProducts(updatedProducts);
            setSnackbarMessage("Product updated successfully");
            setSnackbarOpen(true);
            setFormData({
                productName: "",
                categoryName: "",
                units: "",
                buyingPrice: "",
                sellingPrice: "",
                supplierCompanyName: "",
                image: defaultImage,
                barcode: "",
                unitType: "DISCRETE",
                expireDate: "",
            });
            setUseBarcode(true);
            setIsManualBarcode(false);
        } catch (error) {
            console.error("Error updating product:", error);
            setSnackbarErrorMessage("Failed to update product: " + (error.response?.data?.message || error.message));
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseUpdateDialog();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleOpenCategoryDeleteDialog = (categoryId) => {
        setSelectedCategoryId(categoryId);
        setCategoryDeleteDialogOpen(true);
    };

    const handleCloseCategoryDeleteDialog = () => {
        setCategoryDeleteDialogOpen(false);
        setSelectedCategoryId(null);
    };

    const handleDeleteCategory = async () => {
        try {
            await categoryService.deleteCategory(selectedCategoryId);
            const updatedCategories = categories.filter((category) => category.categoryId !== selectedCategoryId);
            setCategories(updatedCategories);
            setSnackbarMessage("Category deleted successfully");
            setSnackbarOpen(true);
            fetchProducts();
        } catch (error) {
            console.error("Error deleting category:", error);
            setSnackbarErrorMessage("Failed to delete category");
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseCategoryDeleteDialog();
        }
    };

    const handleOpenCategoryUpdateDialog = (category) => {
        setSelectedCategoryId(category.categoryId);
        setFormDataCategory({ newCategoryName: category.categoryName });
        setCategoryUpdateDialogOpen(true);
    };

    const handleCloseCategoryUpdateDialog = () => {
        setCategoryUpdateDialogOpen(false);
        setSelectedCategoryId(null);
        setFormDataCategory({ newCategoryName: "" });
    };

    const handleUpdateCategory = async () => {
        if (!formDataCategory.newCategoryName.trim()) {
            setSnackbarErrorMessage("Category name cannot be empty");
            setSnackbarErrorOpen(true);
            return;
        }
        const categoryExists = categories.some(
            (category) => category.categoryName === formDataCategory.newCategoryName && category.categoryId !== selectedCategoryId
        );
        if (categoryExists) {
            setSnackbarErrorMessage("Category name already exists");
            setSnackbarErrorOpen(true);
            return;
        }

        try {
            const updatedCategory = {
                categoryName: formDataCategory.newCategoryName,
            };
            await categoryService.updateCategory(selectedCategoryId, updatedCategory);
            setCategories(
                categories.map((category) =>
                    category.categoryId === selectedCategoryId ? { ...category, categoryName: formDataCategory.newCategoryName } : category
                )
            );
            setSnackbarMessage("Category updated successfully");
            setSnackbarOpen(true);
            fetchProducts();
        } catch (error) {
            console.error("Error updating category:", error);
            setSnackbarErrorMessage("Failed to update category");
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseCategoryUpdateDialog();
        }
    };

    const handleOpenCategoryRegisterDialog = () => {
        setCategoryRegisterDialogOpen(true);
    };

    const handleCloseCategoryRegisterDialog = () => {
        setCategoryRegisterDialogOpen(false);
    };

    const handleRegisterCategory = async () => {
        if (!formDataCategory.newCategoryName.trim()) {
            setSnackbarErrorMessage("Category name cannot be empty");
            setSnackbarErrorOpen(true);
            return;
        }
        const categoryExists = categories.some((category) => category.categoryName === formDataCategory.newCategoryName);
        if (categoryExists) {
            setSnackbarErrorMessage("Category already exists");
            setSnackbarErrorOpen(true);
            return;
        }

        try {
            const newCategory = {
                categoryName: formDataCategory.newCategoryName,
            };
            const response = await categoryService.addCategory(newCategory);
            setCategories([...categories, response.data]);
            setSnackbarMessage("Category added successfully");
            setSnackbarOpen(true);
            setFormDataCategory({
                newCategoryName: "",
            });
        } catch (error) {
            console.error("Error adding category:", error);
            setSnackbarErrorMessage("Failed to add category");
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseCategoryRegisterDialog();
        }
    };

    const currentDate = new Date().toISOString().split("T")[0]; // Current date: 2025-05-20

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            <Box>
                <Typography variant="h4" gutterBottom sx={{ color: "#0478C0", fontWeight: "bold" }}>
                    Inventory
                </Typography>
                <Grid container spacing={2} sx={{ marginBottom: 3 }}>
                    <Grid item xs={12} md={2.2}>
                        <Autocomplete
                            options={filterOptions}
                            getOptionLabel={(option) => option.label}
                            value={filterOptions.find((option) => option.value === filterType)}
                            onChange={(event, newValue) => setFilterType(newValue?.value || "productName")}
                            renderInput={(params) => <TextField {...params} label="Filter By" variant="outlined" />}
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
                            sx={{ bgcolor: "#00ffff", textTransform: "none", color: "black", mr: 2 }}
                            startIcon={<AddCircleIcon />}
                        >
                            Add Stock
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => handleOpenUpdateBatchDialog(null)}
                            sx={{ bgcolor: "#ff9800", textTransform: "none", color: "black" }}
                            startIcon={<UpdateIcon />}
                        >
                            Update Batch
                        </Button>
                    </Grid>
                </Grid>
                <Dialog
                    open={restockDialogOpen}
                    onClose={handleCloseRestockDialog}
                    maxWidth="md"
                    sx={{ "& .MuiDialog-paper": { minHeight: "400px", minWidth: "600px" } }}
                >
                    <DialogTitle>Restock Product</DialogTitle>
                    <DialogContent>
                        <Autocomplete
                            options={products}
                            getOptionLabel={(option) => option.productName}
                            onChange={(event, newValue) => handleOpenRestockDialog(newValue)}
                            value={selectedProduct}
                            renderInput={(params) => <TextField {...params} label="Select Product" variant="outlined" sx={{ marginTop: 2 }} />}
                        />
                        <Autocomplete
                            options={[{ batchId: null, label: "Create New Batch" }, ...batches.map((batch) => ({
                                batchId: batch.batchId,
                                label: `Batch #${batch.batchId} (Units: ${batch.units}, Buy: ${batch.buyingPrice}, Sell: ${batch.sellingPrice}, Expire: ${batch.expireDate ? batch.expireDate.split("T")[0] : "N/A"})`
                            }))]}
                            getOptionLabel={(option) => option.label}
                            onChange={(event, newValue) => setSelectedBatch(newValue?.batchId ? batches.find((b) => b.batchId === newValue.batchId) : null)}
                            renderInput={(params) => <TextField {...params} label="Select Batch" variant="outlined" sx={{ marginTop: 2 }} />}
                        />
                        <TextField
                            fullWidth
                            label="New Stock Units"
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            sx={{ marginTop: 2 }}
                            inputProps={{ step: selectedProduct?.unitType === "WEIGHT" ? "0.1" : "1" }}
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
                                <TextField
                                    fullWidth
                                    label="Expire Date (YYYY-MM-DD)"
                                    type="date"
                                    value={newExpireDate}
                                    onChange={(e) => setNewExpireDate(e.target.value)}
                                    sx={{ marginTop: 2 }}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ min: currentDate }} // Lock to future dates
                                />
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseRestockDialog}>Cancel</Button>
                        <Button onClick={handleOpenRestockConfirmDialog} variant="contained">
                            Add Stock
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={restockConfirmDialogOpen} onClose={handleCloseRestockConfirmDialog}>
                    <DialogTitle>Confirm Restock</DialogTitle>
                    <DialogContent>
                        <DialogContentText>Are you sure you want to restock this product?</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseRestockConfirmDialog}>Cancel</Button>
                        <Button onClick={handleRestock}>Confirm</Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={updateBatchDialogOpen}
                    onClose={handleCloseUpdateBatchDialog}
                    maxWidth="md"
                    sx={{ "& .MuiDialog-paper": { minHeight: "400px", minWidth: "600px" } }}
                >
                    <DialogTitle>Update Batch</DialogTitle>
                    <DialogContent>
                        <Autocomplete
                            options={products}
                            getOptionLabel={(option) => option.productName}
                            onChange={(event, newValue) => handleOpenUpdateBatchDialog(newValue)}
                            value={selectedProduct}
                            renderInput={(params) => <TextField {...params} label="Select Product" variant="outlined" sx={{ marginTop: 2 }} />}
                        />
                        <Autocomplete
                            options={batches.map((batch) => ({
                                batchId: batch.batchId,
                                label: `Batch #${batch.batchId} (Units: ${batch.units}, Buy: ${batch.buyingPrice}, Sell: ${batch.sellingPrice}, Expire: ${batch.expireDate ? batch.expireDate.split("T")[0] : "N/A"})`,
                            }))}
                            getOptionLabel={(option) => option.label}
                            onChange={(event, newValue) => {
                                const batch = newValue?.batchId ? batches.find((b) => b.batchId === newValue.batchId) : null;
                                setSelectedBatch(batch);
                                if (batch) {
                                    setUpdatedUnits(batch.units.toString());
                                    setUpdatedBuyingPrice(batch.buyingPrice.toString());
                                    setUpdatedSellingPrice(batch.sellingPrice.toString());
                                    setUpdatedExpireDate(batch.expireDate ? batch.expireDate.split("T")[0] : "");
                                } else {
                                    setUpdatedUnits("");
                                    setUpdatedBuyingPrice("");
                                    setUpdatedSellingPrice("");
                                    setUpdatedExpireDate("");
                                }
                            }}
                            renderInput={(params) => <TextField {...params} label="Select Batch" variant="outlined" sx={{ marginTop: 2 }} />}
                        />
                        <TextField
                            fullWidth
                            label="Updated Units"
                            type="number"
                            value={updatedUnits}
                            onChange={(e) => setUpdatedUnits(e.target.value)}
                            sx={{ marginTop: 2 }}
                            disabled={!selectedBatch}
                            inputProps={{ step: selectedProduct?.unitType === "WEIGHT" ? "0.1" : "1" }}
                        />
                        <TextField
                            fullWidth
                            label="Updated Buying Price"
                            type="number"
                            value={updatedBuyingPrice}
                            onChange={(e) => setUpdatedBuyingPrice(e.target.value)}
                            sx={{ marginTop: 2 }}
                            disabled={!selectedBatch}
                        />
                        <TextField
                            fullWidth
                            label="Updated Selling Price"
                            type="number"
                            value={updatedSellingPrice}
                            onChange={(e) => setUpdatedSellingPrice(e.target.value)}
                            sx={{ marginTop: 2 }}
                            disabled={!selectedBatch}
                        />
                        <TextField
                            fullWidth
                            label="Updated Expire Date (YYYY-MM-DD)"
                            type="date"
                            value={updatedExpireDate}
                            onChange={(e) => setUpdatedExpireDate(e.target.value)}
                            sx={{ marginTop: 2 }}
                            disabled={!selectedBatch}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: currentDate }} // Lock to future dates
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseUpdateBatchDialog}>Cancel</Button>
                        <Button onClick={handleOpenDeleteBatchDialog} variant="contained" color="error" disabled={!selectedBatch}>
                            Delete Batch
                        </Button>
                        <Button onClick={handleOpenUpdateBatchConfirmDialog} variant="contained" disabled={!selectedBatch}>
                            Update Batch
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={updateBatchConfirmDialogOpen} onClose={handleCloseUpdateBatchConfirmDialog}>
                    <DialogTitle>Confirm Update Batch</DialogTitle>
                    <DialogContent>
                        <DialogContentText>Are you sure you want to update this batch?</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseUpdateBatchConfirmDialog}>Cancel</Button>
                        <Button onClick={handleUpdateBatch}>Confirm</Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={deleteBatchDialogOpen} onClose={handleCloseDeleteBatchDialog}>
                    <DialogTitle>Confirm Delete Batch</DialogTitle>
                    <DialogContent>
                        <DialogContentText>Are you sure you want to delete this batch? This action cannot be undone.</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDeleteBatchDialog}>Cancel</Button>
                        <Button onClick={handleConfirmDeleteBatch} variant="contained" color="error">
                            Delete
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
                                <TableCell>Units</TableCell>
                                <TableCell>Unit Type</TableCell>
                                <TableCell>Buying Price</TableCell>
                                <TableCell>Selling Price</TableCell>
                                <TableCell>Expire Date</TableCell>
                                <TableCell>Supplier</TableCell>
                                <TableCell>Barcode</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProducts.map((product) => (
                                <TableRow key={product.productId} hover>
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
                                    <TableCell>{product.units}</TableCell>
                                    <TableCell>{product.unitType}</TableCell>
                                    <TableCell>{product.buyingPrice}</TableCell>
                                    <TableCell>{product.sellingPrice}</TableCell>
                                    <TableCell>{product.expireDate ? product.expireDate.split("T")[0] : "N/A"}</TableCell>
                                    <TableCell>{product.supplierCompanyName}</TableCell>
                                    <TableCell>{product.barcode || "#N/A"}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <IconButton
                                                onClick={() => handleUpdateProduct(product.productId)}
                                                title="Edit Product"
                                                sx={{ color: "#007bff" }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleOpenDeleteDialog(product.productId)}
                                                title="Delete Product"
                                                sx={{ color: "#dc3545" }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleOpenRestockDialog(product)}
                                                title="Restock Product"
                                                sx={{ color: "#28a745" }}
                                            >
                                                <AddCircleIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleOpenUpdateBatchDialog(product)}
                                                title="Update Batch"
                                                sx={{ color: "#ff9800" }}
                                            >
                                                <UpdateIcon />
                                            </IconButton>
                                        </Box>
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
                <Typography variant="h4" gutterBottom sx={{ color: "#0478C0" }}>
                    {isEditMode ? "Update Product" : "Add New Product"}
                </Typography>
                <Paper elevation={3} sx={{ padding: 4, marginTop: 2 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" align="center" sx={{ marginBottom: 2, fontWeight: "bold", color: "#2e7d32" }}>
                                Product Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Product Name *"
                                        name="productName"
                                        value={formData.productName}
                                        onChange={handleChange}
                                        variant="outlined"
                                        disabled={isEditMode && !formData.productName}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Autocomplete
                                        options={categories.map((category) => category.categoryName)}
                                        value={formData.categoryName || ""}
                                        onChange={handleCategoryChange}
                                        renderInput={(params) => <TextField {...params} label="Category *" variant="outlined" />}
                                        disabled={isEditMode && !formData.categoryName}
                                    />
                                </Grid>
                                {!isEditMode && (
                                    <>
                                        <Grid item xs={12}>
                                            <FormControl fullWidth variant="outlined">
                                                <InputLabel>Unit Type *</InputLabel>
                                                <Select
                                                    label="Unit Type *"
                                                    name="unitType"
                                                    value={formData.unitType}
                                                    onChange={handleChange}
                                                >
                                                    <MenuItem value="DISCRETE">Discrete (e.g., 1, 2, 10 units)</MenuItem>
                                                    <MenuItem value="WEIGHT">Weight (e.g., 1.5 kg, 2.75 kg)</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Initial Units *"
                                                name="units"
                                                type="number"
                                                value={formData.units}
                                                onChange={handleChange}
                                                variant="outlined"
                                                inputProps={{ step: formData.unitType === "WEIGHT" ? "0.1" : "1" }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Buying Price *"
                                                name="buyingPrice"
                                                type="number"
                                                value={formData.buyingPrice}
                                                onChange={handleChange}
                                                variant="outlined"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Selling Price *"
                                                name="sellingPrice"
                                                type="number"
                                                value={formData.sellingPrice}
                                                onChange={handleChange}
                                                variant="outlined"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Expire Date (YYYY-MM-DD) *"
                                                name="expireDate"
                                                type="date"
                                                value={formData.expireDate}
                                                onChange={handleChange}
                                                variant="outlined"
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ min: currentDate }} // Lock to future dates
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Autocomplete
                                                options={suppliers.map((supplier) => supplier.companyName)}
                                                value={formData.supplierCompanyName || ""}
                                                onChange={handleSupplierChange}
                                                renderInput={(params) => <TextField {...params} label="Supplier *" variant="outlined" />}
                                            />
                                        </Grid>
                                    </>
                                )}
                                {isEditMode && (
                                    <Grid item xs={12}>
                                        <Autocomplete
                                            options={suppliers.map((supplier) => supplier.companyName)}
                                            value={formData.supplierCompanyName || ""}
                                            onChange={handleSupplierChange}
                                            renderInput={(params) => <TextField {...params} label="Supplier *" variant="outlined" />}
                                            disabled={isEditMode && !formData.supplierCompanyName}
                                        />
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={useBarcode}
                                                onChange={(e) => {
                                                    setUseBarcode(e.target.checked);
                                                    if (!e.target.checked) {
                                                        setFormData((prev) => ({ ...prev, barcode: "" }));
                                                        setIsManualBarcode(false);
                                                    }
                                                }}
                                                color="primary"
                                                disabled={isEditMode}
                                            />
                                        }
                                        label="Use Barcode (untick if barcode is not available)"
                                    />
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={9}>
                                            <TextField
                                                fullWidth
                                                label="Barcode"
                                                name="barcode"
                                                value={formData.barcode}
                                                onChange={handleChange}
                                                variant="outlined"
                                                disabled={!useBarcode || isEditMode}
                                            />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Button
                                                variant="contained"
                                                onClick={handleOpenScannerDialog}
                                                sx={{ bgcolor: "#007bff", textTransform: "none" }}
                                                disabled={!useBarcode || isEditMode}
                                            >
                                                Scan
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <Typography variant="h6" align="center" sx={{ marginBottom: 2, fontWeight: "bold", color: "#2e7d32" }}>
                                Product Image
                            </Typography>
                            <Box
                                sx={{
                                    width: "200px",
                                    height: "200px",
                                    border: "2px dashed #ccc",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    backgroundColor: "#f9f9f9",
                                    position: "relative",
                                    "&:hover": {
                                        borderColor: "#007bff",
                                    },
                                }}
                                onClick={() => !isEditMode && document.getElementById("fileInput").click()}
                            >
                                {!formData.image && <Typography variant="h4" sx={{ color: "#ccc" }}>+</Typography>}
                                <input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} disabled={isEditMode} />
                                {formData.image && (
                                    <img
                                        src={formData.image instanceof File ? URL.createObjectURL(formData.image) : formData.image}
                                        alt="Preview"
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: "8px",
                                        }}
                                    />
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                        {isEditMode && (
                            <Button
                                variant="contained"
                                style={{ background: "#dc3545", textTransform: "none", width: "200px", height: "50px", fontSize: "19px", marginRight: 2 }}
                                onClick={handleCloseUpdateDialog}
                                size="large"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            style={{ background: "#007bff", textTransform: "none", width: "200px", height: "50px", fontSize: "19px" }}
                            onClick={isEditMode ? handleOpenUpdateDialog : handleOpenRegisterDialog}
                            size="large"
                        >
                            {isEditMode ? "Update Product" : "Add Product"}
                        </Button>
                    </Grid>
                </Paper>
            </Box>

            <Box>
                <Typography variant="h4" gutterBottom sx={{ color: "#0478C0", paddingTop: 5 }}>
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
                                <TableRow key={category.categoryId} hover>
                                    <TableCell>{category.categoryId}</TableCell>
                                    <TableCell>{category.categoryName}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <IconButton
                                                onClick={() => handleOpenCategoryUpdateDialog(category)}
                                                title="Edit Category"
                                                sx={{ color: "#007bff" }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleOpenCategoryDeleteDialog(category.categoryId)}
                                                title="Delete Category"
                                                sx={{ color: "#dc3545" }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box sx={{ paddingTop: 5 }}>
                <Typography variant="h4" gutterBottom sx={{ color: "#0478C0" }}>
                    Add New Category
                </Typography>
                <Paper elevation={3} sx={{ padding: 4, marginTop: 2 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" align="center" sx={{ marginBottom: 2, fontWeight: "bold", color: "#2e7d32" }}>
                                Category Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="New Category Name *"
                                        name="newCategoryName"
                                        value={formDataCategory.newCategoryName}
                                        onChange={handleChangeCategory}
                                        variant="outlined"
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                        <Button
                            variant="contained"
                            style={{ background: "#007bff", textTransform: "none", width: "200px", height: "50px", fontSize: "19px" }}
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
                    <DialogContentText>Are you sure you want to delete this product?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                    <Button onClick={handleConfirmDelete}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={registerDialogOpen} onClose={handleCloseRegisterDialog}>
                <DialogTitle>Confirm Registration</DialogTitle>
                <DialogContent>
                    <DialogContentText>Are you sure you want to register this product?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRegisterDialog}>Cancel</Button>
                    <Button onClick={handleConfirmRegisterProduct}>Register</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={updateDialogOpen} onClose={handleCloseUpdateDialog}>
                <DialogTitle>Confirm Update</DialogTitle>
                <DialogContent>
                    <DialogContentText>Are you sure you want to update this product?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUpdateDialog}>Cancel</Button>
                    <Button onClick={handleConfirmUpdateProduct}>Update</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={categoryRegisterDialogOpen} onClose={handleCloseCategoryRegisterDialog}>
                <DialogTitle>Confirm Registration</DialogTitle>
                <DialogContent>
                    <DialogContentText>Are you sure you want to add this category?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCategoryRegisterDialog}>Cancel</Button>
                    <Button onClick={handleRegisterCategory}>Register</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={categoryDeleteDialogOpen} onClose={handleCloseCategoryDeleteDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>Are you sure you want to delete this category?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCategoryDeleteDialog}>Cancel</Button>
                    <Button onClick={handleDeleteCategory}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={categoryUpdateDialogOpen} onClose={handleCloseCategoryUpdateDialog}>
                <DialogTitle>Update Category</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Category Name *"
                        name="newCategoryName"
                        value={formDataCategory.newCategoryName}
                        onChange={handleChangeCategory}
                        variant="outlined"
                        sx={{ marginTop: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCategoryUpdateDialog}>Cancel</Button>
                    <Button onClick={handleUpdateCategory}>Update</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={scannerDialogOpen}
                onClose={handleCloseScannerDialog}
                maxWidth="lg"
                fullWidth
                sx={{ "& .MuiDialog-paper": { width: "90vw", maxWidth: "600px", height: "70vh", maxHeight: "500px" } }}
            >
                <DialogTitle>Scan Barcode</DialogTitle>
                <DialogContent>
                    <div
                        id="reader"
                        ref={readerRef}
                        style={{ width: "100%", height: "calc(100% - 20px)", minHeight: "300px", border: "1px solid #ccc" }}
                    ></div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseScannerDialog}>Cancel</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: "100%", height: "100%" }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            <Snackbar
                open={snackbarErrorOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarErrorOpen(false)}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert onClose={() => setSnackbarErrorOpen(false)} severity="error" sx={{ width: "100%", height: "100%" }}>
                    {snackbarErrorMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Inventory;