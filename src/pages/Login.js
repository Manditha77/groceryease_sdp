// groceryease-frontend/src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { Box, Grid, TextField, Button, Typography, Link } from "@mui/material";
import logo from '../images/Rectangle 4139.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const data = await authService.login(username, password);
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    const handleRegisterClick = () => {
        navigate('/register');
    };

    return (
        <Grid container justifyContent="center" alignItems="center" sx={{ height: "90vh", px: 3 }}>
            {/* Left Section - Logo */}
            <Grid item xs={12} md={6} sx={{ display: "flex", justifyContent: "center" }}>
                <img src={logo} alt="GroceryEase Logo" width="60%" />
            </Grid>

            {/* Right Section - Login Form */}
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
                    <Typography variant="h5" fontWeight="bold" color="green" gutterBottom>
                        Login
                    </Typography>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Welcome
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

                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                            <Button variant="text" sx={{ textTransform: "none", color: "gray" }}>
                                Forgot Password?
                            </Button>
                        </Box>
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