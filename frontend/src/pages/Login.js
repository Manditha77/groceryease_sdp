import React, { useState, useEffect } from 'react'; // Add useEffect
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { Box, Grid, TextField, Button, Typography, Link, Snackbar, Alert } from "@mui/material";
import logo from '../images/Rectangle 4139.png';

const Login = ({ setIsAuthenticated }) => {
    const location = useLocation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(location.state?.success || '');
    const [open, setOpen] = useState(false);
    const [openSuccess, setOpenSuccess] = useState(!!successMessage);
    const navigate = useNavigate();

    // Redirect authenticated users away from login page
    useEffect(() => {
        const isAuthenticated = !!localStorage.getItem('authToken');
        const userType = localStorage.getItem('userType');

        if (isAuthenticated) {
            // Redirect based on userType
            if (userType === 'CUSTOMER') {
                navigate('/product-list', { replace: true });
            } else if (userType === 'OWNER' || userType === 'EMPLOYEE') {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await authService.login(username, password);
            localStorage.setItem('username', username);
            localStorage.setItem('authToken', 'dummy-token'); // Replace with actual token
            localStorage.setItem('userType', response.userType);
            setIsAuthenticated(true);

            // Redirect based on userType
            if (response.userType === 'CUSTOMER') {
                navigate('/product-list', { state: { success: 'Logged in successfully' }, replace: true });
            } else if (response.userType === 'OWNER' || response.userType === 'EMPLOYEE') {
                navigate('/dashboard', { state: { success: 'Logged in successfully' }, replace: true });
            } else {
                throw new Error('Unknown user type');
            }
        } catch (error) {
            setError('Login failed. Please check your credentials and try again.');
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

            {/* Success Snackbar for Registration */}
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
                    <Typography variant="h4" fontWeight="bold" align={"center"} color="green" gutterBottom>
                        Login
                    </Typography>
                    <Typography variant="h4" align={"center"} color="textSecondary" gutterBottom>
                        Welcome to the GroceryEase
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
                </Box>
            </Grid>
        </Grid>
    );
};

export default Login;