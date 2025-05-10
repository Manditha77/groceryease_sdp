import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel,
    Grid, Divider, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Html5QrcodeScanner } from "html5-qrcode";
import productService from '../services/productServices';
import orderServices from '../services/orderServices';
import authService from '../services/authService';

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
    const [returnOrderId, setReturnOrderId] = useState('');
    const [openReturnDialog, setOpenReturnDialog] = useState(false);
    const [newOrder, setNewOrder] = useState(null);
    const [scannerDialogOpen, setScannerDialogOpen] = useState(false);
    const [lastAddedItem, setLastAddedItem] = useState(null);
    const receiptRef = useRef();
    const scannerRef = useRef(null);

    const handlePrintReceipt = useReactToPrint({
        content: () => receiptRef.current,
    });

    const fetchProducts = async () => {
        try {
            const response = await productService.getAllProducts();
            setProducts(response.data || []);
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
                        await orderServices.createPosOrder(sale);
                        for (const item of sale.items) {
                            const product = products.find(p => p.productId === item.productId);
                            if (product) {
                                await productService.restockProduct(product.productId, item.quantity, product.buyingPrice, product.sellingPrice, null);
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

        if (!window.isSecureContext) {
            setErrorMessage('Camera access requires a secure context (HTTPS or localhost).');
            setOpenSnackbar(true);
            setScannerDialogOpen(false);
            return;
        }

        navigator.mediaDevices.getUserMedia({ video: true })
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
                    const response = await productService.getProductByBarcode(data);
                    const product = response.data;
                    if (product) {
                        if (product.quantity <= 0) {
                            setErrorMessage(`${product.productName} is out of stock.`);
                            setOpenSnackbar(true);
                        } else {
                            const existingItem = cart.find(item => item.productId === product.productId);
                            if (existingItem) {
                                setCart(cart.map(item =>
                                    item.productId === product.productId
                                        ? { ...item, quantity: item.quantity + 1 }
                                        : item
                                ));
                            } else {
                                setCart([...cart, { ...product, quantity: 1 }]);
                            }
                            setTotalAmount(totalAmount + product.sellingPrice);
                            setLastAddedItem(product.productId);
                            setTimeout(() => setLastAddedItem(null), 1000);
                            handleCloseScannerDialog();
                        }
                    } else {
                        setErrorMessage('Product not found for scanned barcode.');
                        setOpenSnackbar(true);
                    }
                } catch (error) {
                    console.error("Product fetch error:", error);
                    setErrorMessage('Failed to fetch product: ' + (error.response?.data?.message || error.message));
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
                scannerRef.current.clear().catch((err) => console.error("Failed to clear scanner on unmount:", err));
                scannerRef.current = null;
            }
        };
    }, [scannerDialogOpen, cart, totalAmount]);

    const handleBarcodeScan = async (e) => {
        if (e.key === 'Enter') {
            const input = barcode.trim();
            const productIdNum = Number(input);
            const product = products.find(p =>
                p.barcode === input || (productIdNum && p.productId === productIdNum)
            );

            if (product) {
                if (product.quantity <= 0) {
                    setErrorMessage(`${product.productName} is out of stock.`);
                    setOpenSnackbar(true);
                    setBarcode('');
                    return;
                }
                const existingItem = cart.find(item => item.productId === product.productId);
                if (existingItem) {
                    setCart(cart.map(item =>
                        item.productId === product.productId
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ));
                } else {
                    setCart([...cart, { ...product, quantity: 1 }]);
                }
                setTotalAmount(totalAmount + product.sellingPrice);
                setLastAddedItem(product.productId);
                setTimeout(() => setLastAddedItem(null), 1000);
            } else {
                setErrorMessage('Product not found.');
                setOpenSnackbar(true);
            }
            setBarcode('');
        }
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

    const removeFromCart = (productId) => {
        const item = cart.find(i => i.productId === productId);
        setCart(cart.filter(i => i.productId !== productId));
        setTotalAmount(totalAmount - (item.sellingPrice * item.quantity));
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

            try {
                finalCustomerName = `${creditCustomerDetails.firstName} ${creditCustomerDetails.lastName}`;
            } catch (error) {
                console.error('Error registering credit customer:', error);
                setErrorMessage('Failed to register credit customer. Please try again.');
                setOpenSnackbar(true);
                return;
            }
        }

        try {
            const order = {
                customerName: finalCustomerName,
                paymentMethod: paymentMethod,
                totalAmount: totalAmount,
                status: 'COMPLETED',
                orderDate: new Date().toISOString(),
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

            if (!navigator.onLine) {
                const offlineSales = JSON.parse(localStorage.getItem('offlineSales') || '[]');
                offlineSales.push(order);
                localStorage.setItem('offlineSales', JSON.stringify(offlineSales));
                setSuccessMessage('Sale recorded offline. Will sync when online.');
                setOpenSnackbar(true);
                setCart([]);
                setTotalAmount(0);
                setOpenPaymentDialog(false);
                return;
            }

            // Remove the frontend inventory deduction
            // Let the backend handle inventory deduction
            const response = await orderServices.createPosOrder(order);
            const createdOrder = response.data.order;
            setNewOrder(createdOrder);
            setSuccessMessage('Sale completed successfully!');
            setOpenSnackbar(true);
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
            handlePrintReceipt();
            fetchProducts();
        } catch (error) {
            console.error('Error processing sale:', error);
            setErrorMessage(error.message || 'Failed to process sale. Please try again.');
            setOpenSnackbar(true);
            // No need to revert inventory here since the backend will handle it
        }
    };

    const handleReturn = async () => {
        try {
            await orderServices.returnOrder(returnOrderId);
            setSuccessMessage('Order returned successfully!');
            setOpenSnackbar(true);
            setReturnOrderId('');
            setOpenReturnDialog(false);
        } catch (error) {
            console.error('Error processing return:', error);
            setErrorMessage('Failed to process return. Please try again.');
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
                                onKeyPress={handleBarcodeScan}
                                fullWidth
                                variant="outlined"
                                size="small"
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
                                                backgroundColor: lastAddedItem === item.productId ? '#e3f2fd' : 'inherit',
                                                transition: 'background-color 0.5s',
                                            }}
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
                                                    onClick={() => removeFromCart(item.productId)}
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
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => setOpenReturnDialog(true)}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Process Return
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
                            borderRadius: 2,
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

            <Dialog open={openReturnDialog} onClose={() => setOpenReturnDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#0478C0', color: '#fff' }}>Process Return</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <TextField
                        label="Order ID"
                        value={returnOrderId}
                        onChange={(e) => setReturnOrderId(e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenReturnDialog(false)} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleReturn} color="primary" variant="contained">
                        Confirm Return
                    </Button>
                </DialogActions>
            </Dialog>

            <div style={{ display: 'none' }}>
                <div ref={receiptRef} style={{ padding: '10px', fontFamily: 'monospace' }}>
                    <h3>Grocery Store Receipt</h3>
                    <p>Date: {new Date().toLocaleString()}</p>
                    <p>Order ID: {newOrder?.orderId || 'N/A'}</p>
                    <p>Customer: {customerName || 'POS Customer'}</p>
                    <hr />
                    {cart.map(item => (
                        <div key={item.productId}>
                            <p>{item.productName} x {item.quantity} - Rs.{(item.quantity * item.sellingPrice).toFixed(2)}</p>
                        </div>
                    ))}
                    <hr />
                    <p>Total: Rs.{totalAmount.toFixed(2)}</p>
                    <p>Payment Method: {paymentMethod}</p>
                    <p>Thank you for shopping with us!</p>
                </div>
            </div>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
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