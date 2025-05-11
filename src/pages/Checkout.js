import React, { useState, useEffect, useContext } from 'react';
import {
    Typography,
    TextField,
    Button,
    Box,
    Container,
    Grid,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    Alert,
    Collapse,
    CircularProgress,
    FormHelperText,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import { ArrowBack, Close, Check } from '@mui/icons-material';
import { CartContext } from '../CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import orderServices from '../services/orderServices';
import authServices from '../services/authService';
import { motion } from 'framer-motion';
import OrderSummary from '../components/OrderSummary';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51RMcPNCY4xnSZ3lWSnSKx3a9pRwhG1fbZzNBdL4R27I1rVgLqH7nKIYPlJrYjiHDRAHfeSKJQWwNTtEvJmslviBg00Fppyvow8');

const initialFormData = {
    customerName: '',
    email: '',
    phone: '',
    paymentMethod: 'Cash on Pickup',
    saveInformation: true,
    notes: '',
};

function Checkout() {
    const { cartItems, setCartItems, estimatedPickupDate } = useContext(CartContext);
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    // Default pickup time (earliest store hour on weekdays)
    const defaultPickupTime = '11:00';

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const paymentStatus = params.get('payment');

        // Restore formData and cartItems from localStorage if payment redirect occurred
        const savedFormData = localStorage.getItem('checkoutFormData');
        const savedCartItems = localStorage.getItem('checkoutCartItems');
        if (savedFormData && savedCartItems) {
            try {
                setFormData(JSON.parse(savedFormData));
                setCartItems(JSON.parse(savedCartItems));
            } catch (error) {
                console.error('Error parsing saved checkout data:', error);
            }
        }

        if (paymentStatus === 'success') {
            handlePaymentSuccess();
        } else if (paymentStatus === 'cancel') {
            setErrorMessage('Payment was cancelled. Please try again.');
            setActiveStep(1);
        }

        if (cartItems.length === 0 && !orderSuccess && !savedCartItems) {
            navigate('/cart');
        }

        const fetchUserDetails = async () => {
            const username = localStorage.getItem('username');
            const token = localStorage.getItem('authToken');

            if (username && token) {
                try {
                    const response = await authServices.getUser(username);
                    if (response && Object.keys(response).length > 0) {
                        const userData = response;
                        setFormData(prev => ({
                            ...prev,
                            customerName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                            email: userData.email || '',
                            phone: userData.phoneNo || '',
                            saveInformation: false,
                        }));
                        setIsLoggedIn(true);
                    } else {
                        console.error('Failed to fetch user data: Empty response');
                        loadSavedCustomerInfo();
                    }
                } catch (error) {
                    console.error('Error fetching user details:', error.response ? error.response.data : error.message);
                    loadSavedCustomerInfo();
                }
            } else {
                loadSavedCustomerInfo();
            }
        };

        const loadSavedCustomerInfo = () => {
            const savedCustomerInfo = localStorage.getItem('customerInfo');
            if (savedCustomerInfo) {
                try {
                    const parsedInfo = JSON.parse(savedCustomerInfo);
                    setFormData(prev => ({
                        ...prev,
                        customerName: parsedInfo.customerName || '',
                        email: parsedInfo.email || '',
                        phone: parsedInfo.phone || '',
                        saveInformation: true,
                    }));
                } catch (error) {
                    console.error('Error parsing saved customer info:', error);
                }
            }
        };

        fetchUserDetails();
    }, [navigate, orderSuccess, location.search]);

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.sellingPrice || 0) * (item.quantity || 0), 0);

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        if (!formData.customerName.trim()) {
            newErrors.customerName = 'Name is required';
            isValid = false;
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email address is invalid';
            isValid = false;
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
            isValid = false;
        } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData({ ...formData, [name]: checked });
    };

    const handleNextStep = () => {
        if (activeStep === 0) {
            const isValid = validateForm();
            if (isValid) {
                setActiveStep(1);
            }
        }
    };

    const handlePreviousStep = () => {
        setActiveStep(0);
    };

    const handleSubmit = async () => {
        if (activeStep === 0) {
            handleNextStep();
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        if (formData.paymentMethod === 'Online Payment') {
            await handleOnlinePayment();
            return;
        }

        await submitOrder();
    };

    const submitOrder = async () => {
        setIsSubmitting(true);

        try {
            if (formData.saveInformation && !isLoggedIn) {
                localStorage.setItem('customerInfo', JSON.stringify({
                    customerName: formData.customerName,
                    email: formData.email,
                    phone: formData.phone,
                }));
                localStorage.setItem('username', formData.customerName);
            }

            const order = {
                customerName: formData.customerName,
                email: formData.email,
                phone: formData.phone,
                pickupDate: estimatedPickupDate, // Use estimated pickup date from context
                pickupTime: defaultPickupTime,   // Default pickup time
                paymentMethod: formData.paymentMethod,
                notes: formData.notes,
                items: cartItems.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                totalAmount: totalPrice,
                status: 'PENDING',
                username: localStorage.getItem('username'),
            };

            const response = await orderServices.createOrder(order);
            if (!response.data.success) {
                throw new Error('Order creation failed according to backend response');
            }

            const orderIdFromResponse = response.data.order?.orderId;
            if (!orderIdFromResponse) {
                console.error('Order ID not found in response:', response.data);
                throw new Error('Order ID not returned from backend');
            }

            setCartItems([]);
            localStorage.removeItem('cart');
            setOrderId(orderIdFromResponse);
            setOrderSuccess(true);
            setActiveStep(2);
        } catch (error) {
            console.error('Error placing pre-order:', error);
            if (error.response && error.response.status === 400) {
                const errorData = error.response.data;
                const errorMessages = typeof errorData === 'object'
                    ? Object.values(errorData).join('; ')
                    : errorData;
                setErrorMessage(errorMessages || 'Failed to place pre-order. Please check your input.');
            } else {
                setErrorMessage(error.message || 'Failed to place pre-order. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
            setPaymentDialogOpen(false);
        }
    };

    const handleOnlinePayment = async () => {
        setIsSubmitting(true);
        setErrorMessage('');

        try {
            // Save formData and cartItems to localStorage before redirecting to Stripe
            localStorage.setItem('checkoutFormData', JSON.stringify(formData));
            localStorage.setItem('checkoutCartItems', JSON.stringify(cartItems));

            const stripeResponse = await fetch('http://localhost:8080/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Math.round(totalPrice * 100),
                    currency: 'lkr',
                    customerName: formData.customerName,
                    email: formData.email,
                    phone: formData.phone,
                    pickupDate: estimatedPickupDate, // Use estimated pickup date
                    pickupTime: defaultPickupTime,   // Default pickup time
                    paymentMethod: formData.paymentMethod,
                    notes: formData.notes,
                    items: cartItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity
                    })),
                    totalAmount: totalPrice,
                    username: localStorage.getItem('username'),
                }),
            });

            if (!stripeResponse.ok) {
                const errorData = await stripeResponse.json();
                throw new Error(errorData.message || 'Failed to create Stripe Checkout Session');
            }

            const { sessionId } = await stripeResponse.json();
            if (!sessionId) {
                throw new Error('Session ID not returned from backend');
            }

            setSessionId(sessionId);
            const stripe = await stripePromise;
            const { error } = await stripe.redirectToCheckout({ sessionId });

            if (error) {
                setErrorMessage(error.message || 'Failed to initiate payment. Please try again.');
            }
        } catch (error) {
            console.error('Error initiating payment:', error);
            setErrorMessage(error.message || 'Failed to process payment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaymentSuccess = async () => {
        setIsSubmitting(true);
        try {
            // Retrieve saved data from localStorage
            const savedFormData = JSON.parse(localStorage.getItem('checkoutFormData') || '{}');
            const savedCartItems = JSON.parse(localStorage.getItem('checkoutCartItems') || '[]');

            // Validate the data
            if (!savedFormData.customerName || !savedCartItems.length) {
                throw new Error('Invalid order data. Please try placing the order again.');
            }

            const savedTotalPrice = savedCartItems.reduce((sum, item) => {
                const price = item.sellingPrice || 0;
                const quantity = item.quantity || 0;
                return sum + price * quantity;
            }, 0);

            if (savedTotalPrice === 0) {
                throw new Error('Total amount cannot be zero. Please check your cart items.');
            }

            const order = {
                customerName: savedFormData.customerName,
                email: savedFormData.email || '',
                phone: savedFormData.phone || '',
                pickupDate: estimatedPickupDate, // Use estimated pickup date
                pickupTime: defaultPickupTime,   // Default pickup time
                paymentMethod: 'Online Payment',
                notes: savedFormData.notes || '',
                items: savedCartItems.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                totalAmount: savedTotalPrice,
                status: 'PENDING',
                username: localStorage.getItem('username'),
            };

            const response = await orderServices.createOrder(order);
            if (!response.data.success) {
                throw new Error('Order creation failed after payment');
            }

            const orderIdFromResponse = response.data.order?.orderId;
            if (!orderIdFromResponse) {
                console.error('Order ID not found in response:', response.data);
                throw new Error('Order ID not returned from backend');
            }

            // Clear saved data and cart
            localStorage.removeItem('checkoutFormData');
            localStorage.removeItem('checkoutCartItems');
            setCartItems([]);
            localStorage.removeItem('cart');
            setOrderId(orderIdFromResponse);
            setOrderSuccess(true);
            setActiveStep(2);
        } catch (error) {
            console.error('Error creating order after payment:', error);
            setErrorMessage(error.message || 'Failed to create order after successful payment. Please contact support.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = ['Customer Information', 'Review Order', 'Confirmation'];

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Customer Information
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Full Name"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                error={!!errors.customerName}
                                helperText={errors.customerName}
                                InputProps={{ readOnly: isLoggedIn }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                error={!!errors.email}
                                helperText={errors.email}
                                InputProps={{ readOnly: isLoggedIn }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Phone Number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                error={!!errors.phone}
                                helperText={errors.phone}
                                InputProps={{ readOnly: isLoggedIn }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Additional Notes (optional)"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            {!isLoggedIn && (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.saveInformation}
                                            onChange={handleCheckboxChange}
                                            name="saveInformation"
                                            color="primary"
                                        />
                                    }
                                    label="Save this information for next time"
                                />
                            )}
                        </Grid>
                    </Grid>
                );
            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Order Review
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #eaeaea' }}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Customer Information
                                </Typography>
                                <Typography variant="body2">Name: {formData.customerName}</Typography>
                                <Typography variant="body2">Email: {formData.email}</Typography>
                                <Typography variant="body2">Phone: {formData.phone}</Typography>
                                {formData.notes && (
                                    <>
                                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                                            Additional Notes
                                        </Typography>
                                        <Typography variant="body2">{formData.notes}</Typography>
                                    </>
                                )}
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Payment Method
                            </Typography>
                            <FormControl fullWidth>
                                <Select
                                    value={formData.paymentMethod}
                                    onChange={handleSelectChange}
                                    name="paymentMethod"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                >
                                    <MenuItem value="Cash on Pickup">Cash on Pickup</MenuItem>
                                    <MenuItem value="Online Payment">Credit/Debit Card</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                );
            case 2:
                return (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                        >
                            <Box
                                sx={{
                                    bgcolor: '#f0f9f5',
                                    borderRadius: '50%',
                                    width: 80,
                                    height: 80,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 24px auto'
                                }}
                            >
                                <Check sx={{ fontSize: 40, color: '#2e7d32' }} />
                            </Box>
                        </motion.div>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                            Order Placed Successfully!
                        </Typography>
                        <Typography variant="body1" paragraph>
                            Your pre-order has been placed successfully. We'll have your items ready for pickup.
                        </Typography>
                        <Box sx={{ bgcolor: '#f5f5f5', p: 3, my: 3, borderRadius: 2 }}>
                            <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Order ID: {orderId}
                            </Typography>
                        </Box>
                        <Typography variant="body2" paragraph>
                            A confirmation email has been sent to {formData.email}.
                            Please bring your Order ID when you pick up your order.
                        </Typography>
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => navigate('/my-orders')}
                                sx={{ borderRadius: 8, px: 3, py: 1.2, textTransform: 'none' }}
                            >
                                View My Orders
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => navigate('/product-list')}
                                sx={{ borderRadius: 8, px: 3, py: 1.2, textTransform: 'none' }}
                            >
                                Continue Shopping
                            </Button>
                        </Box>
                    </Box>
                );
            default:
                return <div>Unknown step</div>;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4, pt: 8 }}>
            {!orderSuccess && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, paddingTop: 2 }}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{ mr: 1 }}
                        aria-label="Go back"
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                        Checkout
                    </Typography>
                </Box>
            )}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            <Collapse in={!!errorMessage}>
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    action={
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={() => setErrorMessage('')}
                        >
                            <Close fontSize="inherit" />
                        </IconButton>
                    }
                >
                    {errorMessage}
                </Alert>
            </Collapse>
            <Grid container spacing={4}>
                <Grid
                    item
                    xs={12}
                    md={activeStep === 2 ? 12 : 8}
                    sx={{
                        ...(activeStep === 2 && {
                            display: 'flex',
                            justifyContent: 'center',
                        }),
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            border: '1px solid #eaeaea',
                            ...(activeStep === 2 && { maxWidth: '600px', width: '100%' }),
                        }}
                    >
                        {renderStepContent(activeStep)}
                        {activeStep < 2 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                                <Button
                                    onClick={activeStep === 0 ? () => navigate('/cart') : handlePreviousStep}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {activeStep === 0 ? 'Back to Cart' : 'Back'}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    sx={{ borderRadius: 8, px: 4, py: 1.2, textTransform: 'none' }}
                                >
                                    {isSubmitting ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        activeStep === 1 ? 'Place Order' : 'Continue'
                                    )}
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>
                {activeStep < 2 && (
                    <Grid item xs={12} md={4}>
                        <OrderSummary cartItems={cartItems} showActionButton={false} isCheckout={true} />
                    </Grid>
                )}
            </Grid>
        </Container>
    );
}

export default Checkout;