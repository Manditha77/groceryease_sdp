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
    FormControlLabel,
    Radio,
    RadioGroup,
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
    Checkbox,
} from '@mui/material';
import { ArrowBack, Close, Check, Money, CreditCard } from '@mui/icons-material';
import { CartContext } from './CartContext';
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
    const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    const defaultPickupTime = '11:00';

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const paymentStatus = params.get('payment');

        const savedFormData = localStorage.getItem('checkoutFormData');
        const savedCartItems = localStorage.getItem('checkoutCartItems');
        if (savedFormData && savedCartItems) {
            try {
                setFormData(JSON.parse(savedFormData));
                const parsedCartItems = JSON.parse(savedCartItems);
                setCartItems(Array.isArray(parsedCartItems) ? parsedCartItems : []);
            } catch (error) {
                console.error('Error parsing saved checkout data:', error);
                setCartItems([]);
            }
        }

        const savedSessionId = localStorage.getItem('stripeSessionId');
        if (savedSessionId) {
            setSessionId(savedSessionId);
        }

        if (paymentStatus === 'success' && savedSessionId) {
            handlePaymentSuccess(savedSessionId);
        } else if (paymentStatus === 'cancel') {
            setErrorMessage('Payment was cancelled. Please try again.');
            setActiveStep(1);
            localStorage.removeItem('stripeSessionId');
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
    }, [navigate, orderSuccess, location.search, cartItems.length]);

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.sellingPrice || 0) * (item.units || 0), 0);

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

    const handleRadioChange = (e) => {
        setFormData({ ...formData, paymentMethod: e.target.value });
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

        setConfirmationDialogOpen(true);
    };

    const handleConfirmOrder = async () => {
        setConfirmationDialogOpen(false);
        setIsSubmitting(true);
        setErrorMessage('');

        if (formData.paymentMethod === 'Online Payment') {
            await handleOnlinePayment();
            return;
        }

        await submitOrder();
    };

    const handleCancelConfirm = () => {
        setConfirmationDialogOpen(false);
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
                pickupDate: estimatedPickupDate,
                pickupTime: defaultPickupTime,
                paymentMethod: formData.paymentMethod,
                notes: formData.notes,
                items: cartItems.map((item) => ({
                    productId: item.productId,
                    units: item.units // Changed from quantity to units
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
            localStorage.setItem('checkoutFormData', JSON.stringify(formData));
            localStorage.setItem('checkoutCartItems', JSON.stringify(cartItems));

            const stripeResponse = await fetch('http://localhost:8080/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                },
                body: JSON.stringify({
                    amount: Math.round(totalPrice * 100),
                    currency: 'lkr',
                    customerName: formData.customerName,
                    email: formData.email,
                    phone: formData.phone,
                    pickupDate: estimatedPickupDate,
                    pickupTime: defaultPickupTime,
                    paymentMethod: formData.paymentMethod,
                    notes: formData.notes,
                    items: cartItems.map((item) => ({
                        productId: item.productId,
                        units: item.units // Changed from quantity to units
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

            localStorage.setItem('stripeSessionId', sessionId);
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

    const pollSessionStatus = async (sessionId, maxAttempts = 10, interval = 2000) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await fetch(`http://localhost:8080/api/stripe/session-status/${sessionId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch session status');
                }
                const { status, paymentStatus } = await response.json();
                console.log(`Attempt ${attempt}: Session Status: ${status}, Payment Status: ${paymentStatus}`);

                if (status === 'complete' && paymentStatus === 'paid') {
                    return true;
                }
                await new Promise(resolve => setTimeout(resolve, interval));
            } catch (error) {
                console.error(`Attempt ${attempt}: Error polling session status:`, error);
                if (attempt === maxAttempts) {
                    throw new Error('Failed to confirm payment status after multiple attempts.');
                }
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
        throw new Error('Payment status polling timed out.');
    };

    const handlePaymentSuccess = async (sessionId) => {
        setIsSubmitting(true);
        try {
            console.log('Polling for session status with Session ID:', sessionId);

            const paymentConfirmed = await pollSessionStatus(sessionId);
            if (!paymentConfirmed) {
                throw new Error('Payment confirmation failed.');
            }

            if (localStorage.getItem(`orderProcessed_${sessionId}`)) {
                throw new Error('Order already processed for this session.');
            }

            const savedFormData = JSON.parse(localStorage.getItem('checkoutFormData') || '{}');
            const savedCartItems = JSON.parse(localStorage.getItem('checkoutCartItems') || '[]');

            if (!savedFormData.customerName || !savedCartItems.length) {
                throw new Error('Invalid order data. Please try placing the order again.');
            }

            const savedTotalPrice = savedCartItems.reduce((sum, item) => {
                const price = item.sellingPrice || 0;
                const quantity = item.units || 0;
                return sum + price * quantity;
            }, 0);

            if (savedTotalPrice === 0) {
                throw new Error('Total amount cannot be zero. Please check your cart items.');
            }

            const order = {
                customerName: savedFormData.customerName,
                email: savedFormData.email || '',
                phone: savedFormData.phone || '',
                pickupDate: estimatedPickupDate,
                pickupTime: defaultPickupTime,
                paymentMethod: 'Online Payment',
                notes: savedFormData.notes || '',
                items: savedCartItems.map((item) => ({
                    productId: item.productId,
                    units: item.units // Changed from quantity to units
                })),
                totalAmount: savedTotalPrice,
                status: 'PENDING',
                username: localStorage.getItem('username'),
            };

            console.log('Attempting to create order with data:', order);

            const response = await orderServices.createOrder(order);
            console.log('Order creation response:', response);

            if (!response.data.success) {
                throw new Error('Order creation failed after payment: ' + (response.data.message || 'Unknown error'));
            }

            const orderIdFromResponse = response.data.order?.orderId;
            if (!orderIdFromResponse) {
                console.error('Order ID not found in response:', response.data);
                throw new Error('Order ID not returned from backend');
            }

            localStorage.setItem(`orderProcessed_${sessionId}`, 'true');
            console.log('Order marked as processed for session:', sessionId);

            localStorage.removeItem('checkoutFormData');
            localStorage.removeItem('checkoutCartItems');
            localStorage.removeItem('stripeSessionId');
            setCartItems([]);
            localStorage.removeItem('cart');
            setOrderId(orderIdFromResponse);
            setOrderSuccess(true);
            setActiveStep(2);
        } catch (error) {
            console.error('Error in handlePaymentSuccess:', error);
            // Only set error message if it's not the "Order already processed" error
            if (error.message !== 'Order already processed for this session.') {
                setErrorMessage(error.message || 'Failed to create order after successful payment. Please contact support.');
            }
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
                            <FormControl component="fieldset">
                                <RadioGroup
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleRadioChange}
                                >
                                    <FormControlLabel
                                        value="Cash on Pickup"
                                        control={<Radio />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Money sx={{ mr: 1, color: '#549a54' }} />
                                                <Typography>Cash on Pickup</Typography>
                                            </Box>
                                        }
                                    />
                                    <FormControlLabel
                                        value="Online Payment"
                                        control={<Radio />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CreditCard sx={{ mr: 1, color: '#0478C0' }} />
                                                <Typography>Credit/Debit Card</Typography>
                                            </Box>
                                        }
                                    />
                                </RadioGroup>
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
                            A confirmation email will be sent to {formData.email}.
                            Please bring your Order ID when you pick up your order.
                        </Typography>
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button
                                variant="contained"
                                onClick={() => navigate('/my-orders')}
                                sx={{ borderRadius: 8, px: 3, py: 1.2, textTransform: 'none', bgcolor: '#549a54', '&:hover': { backgroundColor: '#108015' } }}
                            >
                                View My Orders
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => navigate('/product-list')}
                                sx={{ borderRadius: 8, px: 3, py: 1.2, textTransform: 'none', bgcolor: '#549a54', '&:hover': { backgroundColor: '#108015' } }}
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
        <Container maxWidth="lg" sx={{ py: 4, pt: 12 }}>
            {!orderSuccess && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, paddingTop: 2 }}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{ mr: 1 }}
                        aria-label="Go back"
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" sx={{ color: '#549a54', fontWeight: 'bold' }}>
                        Checkout
                    </Typography>
                </Box>
            )}
            <Box sx={{ mt: 4 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>
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
                                    sx={{ textTransform: 'none', color: '#549a54' }}
                                >
                                    {activeStep === 0 ? 'Back to Cart' : 'Back'}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    sx={{ borderRadius: 8, px: 4, py: 1.2, textTransform: 'none', bgcolor: '#549a54' }}
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

            <Dialog
                open={confirmationDialogOpen}
                onClose={handleCancelConfirm}
                aria-labelledby="confirmation-dialog-title"
            >
                <DialogTitle id="confirmation-dialog-title">Confirm Your Order</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        You have selected <strong>{formData.paymentMethod}</strong> as your payment method.
                    </Typography>
                    <Typography variant="body1">
                        {formData.paymentMethod === 'Online Payment'
                            ? 'You will be redirected to a secure payment page to complete your order.'
                            : 'You will pay the total amount of Rs.' + totalPrice.toFixed(2) + ' at pickup.'}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Are you sure you want to place this order?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelConfirm} color="primary" sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmOrder}
                        variant="contained"
                        color="primary"
                        sx={{ textTransform: 'none', bgcolor: '#549a54', '&:hover': { bgcolor: '#108015' } }}
                    >
                        Confirm Order
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Checkout;