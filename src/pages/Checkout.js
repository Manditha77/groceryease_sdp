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
    Divider,
    Alert,
    Collapse,
    CircularProgress,
    FormHelperText,
    FormControlLabel,
    Checkbox,
    SelectChangeEvent,
} from '@mui/material';
import { ArrowBack, Close, Check } from '@mui/icons-material';
import { CartContext } from '../CartContext';
import { useNavigate } from 'react-router-dom';
import orderServices from '../services/orderServices';
import { motion } from 'framer-motion';
import OrderSummary from '../components/OrderSummary';

const initialFormData = {
    customerName: '',
    email: '',
    phone: '',
    pickupDate: '',
    pickupTime: '',
    paymentMethod: 'Cash on Pickup',
    saveInformation: true,
    notes: '',
};

function Checkout() {
    const { cartItems, setCartItems } = useContext(CartContext);
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        // Check if cart is empty
        if (cartItems.length === 0 && !orderSuccess) {
            navigate('/cart');
        }

        // Load saved customer information from localStorage
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

        // Generate available pickup dates
        generatePickupDates();
    }, [cartItems.length, navigate, orderSuccess]);

    // Calculate totals
    const totalPrice = cartItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);

    // Generate available pickup dates (next 7 days)
    const generatePickupDates = () => {
        const today = new Date();
        const availableDates = [];

        // Start from tomorrow
        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            availableDates.push(date);
        }

        return availableDates.map(date => ({
            value: date.toISOString().split('T')[0],
            label: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        }));
    };

    const availablePickupDates = generatePickupDates();

    // Available pickup time slots
    const availablePickupTimes = [
        { value: '10:00', label: '10:00 AM' },
        { value: '11:00', label: '11:00 AM' },
        { value: '12:00', label: '12:00 PM' },
        { value: '13:00', label: '1:00 PM' },
        { value: '14:00', label: '2:00 PM' },
        { value: '15:00', label: '3:00 PM' },
        { value: '16:00', label: '4:00 PM' },
        { value: '17:00', label: '5:00 PM' },
        { value: '18:00', label: '6:00 PM' },
    ];

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

        if (!formData.pickupDate) {
            newErrors.pickupDate = 'Please select a pickup date';
            isValid = false;
        }

        if (!formData.pickupTime) {
            newErrors.pickupTime = 'Please select a pickup time';
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
            setPaymentDialogOpen(true);
            setIsSubmitting(false);
            return;
        }

        await submitOrder();
    };

    const submitOrder = async () => {
        setIsSubmitting(true);

        try {
            // Save customer information if opted in
            if (formData.saveInformation) {
                localStorage.setItem('customerInfo', JSON.stringify({
                    customerName: formData.customerName,
                    email: formData.email,
                    phone: formData.phone,
                }));

                // Also save the username for other parts of the app
                localStorage.setItem('username', formData.customerName);
            }

            const order = {
                customerName: formData.customerName,
                email: formData.email,
                phone: formData.phone,
                pickupDate: formData.pickupDate,
                pickupTime: formData.pickupTime,
                paymentMethod: formData.paymentMethod,
                notes: formData.notes,
                items: cartItems.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                totalAmount: totalPrice,
                status: 'PENDING',
            };

            const response = await orderServices.createOrder(order);
            console.log('Order creation response:', response);

            if (!response.data.success) {
                throw new Error('Order creation failed according to backend response');
            }

            const orderIdFromResponse = response.data.order?.orderId;
            if (!orderIdFromResponse) {
                console.error('Order ID not found in response:', response.data);
                throw new Error('Order ID not returned from backend');
            }

            // Clear cart and show success message
            setCartItems([]);
            localStorage.removeItem('cart');
            setOrderId(orderIdFromResponse);
            setOrderSuccess(true);
            setActiveStep(2);
        } catch (error) {
            console.error('Error placing pre-order:', error);

            // Handle validation errors from backend
            if (error.response && error.response.status === 400) {
                const errorData = error.response.data;
                // Convert error object to a readable string
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

    const handlePaymentConfirm = () => {
        setPaymentDialogOpen(false);
        submitOrder();
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
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Pickup Details
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={!!errors.pickupDate}>
                                <InputLabel>Pickup Date*</InputLabel>
                                <Select
                                    label="Pickup Date*"
                                    name="pickupDate"
                                    value={formData.pickupDate}
                                    onChange={handleSelectChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                >
                                    {availablePickupDates.map((date) => (
                                        <MenuItem key={date.value} value={date.value}>
                                            {date.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.pickupDate && <FormHelperText>{errors.pickupDate}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={!!errors.pickupTime}>
                                <InputLabel>Pickup Time*</InputLabel>
                                <Select
                                    label="Pickup Time*"
                                    name="pickupTime"
                                    value={formData.pickupTime}
                                    onChange={handleSelectChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                >
                                    {availablePickupTimes.map((time) => (
                                        <MenuItem key={time.value} value={time.value}>
                                            {time.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.pickupTime && <FormHelperText>{errors.pickupTime}</FormHelperText>}
                            </FormControl>
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

                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                                    Pickup Details
                                </Typography>
                                <Typography variant="body2">
                                    Date: {new Date(formData.pickupDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                                </Typography>
                                <Typography variant="body2">
                                    Time: {availablePickupTimes.find(t => t.value === formData.pickupTime)?.label || formData.pickupTime}
                                </Typography>

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

                            <Typography variant="body1">
                                Pickup Date: {new Date(formData.pickupDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                            })}
                            </Typography>

                            <Typography variant="body1">
                                Pickup Time: {availablePickupTimes.find(t => t.value === formData.pickupTime)?.label || formData.pickupTime}
                            </Typography>
                        </Box>

                        <Typography variant="body2" paragraph>
                            A confirmation email has been sent to {formData.email}.
                            Please bring your Order ID when you pick up your order.
                        </Typography>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/orders')}
                                sx={{
                                    borderRadius: 8,
                                    px: 3,
                                    py: 1.2,
                                    textTransform: 'none'
                                }}
                            >
                                View My Orders
                            </Button>

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => navigate('/product-list')}
                                sx={{
                                    borderRadius: 8,
                                    px: 3,
                                    py: 1.2,
                                    textTransform: 'none'
                                }}
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
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {!orderSuccess && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                <Grid item xs={12} md={8}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            border: '1px solid #eaeaea',
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
                                    sx={{
                                        borderRadius: 8,
                                        px: 4,
                                        py: 1.2,
                                        textTransform: 'none',
                                    }}
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

                <Grid item xs={12} md={4}>
                    <OrderSummary
                        cartItems={cartItems}
                        showActionButton={false}
                        isCheckout={true}
                    />
                </Grid>
            </Grid>

            {/* Payment Dialog */}
            <Dialog
                open={paymentDialogOpen}
                onClose={() => !isSubmitting && setPaymentDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Payment Details
                    <IconButton
                        aria-label="close"
                        onClick={() => !isSubmitting && setPaymentDialogOpen(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                        }}
                        disabled={isSubmitting}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    <Typography variant="subtitle1" gutterBottom>
                        Total Amount: Rs.{totalPrice.toFixed(2)}
                    </Typography>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                label="Card Number"
                                fullWidth
                                placeholder="1234 5678 9012 3456"
                                inputProps={{ maxLength: 19 }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Expiry Date"
                                fullWidth
                                placeholder="MM/YY"
                                inputProps={{ maxLength: 5 }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="CVC"
                                fullWidth
                                placeholder="123"
                                inputProps={{ maxLength: 3 }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Name on Card"
                                fullWidth
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
                        This is a demo payment form. No actual payment will be processed.
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => !isSubmitting && setPaymentDialogOpen(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePaymentConfirm}
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
                        sx={{ borderRadius: 8, textTransform: 'none' }}
                    >
                        {isSubmitting ? 'Processing...' : 'Pay Now'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Checkout;