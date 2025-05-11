import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel,
    Grid, Divider, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Html5QrcodeScanner } from "html5-qrcode";
import productService from '../services/productServices';
import orderServices from '../services/orderServices';
import authService from '../services/authService';
import Receipt from './Receipt';

const PosTerminal = () => {
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [barcode, setBarcode] = useState('');
    const [totalAmount, setTotalAmount] = useState(0);
    const [customerName, setCustomerName] = useState('POS Customer');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [creditCustomerDetails, setCreditCustomerDetails] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
    });
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [scannerDialogOpen, setScannerDialogOpen] = useState(false);
    const [lastAddedItem, setLastAddedItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const scannerRef = useRef(null);

    const loggedInUser = authService.getLoggedInUser();
    const staffName = loggedInUser?.username || 'Unknown';

    const fetchProducts = async () => {
        try {
            const response = await productService.getAllProducts();
            if (response && response.data) {
                setProducts(response.data);
            } else {
                throw new Error('No data returned from getAllProducts');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setErrorMessage('Failed to load products.');
            setOpenSnackbar(true);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const syncOfflineSales = async () => {
            const offlineSales = JSON.parse(localStorage.getItem('offlineSales') || '[]');
            if (offlineSales.length > 0 && navigator.onLine) {
                for (const sale of offlineSales) {
                    try {
                        const createOrderPromise = orderServices.createPosOrder(sale);
                        if (!createOrderPromise || typeof createOrderPromise.then !== 'function') {
                            throw new Error('createPosOrder did not return a Promise');
                        }
                        await createOrderPromise;
                        for (const item of sale.items) {
                            const product = products.find(p => p.productId === item.productId);
                            if (product) {
                                const restockPromise = productService.restockProduct(
                                    product.productId,
                                    item.quantity,
                                    product.buyingPrice,
                                    product.sellingPrice,
                                    null
                                );
                                if (!restockPromise || typeof restockPromise.then !== 'function') {
                                    throw new Error('restockProduct did not return a Promise');
                                }
                                await restockPromise;
                            }
                        }
                    } catch (error) {
                        console.error('Error syncing offline sale:', error);
                    }
                }
                localStorage.setItem('offlineSales', '[]');
                fetchProducts();
            }
        };

        window.addEventListener('online', syncOfflineSales);
        return () => window.removeEventListener('online', syncOfflineSales);
    }, [products]);

    useEffect(() => {
        if (!scannerDialogOpen) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setErrorMessage('Camera access is not supported in this browser or environment.');
            setOpenSnackbar(true);
            setScannerDialogOpen(false);
            return;
        }

        if (!window.isSecureContext) {
            setErrorMessage('Camera access requires a secure context (HTTPS or localhost).');
            setOpenSnackbar(true);
            setScannerDialogOpen(false);
            return;
        }

        const mediaPromise = navigator.mediaDevices.getUserMedia({ video: true });
        if (!mediaPromise || typeof mediaPromise.then !== 'function') {
            setErrorMessage('navigator.mediaDevices.getUserMedia did not return a Promise');
            setOpenSnackbar(true);
            setScannerDialogOpen(false);
            return;
        }

        mediaPromise
            .then((stream) => {
                console.log("Camera access granted:", stream);
                stream.getTracks().forEach(track => track.stop());
                initializeScanner();
            })
            .catch((err) => {
                console.error("Camera permission error:", err.name, err.message);
                let errorMsg = 'Scan failed. ';
                if (err.name === 'NotAllowedError') {
                    errorMsg += 'Camera access was denied. Please grant permission and try again.';
                } else if (err.name === 'NotFoundError') {
                    errorMsg += 'No camera device found on this device.';
                } else {
                    errorMsg += 'Unable to access camera: ' + err.message;
                }
                setErrorMessage(errorMsg);
                setOpenSnackbar(true);
                setScannerDialogOpen(false);
            });

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

            scanner.render(async (data) => {
                try {
                    const responsePromise = productService.getProductByBarcode(data);
                    if (!responsePromise || typeof responsePromise.then !== 'function') {
                        throw new Error('getProductByBarcode did not return a Promise');
                    }
                    const response = await responsePromise;
                    const product = response.data;
                    if (product) {
                        if (product.quantity <= 0) {
                            setErrorMessage(`${product.productName} is out of stock.`);
                            setOpenSnackbar(true);
                        } else {
                            addOrUpdateCartItem(product.productId);
                            handleCloseScannerDialog();
                        }
                    } else {
                        setErrorMessage('Product not found for scanned barcode.');
                        setOpenSnackbar(true);
                    }
                } catch (error) {
                    console.error("Product fetch error:", error);
                    setErrorMessage('Failed to fetch product: ' + (error.message || 'Unknown error'));
                    setOpenSnackbar(true);
                }
            }, (error) => {
                console.error("Scanner initialization error:", error);
                let errorMsg = 'Scan failed. ';
                if (error.message.includes('Permission denied')) {
                    errorMsg += 'Camera access was denied. Please grant permission and try again.';
                } else if (error.message.includes('No device found')) {
                    errorMsg += 'No camera device found on this device.';
                } else {
                    errorMsg += 'Scanner error: ' + error.message;
                }
                setErrorMessage(errorMsg);
                setOpenSnackbar(true);
                handleCloseScannerDialog();
            });
        };

        return () => {
            if (scannerRef.current) {
                const clearPromise = scannerRef.current.clear();
                if (clearPromise && typeof clearPromise.then === 'function') {
                    clearPromise.catch((err) => console.error("Failed to clear scanner on unmount:", err));
                }
                scannerRef.current = null;
            }
        };
    }, [scannerDialogOpen, cart, totalAmount]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['ArrowUp', 'ArrowDown', 'Insert', 'Escape', ' '].includes(e.key)) {
                e.preventDefault();
            }

            const activeElement = document.activeElement;
            const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

            if (isInputFocused && e.key === 'Enter') {
                setErrorMessage('');
                setSuccessMessage('');
                console.log('Enter pressed, clearing messages. Barcode:', barcode);
            }

            if (e.key === 'Enter' && isInputFocused) {
                const input = barcode.trim();
                console.log('Processing Enter with input:', input);
                if (!input) {
                    setErrorMessage('Please enter a product ID or barcode.');
                    setOpenSnackbar(true);
                    console.log('Empty input detected, error set.');
                    return;
                }

                const productIdNum = Number(input);
                const product = products.find(p =>
                    p.barcode === input || (productIdNum && p.productId === productIdNum)
                );

                if (product) {
                    console.log('Product found:', product);
                    addOrUpdateCartItem(product.productId);
                } else {
                    setErrorMessage(`Product not found for ID or barcode: ${input}`);
                    setOpenSnackbar(true);
                    console.log('Product not found, error set.');
                }
                setBarcode('');
                console.log('Barcode cleared.');
                return;
            }

            if (e.key === ' ' && !isInputFocused && !scannerDialogOpen) {
                handleOpenScannerDialog();
                return;
            }

            if (e.key === 'Insert' && !isInputFocused && !openPaymentDialog) {
                handleCheckout();
                return;
            }

            if (e.key === 'Insert' && !isInputFocused && openPaymentDialog) {
                confirmPayment();
                return;
            }

            if (e.key === 'Escape' && openPaymentDialog) {
                setOpenPaymentDialog(false);
                return;
            }

            if (openPaymentDialog || scannerDialogOpen) return;

            if (cart.length === 0) return;

            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                const currentIndex = selectedItem
                    ? cart.findIndex(item => item.productId === selectedItem)
                    : -1;

                let newIndex;
                if (e.key === 'ArrowUp') {
                    newIndex = currentIndex <= 0 ? cart.length - 1 : currentIndex - 1;
                } else {
                    newIndex = currentIndex >= cart.length - 1 ? 0 : currentIndex + 1;
                }

                const newSelectedItem = cart[newIndex].productId;
                setSelectedItem(newSelectedItem);
            }

            if (e.key === '+' || e.key === '-') {
                if (!selectedItem) {
                    setErrorMessage('Please select an item from the cart to adjust quantity.');
                    setOpenSnackbar(true);
                    return;
                }

                const item = cart.find(item => item.productId === selectedItem);
                const product = products.find(p => p.productId === selectedItem);
                if (!item || !product) return;

                let newQuantity;
                if (e.key === '+') {
                    newQuantity = item.quantity + 1;
                    if (newQuantity > product.quantity) {
                        setErrorMessage(`Cannot increase quantity. Only ${product.quantity} units of ${product.productName} in stock.`);
                        setOpenSnackbar(true);
                        return;
                    }
                    setTotalAmount(prevTotal => prevTotal + product.sellingPrice);
                } else {
                    newQuantity = Math.max(1, item.quantity - 1);
                    if (newQuantity < item.quantity) {
                        setTotalAmount(prevTotal => prevTotal - product.sellingPrice);
                    } else {
                        setErrorMessage(`Cannot decrease quantity. Quantity is already at the minimum (1) for ${product.productName}.`);
                        setOpenSnackbar(true);
                        return;
                    }
                }

                setCart(cart.map(cartItem =>
                    cartItem.productId === selectedItem
                        ? { ...cartItem, quantity: newQuantity }
                        : cartItem
                ));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, selectedItem, products, totalAmount, openPaymentDialog, scannerDialogOpen, barcode]);

    const addOrUpdateCartItem = (productId) => {
        const product = products.find(p => p.productId === productId);
        console.log('addOrUpdateCartItem called with productId:', productId, 'Product:', product);
        if (product && product.quantity > 0) {
            const existingItem = cart.find(item => item.productId === productId);
            if (existingItem) {
                setErrorMessage(`${product.productName} is already in the cart. Use +/- keys to adjust quantity after selecting it.`);
                setOpenSnackbar(true);
                console.log('Duplicate item detected, error set.');
            } else {
                setCart([...cart, { ...product, quantity: 1 }]);
                setTotalAmount(totalAmount + product.sellingPrice);
                setLastAddedItem(productId);
                setSelectedItem(productId);
                setSuccessMessage('Product added successfully.');
                setOpenSnackbar(true);
                console.log('Product added successfully, success message set.');
                setTimeout(() => setLastAddedItem(null), 1000);
            }
        } else if (product) {
            setErrorMessage(`${product.productName} is out of stock.`);
            setOpenSnackbar(true);
            console.log('Product out of stock, error set.');
        } else {
            setErrorMessage('Product not found.');
            setOpenSnackbar(true);
            console.log('Product not found in addOrUpdateCartItem, error set.');
        }
    };

    const handleOpenScannerDialog = () => {
        setScannerDialogOpen(true);
    };

    const handleCloseScannerDialog = () => {
        setScannerDialogOpen(false);
        if (scannerRef.current) {
            const clearPromise = scannerRef.current.clear();
            if (clearPromise && typeof clearPromise.then === 'function') {
                clearPromise.catch((err) => console.error("Failed to clear scanner on dialog close:", err));
            }
            scannerRef.current = null;
        }
    };

    const handleSelectItem = (productId) => {
        setSelectedItem(productId);
    };

    const removeFromCart = (productId) => {
        const item = cart.find(i => i.productId === productId);
        setCart(cart.filter(i => i.productId !== productId));
        setTotalAmount(totalAmount - (item.sellingPrice * item.quantity));
        if (selectedItem === productId) setSelectedItem(null);
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            setErrorMessage('Cart is empty.');
            setOpenSnackbar(true);
            return;
        }
        setOpenPaymentDialog(true);
    };

    const validateCreditCustomerDetails = () => {
        const newErrors = {};
        let isValid = true;

        if (!creditCustomerDetails.firstName.trim()) {
            newErrors.firstName = 'First name is required';
            isValid = false;
        }
        if (!creditCustomerDetails.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
            isValid = false;
        }
        if (!creditCustomerDetails.phone.trim()) {
            newErrors.phone = 'Phone number is required';
            isValid = false;
        } else if (!/^\d{10}$/.test(creditCustomerDetails.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
            isValid = false;
        }
        if (!creditCustomerDetails.address.trim()) {
            newErrors.address = 'Address is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleCreditCustomerInputChange = (e) => {
        const { name, value } = e.target;
        setCreditCustomerDetails({ ...creditCustomerDetails, [name]: value });
    };

    const confirmPayment = async () => {
        setErrorMessage('');
        if (cart.length === 0) {
            setErrorMessage('Cart is empty.');
            setOpenSnackbar(true);
            return;
        }

        let finalCustomerName = customerName || 'POS Customer';

        if (paymentMethod === 'Credit Purpose') {
            const isValid = validateCreditCustomerDetails();
            if (!isValid) {
                return;
            }
            finalCustomerName = `${creditCustomerDetails.firstName} ${creditCustomerDetails.lastName}`;
        }

        try {
            const currentDate = new Date();
            const transactionDate = currentDate.toLocaleString();
            console.log('Transaction Date set:', transactionDate);

            const order = {
                customerName: finalCustomerName,
                paymentMethod: paymentMethod,
                totalAmount: totalAmount,
                status: 'COMPLETED',
                orderDate: currentDate.toISOString(),
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    sellingPrice: item.sellingPrice,
                })),
                creditCustomerDetails: paymentMethod === 'Credit Purpose' ? {
                    firstName: creditCustomerDetails.firstName,
                    lastName: creditCustomerDetails.lastName,
                    phone: creditCustomerDetails.phone,
                    email: creditCustomerDetails.email,
                    address: creditCustomerDetails.address,
                } : null,
            };

            let tempOrderId = null;
            let newOrder = null;

            if (!navigator.onLine) {
                const offlineSales = JSON.parse(localStorage.getItem('offlineSales') || '[]');
                tempOrderId = `OFFLINE-${Date.now()}`;
                offlineSales.push({ ...order, tempOrderId });
                localStorage.setItem('offlineSales', JSON.stringify(offlineSales));
                setSuccessMessage('Sale recorded offline. Will sync when online.');
                setOpenSnackbar(true);
            } else {
                const createOrderPromise = orderServices.createPosOrder(order);
                if (!createOrderPromise || typeof createOrderPromise.then !== 'function') {
                    throw new Error('createPosOrder did not return a Promise');
                }
                const response = await createOrderPromise;
                if (!response || !response.data || !response.data.order) {
                    throw new Error('Invalid response from createPosOrder');
                }
                newOrder = response.data.order;
                setSuccessMessage('Sale completed successfully!');
                setOpenSnackbar(true);
            }

            setIsPrinting(true); // Trigger printing
            setCart([]);
            setTotalAmount(0);
            setCreditCustomerDetails({
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                address: '',
            });
            setOpenPaymentDialog(false);
            fetchProducts();
        } catch (error) {
            console.error('Error processing sale:', error);
            setErrorMessage(error.message || 'Failed to process sale. Please try again.');
            setOpenSnackbar(true);
        }
    };

    return (
        <Box sx={{ padding: 3, backgroundColor: '#f5f5f5', minHeight: '100vh', paddingTop: 7 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold', mb: 3 }}>
                POS Terminal
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#333', fontWeight: 'medium' }}>
                            Scan Products
                        </Typography>
                        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField
                                label="Scan Barcode or Enter Product ID"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                helperText="Press Enter to add product, Space to scan, Insert to checkout, Up/Down to select, +/- to adjust"
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleOpenScannerDialog}
                                sx={{ height: '40px', minWidth: '120px' }}
                            >
                                Scan
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#333', fontWeight: 'medium' }}>
                            Cart Details
                        </Typography>
                        <TableContainer sx={{ maxHeight: '400px', overflow: 'auto' }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ backgroundColor: '#0478C0', color: '#fff', fontWeight: 'bold' }}>
                                            Product Name
                                        </TableCell>
                                        <TableCell sx={{ backgroundColor: '#0478C0', color: '#fff', fontWeight: 'bold' }}>
                                            Quantity
                                        </TableCell>
                                        <TableCell sx={{ backgroundColor: '#0478C0', color: '#fff', fontWeight: 'bold' }}>
                                            Price
                                        </TableCell>
                                        <TableCell sx={{ backgroundColor: '#0478C0', color: '#fff', fontWeight: 'bold' }}>
                                            Subtotal
                                        </TableCell>
                                        <TableCell sx={{ backgroundColor: '#0478C0', color: '#fff', fontWeight: 'bold' }}>
                                            Action
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cart.map((item) => (
                                        <TableRow
                                            key={item.productId}
                                            sx={{
                                                backgroundColor: selectedItem === item.productId ? '#b3e5fc' : lastAddedItem === item.productId ? '#e3f2fd' : 'inherit',
                                                transition: 'background-color 0.5s',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => handleSelectItem(item.productId)}
                                        >
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>Rs.{item.sellingPrice.toFixed(2)}</TableCell>
                                            <TableCell>Rs.{(item.quantity * item.sellingPrice).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFromCart(item.productId);
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {cart.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ textAlign: 'center', color: '#666' }}>
                                                Cart is empty
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ color: '#0478C0' }}>
                                Total: Rs.{totalAmount.toFixed(2)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Checkout
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Dialog
                open={scannerDialogOpen}
                onClose={handleCloseScannerDialog}
                maxWidth="lg"
                fullWidth
                sx={{ '& .MuiDialog-paper': { width: '90vw', maxWidth: '600px', height: '70vh', maxHeight: '500px' } }}
            >
                <DialogTitle sx={{ backgroundColor: '#0478C0', color: '#fff' }}>Scan Barcode</DialogTitle>
                <DialogContent>
                    <Box
                        id="reader"
                        sx={{
                            width: '100%',
                            height: 'calc(100% - 20px)',
                            minHeight: '300px',
                            border: '2px solid #0478C0',
                            borderRadius: '2px !important',
                            overflow: 'hidden',
                            backgroundColor: '#000',
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseScannerDialog} color="primary">
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#0478C0', color: '#fff' }}>Confirm Payment</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {paymentMethod !== 'Credit Purpose' && (
                        <TextField
                            label="Customer Name (Optional)"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                        />
                    )}
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Total Amount: Rs.{totalAmount.toFixed(2)}
                    </Typography>
                    <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            label="Payment Method"
                        >
                            <MenuItem value="Cash">Cash</MenuItem>
                            <MenuItem value="Credit Purpose">Credit Purpose</MenuItem>
                        </Select>
                    </FormControl>
                    {paymentMethod === 'Credit Purpose' && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="First Name"
                                    name="firstName"
                                    value={creditCustomerDetails.firstName}
                                    onChange={handleCreditCustomerInputChange}
                                    fullWidth
                                    required
                                    error={!!errors.firstName}
                                    helperText={errors.firstName}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Last Name"
                                    name="lastName"
                                    value={creditCustomerDetails.lastName}
                                    onChange={handleCreditCustomerInputChange}
                                    fullWidth
                                    required
                                    error={!!errors.lastName}
                                    helperText={errors.lastName}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Phone Number"
                                    name="phone"
                                    value={creditCustomerDetails.phone}
                                    onChange={handleCreditCustomerInputChange}
                                    fullWidth
                                    required
                                    error={!!errors.phone}
                                    helperText={errors.phone}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Email (Optional)"
                                    name="email"
                                    type="email"
                                    value={creditCustomerDetails.email}
                                    onChange={handleCreditCustomerInputChange}
                                    fullWidth
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Address"
                                    name="address"
                                    value={creditCustomerDetails.address}
                                    onChange={handleCreditCustomerInputChange}
                                    fullWidth
                                    required
                                    error={!!errors.address}
                                    helperText={errors.address}
                                    variant="outlined"
                                    size="small"
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPaymentDialog(false)} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={confirmPayment} color="primary" variant="contained">
                        Confirm Payment
                    </Button>
                </DialogActions>
            </Dialog>

            <Receipt
                isPrinting={isPrinting}
                onPrintComplete={() => setIsPrinting(false)}
                cart={cart}
                customerName={customerName}
                paymentMethod={paymentMethod}
                totalAmount={totalAmount}
                staffName={staffName}
            />

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => {
                    setOpenSnackbar(false);
                    setErrorMessage('');
                    setSuccessMessage('');
                }}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => {
                        setOpenSnackbar(false);
                        setErrorMessage('');
                        setSuccessMessage('');
                    }}
                    severity={errorMessage ? 'error' : 'success'}
                    sx={{ width: '100%' }}
                >
                    {errorMessage || successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PosTerminal;