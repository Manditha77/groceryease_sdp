import React, { useState } from 'react';
import { TextField, Button, Grid, Typography, Paper, Avatar } from '@mui/material';
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
                'CUSTOMER',
                formData.username,
                formData.password
            );
            navigate('/login');
        } catch (error) {
            console.error('Registration failed', error);
        }
    };

    return (
        <Paper elevation={3} sx={{ padding: 4, maxWidth: 800, margin: 'auto', marginTop: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
                Customer Registration
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} variant="outlined" required />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} variant="outlined" required />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} variant="outlined" required />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Username" name="username" value={formData.username} onChange={handleChange} variant="outlined" required />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Phone Number" name="phoneNo" value={formData.phoneNo} onChange={handleChange} variant="outlined" required />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} variant="outlined" required />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} variant="outlined" required />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} variant="outlined" required />
                </Grid>
                <Grid item xs={12} align="center">
                    <Avatar sx={{ width: 80, height: 80, bgcolor: 'lightgray' }}>
                        <PersonIcon fontSize="large" />
                    </Avatar>
                </Grid>
                <Grid item xs={12} align="center">
                    <Button variant="contained" color="success" onClick={handleRegister} size="large">
                        Register
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default Register;
