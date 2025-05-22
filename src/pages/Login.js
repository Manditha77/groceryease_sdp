import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { Box, Grid, TextField, Button, Typography, Link, Snackbar, Alert } from "@mui/material";
import logo from '../images/Rectangle 4139.png';

const Login = () => {
    const location = useLocation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(location.state?.success || '');
    const [open, setOpen] = useState(false);
    const [openSuccess, setOpenSuccess] = useState(!!successMessage);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await authService.login(username, password);
            if (response.userType !== 'CUSTOMER') {
                throw new Error('This portal is for customers only. Please use the IMS portal at http://localhost:3001/login.');
            }
            localStorage.setItem('username', username);
            localStorage.setItem('authToken', response.authToken || 'dummy-token'); // Use actual token if provided by backend
            localStorage.setItem('userType', response.userType);

            const from = location.state?.from?.pathname || '/products';
            navigate(from, { state: { success: 'Logged in successfully' }, replace: true });
        } catch (error) {
            setError(error.message || 'Login failed. Please check your credentials and try again.');
            setOpen(true);
        }
    };

    const handleRegisterClick = () => {
        navigate('/register');
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        setOpenSuccess(false);
    };

    return (
        <Grid container justifyContent="center" alignItems="center" sx={{ height: "90vh", px: 3, paddingTop: "10vh" }}>
            {/* Error Snackbar */}
            <Snackbar open={open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={handleClose} severity="error" sx={{ width: '100%', height: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            {/* Success Snackbar */}
            <Snackbar open={openSuccess} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={handleClose} severity="success" sx={{ width: '100%', height: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            <Grid item xs={12} md={6} sx={{ display: "flex", justifyContent: "center" }}>
                <img src={logo} alt="GroceryEase Logo" width="60%" />
            </Grid>
            <Grid item xs={12} md={6}>
                <Box
                    sx={{
                        bgcolor: "white",
                        padding: "40px",
                        borderRadius: "10px",
                        boxShadow: 3,
                        width: "80%",
                        mx: "auto",
                    }}
                >
                    <Typography variant="h4" fontWeight="bold" align="center" color="green" gutterBottom>
                        Customer Login
                    </Typography>
                    <Typography variant="h4" align="center" color="textSecondary" gutterBottom>
                        Welcome to GroceryEase
                    </Typography>
                    <form onSubmit={handleLogin}>
                        <TextField
                            label="Username"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <TextField
                            label="Password"
                            type="password"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{ mt: 2, bgcolor: "#2E7D32", "&:hover": { bgcolor: "#1B5E20" } }}
                        >
                            Login
                        </Button>
                    </form>
                    <Typography sx={{ mt: 3, textAlign: "center", color: "gray" }}>
                        New to GroceryEase?{" "}
                        <Link onClick={handleRegisterClick} sx={{ fontWeight: "bold", color: "#2E7D32", cursor: "pointer" }}>
                            Register Here
                        </Link>
                    </Typography>
                </Box>
            </Grid>
        </Grid>
    );
};

export default Login;