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
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { CartContext } from '../pages/CartContext';

const Title = styled(Typography)({
    flexGrow: 1,
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 700,
});

const StyledLink = styled(Link)(({ theme, active }) => ({
    textDecoration: 'none',
    color: active ? '#FFFFFF' : '#FFFFFF',
    fontSize: '1rem',
    fontWeight: active ? 'bold' : 'normal',
    padding: '6px 12px',
    borderRadius: '4px',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
}));

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const authToken = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    const { cartItems } = useContext(CartContext);

    const cartItemCount = cartItems.length || 0; // Use length for unique products, fallback to 0 if undefined

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
        setLogoutDialogOpen(false);
        navigate('/shop');
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                background: 'linear-gradient(90deg, #53F47E 0%, #2E7D32 100%)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                zIndex: 1200,
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
                    <Title variant="h6" sx={{ mr: 2, color: "#ffffff" }}>
                        GroceryEase
                    </Title>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    {authToken ? (
                        <>
                            {userType === 'CUSTOMER' && (
                                <>
                                    <Button color="inherit" sx={{ textTransform: 'none', mr: 1 }}>
                                        <StyledLink to="/products" active={location.pathname === '/products'}>
                                            Shop
                                        </StyledLink>
                                    </Button>
                                    <Button color="inherit" sx={{ textTransform: 'none', mr: 1 }}>
                                        <StyledLink to="/my-orders" active={location.pathname === '/my-orders'}>
                                            My Orders
                                        </StyledLink>
                                    </Button>
                                    <IconButton
                                        component={Link}
                                        to="/cart"
                                        color="inherit"
                                        sx={{ color: '#FFFFFF', mr: 2 }}
                                    >
                                        <Badge badgeContent={cartItemCount} color="error">
                                            <ShoppingCartIcon />
                                        </Badge>
                                    </IconButton>
                                </>
                            )}
                            <Button color="inherit" sx={{ textTransform: 'none', mr: 2 }}>
                                <StyledLink
                                    to="/profile"
                                    active={location.pathname === '/profile'}
                                    sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                    <AccountCircle sx={{ color: '#FFFFFF', mr: 1, fontSize: 30 }} />
                                    <Typography variant="subtitle1" color="#FFFFFF">
                                        {username}
                                    </Typography>
                                </StyledLink>
                            </Button>
                            <Button
                                color="inherit"
                                sx={{
                                    textTransform: 'none',
                                    color: '#FFFFFF',
                                    fontSize: '1rem',
                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                                }}
                                onClick={handleOpenDialogLogout}
                            >
                                Logout
                                <LogoutIcon sx={{ ml: 1, fontSize: 20 }} />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button color="inherit" sx={{ textTransform: 'none', mr: 1 }}>
                                <StyledLink to="/products" active={location.pathname === '/products'}>
                                    <ShoppingCartIcon />
                                    Shop
                                </StyledLink>
                            </Button>
                            <Button color="inherit" sx={{ textTransform: 'none', mr: 1 }}>
                                <StyledLink to="/login" active={location.pathname === '/login'}>
                                    <LoginIcon />
                                    Login
                                </StyledLink>
                            </Button>
                            <Button color="inherit" sx={{ textTransform: 'none', mr: 1 }}>
                                <StyledLink to="/register" active={location.pathname === '/register'}>
                                    <PersonAddIcon />
                                    Register
                                </StyledLink>
                            </Button>
                            {/*<Button color="inherit" sx={{ textTransform: 'none', mr: 1 }}>*/}
                            {/*    <StyledLink to="/about-us" active={location.pathname === '/about-us'}>*/}
                            {/*        About Us*/}
                            {/*    </StyledLink>*/}
                            {/*</Button>*/}
                            {/*<Button color="inherit" sx={{ textTransform: 'none' }}>*/}
                            {/*    <StyledLink to="/contact-us" active={location.pathname === '/contact-us'}>*/}
                            {/*        Contact Us*/}
                            {/*    </StyledLink>*/}
                            {/*</Button>*/}
                        </>
                    )}
                </Box>
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
                    <Button onClick={handleLogout} color="error">
                        Logout
                    </Button>
                </DialogActions>
            </Dialog>
        </AppBar>
    );
};

export default Navbar;