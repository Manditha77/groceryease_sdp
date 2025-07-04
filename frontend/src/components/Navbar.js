import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { styled } from '@mui/system';
import { AccountCircle } from '@mui/icons-material';
import LogoutIcon from '@mui/icons-material/Logout';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { CartContext } from '../CartContext';

const Title = styled(Typography)({
    flexGrow: 1,
});

const StyledLink = styled(Link)(({ theme, active }) => ({
    textDecoration: 'none',
    color: active ? 'black' : 'black',
    fontSize: '1rem',
    fontWeight: active ? 'bold' : 'normal',
}));

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const userType = localStorage.getItem('userType');
    const { cartItems } = useContext(CartContext);

    const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, [location]);

    const handleOpenDialogLogout = () => {
        setLogoutDialogOpen(true);
    };

    const handleCloseDialogLogout = () => {
        setLogoutDialogOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('username');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        setUsername('');
        setIsAuthenticated(false);
        setLogoutDialogOpen(false);
        navigate('/login');
    };

    return (
        <AppBar position="fixed" sx={{ background: 'linear-gradient(90deg, #53F47E 0%, #2E7D32 100%)', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', zIndex: 1200, }}>
            <Toolbar>
                <Title variant="h6" sx={{ color: '#fffcfc', fontWeight: 'bold', fontSize: 26 }}>
                    Samantha Store
                </Title>
                {isAuthenticated ? (
                    <>
                        {userType === 'CUSTOMER' && (
                            <>
                                <Button color="inherit" sx={{ textTransform: 'none' }}>
                                    <StyledLink
                                        to="/product-list"
                                        active={location.pathname === '/product-list'}
                                    >
                                        Shop
                                    </StyledLink>
                                </Button>
                                <Button color="inherit" sx={{ textTransform: 'none' }}>
                                    <StyledLink
                                        to="/my-orders"
                                        active={location.pathname === '/my-orders'}
                                    >
                                        My Orders
                                    </StyledLink>
                                </Button>
                                <IconButton
                                    component={Link}
                                    to="/cart"
                                    color="inherit"
                                    sx={{ color: 'black', marginRight: 2 }}
                                >
                                    <Badge badgeContent={cartItemCount} color="error">
                                        <ShoppingCartIcon />
                                    </Badge>
                                </IconButton>
                            </>
                        )}
                        <Typography
                            variant="h6"
                            color="white"
                            sx={{ marginRight: 2 }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccountCircle sx={{ marginRight: 0.2, fontSize: 35 }} />
                                {username}
                            </Box>
                        </Typography>

                        <Button
                            color="inherit"
                            sx={{ textTransform: 'none', color: 'white', fontSize: 20 }}
                            onClick={handleOpenDialogLogout}
                        >
                            <LogoutIcon sx={{ fontSize: 30, color: 'white' }} />
                            Logout
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            color="inherit"
                            sx={{
                                textTransform: 'none',
                                color: '#ffffff', // White color for the button text
                                fontSize: '1.25rem', // Larger font size (adjust as needed, 1.25rem = 20px)
                                '&:hover': {
                                    color: '#f0f0f0', // Slightly off-white on hover for better UX
                                },
                            }}
                        >
                            <StyledLink
                                to="/login"
                                active={location.pathname === '/login'}
                                sx={{
                                    color: 'inherit', // Ensures StyledLink inherits the white color from the Button
                                    fontSize: 'inherit', // Inherits the larger font size from the Button
                                    textDecoration: 'none', // Removes any default underline
                                }}
                            >
                                Login Page
                            </StyledLink>
                        </Button>
                        {/*<Button color="inherit" sx={{ textTransform: 'none' }}>*/}
                        {/*    <StyledLink to="/register" active={location.pathname === '/register'}>*/}
                        {/*        Customer Registration*/}
                        {/*    </StyledLink>*/}
                        {/*</Button>*/}
                        {/*<Button color="inherit" sx={{ textTransform: 'none' }}>*/}
                        {/*    <StyledLink to="/aboutUs" active={location.pathname === '/dashboard'}>*/}
                        {/*        About Us*/}
                        {/*    </StyledLink>*/}
                        {/*</Button>*/}
                        {/*<Button color="inherit" sx={{ textTransform: 'none' }}>*/}
                        {/*    <StyledLink to="/contactUs" active={location.pathname === '/dashboard'}>*/}
                        {/*        Contact Us*/}
                        {/*    </StyledLink>*/}
                        {/*</Button>*/}
                    </>
                )}
            </Toolbar>
            <Dialog open={logoutDialogOpen} onClose={handleCloseDialogLogout}>
                <DialogTitle>Logout</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to logout?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogLogout}>Cancel</Button>
                    <Button onClick={handleLogout}>Logout</Button>
                </DialogActions>
            </Dialog>
        </AppBar>
    );
};

export default Navbar;