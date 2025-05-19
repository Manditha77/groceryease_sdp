import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel,
    Grid, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete
} from '@mui/material';
import { Html5QrcodeScanner } from "html5-qrcode";
import productService from '../services/productServices';
import orderServices from '../services/orderServices';
import authService from '../services/authService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PosTerminal = () => {
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [searchInput, setSearchInput] = useState('');
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
    const [existingCustomers, setExistingCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [scannerDialogOpen, setScannerDialogOpen] = useState(false);
    const [lastAddedItem, setLastAddedItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
    const [editUnitItem, setEditUnitItem] = useState(null); // Track item being edited
    const [editUnitValue, setEditUnitValue] = useState(''); // Input value for manual edit
    const scannerRef = useRef(null);

    const loggedInUser = authService.getLoggedInUser();
    const staffName = loggedInUser?.username || 'Unknown';

    const fetchData = async () => {
        try {
            const [productResponse, customerResponse] = await Promise.all([
                productService.getAllProducts(),
                authService.getAllCustomers().then(customers =>
                    customers.filter(c => c.customerType === 'CREDIT')
                ),
            ]);
            // Ensure products are valid objects, allow NULL/undefined barcodes
            if (productResponse && productResponse.data) {
                const validProducts = productResponse.data.filter(p =>
                    p &&
                    typeof p === 'object' &&
                    p.productId &&
                    p.productName &&
                    typeof p.productName === 'string' &&
                    typeof p.units === 'number' &&
                    typeof p.sellingPrice === 'number' &&
                    p.unitType
                );
                setProducts(validProducts);
                console.log('Fetched products:', validProducts);
            }
            if (customerResponse) setExistingCustomers(customerResponse);
        } catch (error) {
            console.error('Error fetching data:', error);
            setErrorMessage('Failed to load products or customers.');
            setOpenSnackbar(true);
        }
    };

    useEffect(() => {
        fetchData();
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
                                    item.units,
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
                fetchData();
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
                        if (product.units <= 0) {
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
                console.log('Enter pressed, clearing messages. SearchInput:', searchInput);
            }

            if (e.key === 'Enter' && isInputFocused) {
                const input = searchInput.trim().toLowerCase();
                console.log('Processing Enter with input:', input);
                console.log('Current products:', products);
                if (!input) {
                    setErrorMessage('Please enter a product name, ID, or barcode.');
                    setOpenSnackbar(true);
                    console.log('Empty input detected, error set.');
                    return;
                }

                const matchingProduct = products.find(p => {
                    if (!p) return false;
                    const productNameLower = p.productName ? p.productName.toLowerCase() : '';
                    const barcodeLower = p.barcode ? p.barcode.toLowerCase() : '';
                    const productIdStr = p.productId != null ? p.productId.toString() : '';
                    return (
                        productNameLower.includes(input) ||
                        (barcodeLower && barcodeLower.includes(input)) ||
                        productIdStr === input
                    );
                });

                if (matchingProduct) {
                    console.log('Product found:', matchingProduct);
                    addOrUpdateCartItem(matchingProduct.productId);
                    setSearchInput('');
                } else {
                    setErrorMessage(`No product found for "${searchInput}". Please check the name, ID, or barcode.`);
                    setOpenSnackbar(true);
                    console.log('Product not found, error set.');
                }
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

            if (openPaymentDialog || scannerDialogOpen || openReceiptDialog) return;

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
                    setErrorMessage('Please select an item from the cart to adjust units.');
                    setOpenSnackbar(true);
                    return;
                }

                const item = cart.find(item => item.productId === selectedItem);
                const product = products.find(p => p.productId === selectedItem);
                if (!item || !product) return;

                let newUnits;
                const increment = product.unitType === 'WEIGHT' ? 0.25 : 1; // Keep increment at 0.25 for WEIGHT
                if (e.key === '+') {
                    newUnits = item.units + increment;
                    if (newUnits > product.units) {
                        setErrorMessage(`Cannot increase units. Only ${product.units} units of ${product.productName} in stock.`);
                        setOpenSnackbar(true);
                        return;
                    }
                    setTotalAmount(prevTotal => prevTotal + (product.sellingPrice * increment));
                } else {
                    const minUnits = product.unitType === 'WEIGHT' ? 0.01 : 1; // Changed to 0.01 for WEIGHT
                    newUnits = Math.max(minUnits, item.units - increment);
                    if (newUnits < item.units) {
                        setTotalAmount(prevTotal => prevTotal - (product.sellingPrice * increment));
                    } else {
                        setErrorMessage(`Cannot decrease units. Units are already at the minimum (${minUnits}) for ${product.productName}.`);
                        setOpenSnackbar(true);
                        return;
                    }
                }

                // Validate units for DISCRETE products
                if (product.unitType === 'DISCRETE' && newUnits % 1 !== 0) {
                    setErrorMessage('Units for DISCRETE products must be an integer (e.g., 1, 2, 10).');
                    setOpenSnackbar(true);
                    return;
                }

                setCart(cart.map(cartItem =>
                    cartItem.productId === selectedItem
                        ? { ...cartItem, units: newUnits }
                        : cartItem
                ));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, selectedItem, products, totalAmount, openPaymentDialog, scannerDialogOpen, openReceiptDialog, searchInput]);

    const addOrUpdateCartItem = (productId) => {
        const product = products.find(p => p.productId === productId);
        console.log('addOrUpdateCartItem called with productId:', productId, 'Product:', product);
        if (product && product.units > 0) {
            const existingItem = cart.find(item => item.productId === productId);
            if (existingItem) {
                setErrorMessage(`${product.productName} is already in the cart. Use +/- keys to adjust units after selecting it.`);
                setOpenSnackbar(true);
                console.log('Duplicate item detected, error set.');
            } else {
                const initialUnits = product.unitType === 'WEIGHT' ? 0.25 : 1; // Keep initial units at 0.25 for WEIGHT
                if (initialUnits > product.units) {
                    setErrorMessage(`Cannot add ${product.productName}. Only ${product.units} units in stock.`);
                    setOpenSnackbar(true);
                    return;
                }
                setCart([...cart, { ...product, units: initialUnits }]);
                setTotalAmount(totalAmount + (product.sellingPrice * initialUnits));
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
        setTotalAmount(totalAmount - (item.sellingPrice * item.units));
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

        if (!selectedCustomer && !creditCustomerDetails.firstName.trim()) {
            newErrors.firstName = 'First name is required';
            isValid = false;
        }
        if (!selectedCustomer && !creditCustomerDetails.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
            isValid = false;
        }
        if (!selectedCustomer && !creditCustomerDetails.phone.trim()) {
            newErrors.phone = 'Phone number is required';
            isValid = false;
        } else if (!selectedCustomer && !/^\d{10}$/.test(creditCustomerDetails.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
            isValid = false;
        }
        if (!selectedCustomer && !creditCustomerDetails.address.trim()) {
            newErrors.address = 'Address is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleCreditCustomerInputChange = (e) => {
        const { name, value } = e.target;
        setCreditCustomerDetails({ ...creditCustomerDetails, [name]: value });
        setSelectedCustomer(null);
    };

    const handleSelectCustomer = (phoneNo) => {
        const customer = existingCustomers.find(c => c.phoneNo === phoneNo);
        if (customer) {
            setSelectedCustomer(customer.phoneNo);
            setCreditCustomerDetails({
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phoneNo,
                email: customer.email || '',
                address: customer.address || '',
            });
        }
    };

    const confirmPayment = async () => {
        setErrorMessage('');
        if (cart.length === 0) {
            setErrorMessage('Cart is empty.');
            setOpenSnackbar(true);
            return;
        }

        let finalCustomerName = customerName || 'POS Customer';
        let creditDetails = null;

        if (paymentMethod === 'Credit Purpose') {
            const isValid = validateCreditCustomerDetails();
            if (!isValid) return;

            if (selectedCustomer) {
                const customer = existingCustomers.find(c => c.phoneNo === selectedCustomer);
                finalCustomerName = `${customer.firstName} ${customer.lastName}`;
                creditDetails = {
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    phone: customer.phoneNo,
                    email: customer.email,
                    address: customer.address,
                };
            } else {
                finalCustomerName = `${creditCustomerDetails.firstName} ${creditCustomerDetails.lastName}`;
                creditDetails = { ...creditCustomerDetails };
            }
        }

        try {
            const currentDate = new Date();
            const transactionDate = currentDate.toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
            console.log('Transaction Date set:', transactionDate);

            const order = {
                customerName: finalCustomerName,
                paymentMethod: paymentMethod,
                totalAmount: totalAmount,
                status: 'COMPLETED',
                orderDate: currentDate.toISOString(),
                items: cart.map(item => ({
                    productId: item.productId,
                    units: item.units,
                    sellingPrice: item.sellingPrice,
                })),
                creditCustomerDetails: paymentMethod === 'Credit Purpose' ? creditDetails : null,
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
                setReceipt(newOrder.receipt);
                setOpenReceiptDialog(true);
                setSuccessMessage('Sale completed successfully!');
                setOpenSnackbar(true);
            }

            setIsPrinting(false);
            setCart([]);
            setTotalAmount(0);
            setCreditCustomerDetails({
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                address: '',
            });
            setSelectedCustomer(null);
            setOpenPaymentDialog(false);
            fetchData();
        } catch (error) {
            console.error('Error processing sale:', error);
            setErrorMessage(error.message || 'Failed to process sale. Please try again.');
            setOpenSnackbar(true);
        }
    };

    const handlePrintReceipt = () => {
        if (!receipt) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>POS Receipt</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                        width: 300px;
                        margin: 10px auto;
                        text-align: center;
                        color: #333;
                    }
                    .receipt-container {
                        border: 1px solid #000;
                        padding: 10px;
                        border-radius: 5px;
                    }
                    .header {
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .address {
                        font-size: 10px;
                        margin-bottom: 10px;
                    }
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 5px 0;
                    }
                    .details {
                        display: flex;
                        justify-content: space-between;
                        font-size: 4px;
                        margin: 5px 0;
                        text-align: left;
                    }
                    .details-left, .details-right {
                        flex: 1;
                    }
                    .details-right {
                        text-align: right;
                    }
                    .footer {
                        font-size: 10px;
                        margin: 5px 0;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                    }
                    .items-table th, .items-table td {
                        padding: 2px;
                        text-align: left;
                        font-size: 10px;
                    }
                    .items-table th {
                        border-bottom: 1px solid #000;
                    }
                    .total {
                        font-size: 12px;
                        font-weight: bold;
                        margin-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="header">
                        GroceryEase
                    </div>
                    <div class="address">
                        123 Main Street, Colombo, Sri Lanka<br/>
                        Phone: +94 112 345 678
                    </div>
                    <div class="divider"></div>
                    <div class="details">
                        <div class="details-left">
                            Order ID: ${receipt.orderId}<br/>
                            Date: ${new Date(receipt.orderDate).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}<br/>
                            Staff: ${staffName}
                        </div>
                        <div class="details-right">
                            Customer: ${receipt.customerName}<br/>
                            Payment Method: ${receipt.paymentMethod}
                        </div>
                    </div>
                    <div class="divider"></div>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Units</th>
                                <th>Price</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${receipt.items.map(item => `
                                <tr>
                                    <td>${item.productName}</td>
                                    <td>${item.units}</td>
                                    <td>Rs.${item.sellingPrice.toFixed(2)}</td>
                                    <td>Rs.${item.subtotal.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="divider"></div>
                    <div class="total">
                        Total: Rs.${receipt.totalAmount.toFixed(2)}
                    </div>
                    <div class="divider"></div>
                    <div class="footer">
                        Thank you for shopping with us!<br/>
                        Visit again at GroceryEase
                    </div>
                </div>
                <script>
                    window.print();
                    window.close();
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        setOpenReceiptDialog(false);
    };

    const handleDownloadPDF = () => {
        if (!receipt) return;

        const receiptElement = document.querySelector('#receipt-content');
        if (!receiptElement) {
            setErrorMessage('Failed to generate PDF. Receipt content not found.');
            setOpenSnackbar(true);
            return;
        }

        html2canvas(receiptElement, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`receipt_${receipt.orderId}.pdf`);
        }).catch(error => {
            console.error('Error generating PDF:', error);
            setErrorMessage('Failed to generate PDF. Please try again.');
            setOpenSnackbar(true);
        });
    };

    const handleCloseReceiptDialog = () => {
        setOpenReceiptDialog(false);
        setReceipt(null);
    };

    const handleEditUnits = (productId) => {
        const item = cart.find(i => i.productId === productId);
        if (item && item.unitType === 'WEIGHT') {
            setEditUnitItem(productId);
            setEditUnitValue(item.units.toString());
        } else {
            setErrorMessage('Manual unit editing is only available for WEIGHT type products.');
            setOpenSnackbar(true);
        }
    };

    const handleSaveUnits = () => {
        if (!editUnitItem) return;

        const item = cart.find(i => i.productId === editUnitItem);
        const product = products.find(p => p.productId === editUnitItem);
        if (!item || !product) return;

        let newUnits = parseFloat(editUnitValue);
        if (isNaN(newUnits)) {
            setErrorMessage('Please enter a valid number.');
            setOpenSnackbar(true);
            return;
        }
        if (newUnits < 0.01) { // Changed to 0.01
            setErrorMessage('Units must be at least 0.01 for WEIGHT products.');
            setOpenSnackbar(true);
            return;
        }
        if (newUnits > product.units) {
            setErrorMessage(`Units cannot exceed ${product.units} for ${product.productName}.`);
            setOpenSnackbar(true);
            return;
        }

        const unitDiff = newUnits - item.units;
        setCart(cart.map(cartItem =>
            cartItem.productId === editUnitItem
                ? { ...cartItem, units: newUnits }
                : cartItem
        ));
        setTotalAmount(prevTotal => prevTotal + (product.sellingPrice * unitDiff));
        setEditUnitItem(null);
        setEditUnitValue('');
    };

    const handleCancelEdit = () => {
        setEditUnitItem(null);
        setEditUnitValue('');
    };

    const handleUnitInputChange = (e) => {
        const value = e.target.value;
        // Allow only numbers and a single decimal point
        if (/^\d*\.?\d*$/.test(value) && value.indexOf('.') === value.lastIndexOf('.')) {
            setEditUnitValue(value);
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
                            <Autocomplete
                                freeSolo
                                options={products}
                                getOptionLabel={(option) =>
                                    option && typeof option === 'object' && option.productName
                                        ? `${option.productName} (ID: ${option.productId}, Barcode: ${option.barcode || 'No Barcode'})`
                                        : ''
                                }
                                filterOptions={(options, { inputValue }) => {
                                    if (!inputValue) return options;
                                    const input = inputValue.toLowerCase().trim();
                                    return options.filter(option =>
                                        option &&
                                        typeof option === 'object' &&
                                        (
                                            (option.productName && option.productName.toLowerCase().includes(input)) ||
                                            (option.barcode && option.barcode.toLowerCase().includes(input)) ||
                                            (option.productId && option.productId.toString() === input)
                                        )
                                    );
                                }}
                                value={null}
                                onChange={(event, newValue) => {
                                    if (newValue && typeof newValue === 'object') {
                                        addOrUpdateCartItem(newValue.productId);
                                        setSearchInput('');
                                    }
                                }}
                                onInputChange={(event, newInputValue) => {
                                    setSearchInput(newInputValue);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Enter Product Name, ID, or Barcode"
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        helperText="Press Enter to add product, Space to scan, Insert to checkout, Up/Down to select, +/- to adjust"
                                    />
                                )}
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
                                            Units
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
                                            <TableCell>
                                                {editUnitItem === item.productId ? (
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                        <TextField
                                                            value={editUnitValue}
                                                            onChange={handleUnitInputChange}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') handleSaveUnits();
                                                            }}
                                                            size="small"
                                                            sx={{ width: '60px' }}
                                                        />
                                                        <Button onClick={handleSaveUnits} size="small" variant="contained" color="primary">
                                                            Save
                                                        </Button>
                                                        <Button onClick={handleCancelEdit} size="small" variant="outlined" color="secondary">
                                                            Cancel
                                                        </Button>
                                                    </Box>
                                                ) : (
                                                    <span onClick={() => handleEditUnits(item.productId)} style={{ cursor: 'pointer' }}>
                                                        {item.units}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>Rs.{item.sellingPrice.toFixed(2)}</TableCell>
                                            <TableCell>Rs.{(item.units * item.sellingPrice).toFixed(2)}</TableCell>
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
                            <Grid item xs={12}>
                                <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
                                    <InputLabel>Select Existing Customer</InputLabel>
                                    <Select
                                        value={selectedCustomer || ''}
                                        onChange={(e) => handleSelectCustomer(e.target.value)}
                                        label="Select Existing Customer"
                                    >
                                        <MenuItem value="">-- New Customer --</MenuItem>
                                        {existingCustomers.map((customer) => (
                                            <MenuItem key={customer.phoneNo} value={customer.phoneNo}>
                                                {`${customer.firstName} ${customer.lastName} (${customer.phoneNo})`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="First Name"
                                    name="firstName"
                                    value={creditCustomerDetails.firstName}
                                    onChange={handleCreditCustomerInputChange}
                                    fullWidth
                                    required
                                    disabled={!!selectedCustomer}
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
                                    disabled={!!selectedCustomer}
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
                                    disabled={!!selectedCustomer}
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
                                    disabled={!!selectedCustomer}
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
                                    disabled={!!selectedCustomer}
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

            <Dialog open={openReceiptDialog} onClose={handleCloseReceiptDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#0478C0', color: '#fff' }}>Receipt</DialogTitle>
                <DialogContent>
                    {receipt && (
                        <Box
                            id="receipt-content"
                            sx={{
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: '12px',
                                width: '100%',
                                maxWidth: '300px',
                                margin: '0 auto',
                                textAlign: 'center',
                                color: '#333',
                                border: '1px solid #000',
                                borderRadius: '5px',
                                p: 2,
                            }}
                        >
                            <Typography sx={{ fontSize: '16px', fontWeight: 'bold', mb: 1 }}>
                                GroceryEase
                            </Typography>
                            <Typography sx={{ fontSize: '10px', mb: 2 }}>
                                123 Main Street, Colombo, Sri Lanka<br/>
                                Phone: +94 112 345 678
                            </Typography>
                            <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '4px', mb: 2, textAlign: 'left' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography>Order ID: {receipt.orderId}</Typography>
                                    <Typography>Date: {new Date(receipt.orderDate).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}</Typography>
                                    <Typography>Staff: {staffName}</Typography>
                                </Box>
                                <Box sx={{ flex: 1, textAlign: 'right' }}>
                                    <Typography>Customer: {receipt.customerName}</Typography>
                                    <Typography>Payment Method: {receipt.paymentMethod}</Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />
                            <Table sx={{ mb: 2 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontSize: '10px', p: 0.5, borderBottom: '1px solid #000' }}>Item</TableCell>
                                        <TableCell sx={{ fontSize: '10px', p: 0.5, borderBottom: '1px solid #000' }}>Units</TableCell>
                                        <TableCell sx={{ fontSize: '10px', p: 0.5, borderBottom: '1px solid #000' }}>Price</TableCell>
                                        <TableCell sx={{ fontSize: '10px', p: 0.5, borderBottom: '1px solid #000' }}>Subtotal</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {receipt.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell sx={{ fontSize: '10px', p: 0.5 }}>{item.productName}</TableCell>
                                            <TableCell sx={{ fontSize: '10px', p: 0.5 }}>{item.units}</TableCell>
                                            <TableCell sx={{ fontSize: '10px', p: 0.5 }}>Rs.{item.sellingPrice.toFixed(2)}</TableCell>
                                            <TableCell sx={{ fontSize: '10px', p: 0.5 }}>Rs.{item.subtotal.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />
                            <Typography sx={{ fontSize: '12px', fontWeight: 'bold', mt: 2 }}>
                                Total: Rs.{receipt.totalAmount.toFixed(2)}
                            </Typography>
                            <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />
                            <Box sx={{ fontSize: '10px', mt: 2 }}>
                                <Typography>Thank you for shopping with us!</Typography>
                                <Typography>Visit again at GroceryEase</Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseReceiptDialog} color="secondary">
                        Close
                    </Button>
                    <Button onClick={handlePrintReceipt} color="primary" variant="contained">
                        Print
                    </Button>
                    <Button onClick={handleDownloadPDF} color="primary" variant="contained">
                        Download PDF
                    </Button>
                </DialogActions>
            </Dialog>

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