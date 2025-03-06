import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { styled } from '@mui/system';
import {AccountCircle} from "@mui/icons-material";
import {Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,} from "@mui/material";

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

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, [location]);

    const handleOpenDialogLogout = () => {
        setLogoutDialogOpen(true);
    }

    const handleCloseDialogLogout = () => {
        setLogoutDialogOpen(false);
    }

    const handleLogout = () => {
        localStorage.removeItem('username');
        localStorage.removeItem('authToken');
        setUsername('');
        setIsAuthenticated(false); // Update state immediately
        setLogoutDialogOpen(false);
        navigate('/login'); // Navigate to login page
    };

    return (
        <AppBar position="fixed" sx={{ backgroundColor: '#53F47E', width: '100%' }}>
        <Toolbar>
                <Title variant="h6" color={"black"}>
                    GroceryEase
                </Title>
                {isAuthenticated ? (
                    <>
                        <Typography variant="h6" color="black" sx={{ marginRight: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccountCircle sx={{ marginRight: 0.2, fontSize: 35 }} />
                                {username}
                            </Box>
                        </Typography>
                        <Button color="inherit" sx={{ textTransform: 'none', color: 'black', fontSize: 20 }} onClick={handleOpenDialogLogout}>
                            Logout
                        </Button>
                    </>
                ) : (
                    <>
                        <Button color="inherit" sx={{ textTransform: 'none' }}>
                            <StyledLink to="/login" active={location.pathname === '/login'}>
                                Login Page
                            </StyledLink>
                        </Button>
                        <Button color="inherit" sx={{ textTransform: 'none' }}>
                            <StyledLink to="/register" active={location.pathname === '/register'}>
                                Customer Registration
                            </StyledLink>
                        </Button>
                        <Button color="inherit" sx={{ textTransform: 'none' }}>
                            <StyledLink to="/aboutUs" active={location.pathname === '/dashboard'}>
                                About Us
                            </StyledLink>
                        </Button>
                        <Button color="inherit" sx={{ textTransform: 'none' }}>
                            <StyledLink to="/contactUs" active={location.pathname === '/dashboard'}>
                                Contact Us
                            </StyledLink>
                        </Button>
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
