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
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
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
            navigate('/login');
            console.log('Registered successfully');
        } catch (error) {
            console.error('Registration failed', error);
        }
    };

    return (
        <Box sx={{ padding: 4, maxWidth: 1100, margin: 'auto', marginTop: 8 }}>
            <Typography variant="h4" align="center" gutterBottom style={{color: '#1b5e20', fontWeight: 'bold'}}>
                Customer Registration
            </Typography>
            <Paper elevation={3} sx={{ padding: 4, marginTop: 2 }}>
                <Grid container spacing={3}>

                    {/* Left Section: Customer Details */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" align={"center"} sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}>
                            Customer Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} variant="outlined" required />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} variant="outlined" required />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} variant="outlined" required />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Phone Number" name="phoneNo" value={formData.phoneNo} onChange={handleChange} variant="outlined" required />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} variant="outlined" required />
                            </Grid>
                        </Grid>
                    </Grid>


                    {/* Avatar - Centered */}
                    <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Avatar sx={{ width: 150, height: 150, bgcolor: 'lightgray' }}>
                            <PersonIcon fontSize="large" />
                        </Avatar>
                    </Grid>
                    {/* Right Section: Login Details */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" align={"center"} sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}>
                            Login Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Username" name="username" value={formData.username} onChange={handleChange} variant="outlined" required />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} variant="outlined" required />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} variant="outlined" required />
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