import React, { useState } from 'react';
import { TextField, Button, Grid, Typography, Paper, Avatar, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import PersonIcon from '@mui/icons-material/Person';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNo: '',
        address: '',
        username: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    // Validation rules
    const validateField = (name, value) => {
        const newErrors = { ...errors };

        switch (name) {
            case 'firstName':
            case 'lastName':
                if (!value.trim()) {
                    newErrors[name] = `${name === 'firstName' ? 'First' : 'Last'} Name is required`;
                } else if (value.length < 2) {
                    newErrors[name] = `${name === 'firstName' ? 'First' : 'Last'} Name must be at least 2 characters`;
                } else {
                    delete newErrors[name];
                }
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) {
                    newErrors.email = 'Email is required';
                } else if (!emailRegex.test(value)) {
                    newErrors.email = 'Invalid email format';
                } else {
                    delete newErrors.email;
                }
                break;
            case 'phoneNo':
                const phoneRegex = /^\+?[\d\s-]{10,}$/;
                if (!value) {
                    newErrors.phoneNo = 'Phone number is required';
                } else if (!phoneRegex.test(value)) {
                    newErrors.phoneNo = 'Invalid phone number format';
                } else {
                    delete newErrors.phoneNo;
                }
                break;
            case 'address':
                if (!value.trim()) {
                    newErrors.address = 'Address is required';
                } else if (value.length < 5) {
                    newErrors.address = 'Address must be at least 5 characters';
                } else {
                    delete newErrors.address;
                }
                break;
            case 'username':
                if (!value.trim()) {
                    newErrors.username = 'Username is required';
                } else if (value.length < 3) {
                    newErrors.username = 'Username must be at least 3 characters';
                } else {
                    delete newErrors.username;
                }
                break;
            case 'password':
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                if (!value) {
                    newErrors.password = 'Password is required';
                } else if (!passwordRegex.test(value)) {
                    newErrors.password = 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character';
                } else {
                    delete newErrors.password;
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    newErrors.confirmPassword = 'Please confirm your password';
                } else if (value !== formData.password) {
                    newErrors.confirmPassword = 'Passwords do not match';
                } else {
                    delete newErrors.confirmPassword;
                }
                break;
            default:
                break;
        }

        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors(validateField(name, value));
    };

    const validateForm = () => {
        let newErrors = {};
        Object.keys(formData).forEach((key) => {
            newErrors = { ...newErrors, ...validateField(key, formData[key]) };
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            alert('Please fix the form errors before submitting');
            return;
        }
        try {
            await authService.register(
                formData.firstName,
                formData.lastName,
                formData.email,
                formData.phoneNo,
                formData.address,
                'CUSTOMER',
                formData.username,
                formData.password
            );
            navigate('/login', { state: { success: 'Registered successfully' } });
        } catch (error) {
            console.error('Registration failed', error);
            setErrors({ ...errors, submit: 'Registration failed. Please try again.' });
        }
    };

    return (
        <Box sx={{ padding: 4, maxWidth: 1100, margin: 'auto', marginTop: 8 }}>
            <Typography variant="h4" align="center" gutterBottom style={{color: '#1b5e20', fontWeight: 'bold'}}>
                Customer Registration
            </Typography>
            {errors.submit && (
                <Typography color="error" align="center" sx={{ mb: 2 }}>
                    {errors.submit}
                </Typography>
            )}
            <Paper elevation={3} sx={{ padding: 4, marginTop: 2 }}>
                <Grid container spacing={3}>
                    {/* Left Section: Customer Details */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" align="center" sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}>
                            Customer Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    variant="outlined"
                                    required
                                    error={!!errors.firstName}
                                    helperText={errors.firstName}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    variant="outlined"
                                    required
                                    error={!!errors.lastName}
                                    helperText={errors.lastName}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    variant="outlined"
                                    required
                                    error={!!errors.email}
                                    helperText={errors.email}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    name="phoneNo"
                                    value={formData.phoneNo}
                                    onChange={handleChange}
                                    variant="outlined"
                                    required
                                    error={!!errors.phoneNo}
                                    helperText={errors.phoneNo}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    variant="outlined"
                                    required
                                    error={!!errors.address}
                                    helperText={errors.address}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Avatar - Centered */}
                    <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Avatar sx={{ width: 250, height: 250, bgcolor: 'lightgray', borderRadius: 5}} />
                    </Grid>

                    {/* Right Section: Login Details */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" align="center" sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}>
                            Login Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    variant="outlined"
                                    required
                                    error={!!errors.username}
                                    helperText={errors.username}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    variant="outlined"
                                    required
                                    error={!!errors.password}
                                    helperText={errors.password}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Confirm Password"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    variant="outlined"
                                    required
                                    error={!!errors.confirmPassword}
                                    helperText={errors.confirmPassword}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Register Button */}
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            style={{ background: '#1b5e20', textTransform: 'none', width: '200px', height: '50px', fontSize: '19px' }}
                            onClick={handleRegister}
                            size="large"
                        >
                            Register
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default Register;