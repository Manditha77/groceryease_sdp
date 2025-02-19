import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { styled } from '@mui/system';

const Title = styled(Typography)({
    flexGrow: 1,
});

const StyledLink = styled(Link)(({ theme, active }) => ({
    textDecoration: 'none',
    color: active ? 'black' : 'black',
    fontSize: '1rem',
    fontWeight: active ? 'bold' : 'normal',
}));

const Navbar = () => {
    const location = useLocation();

    return (
        <AppBar position="static" sx={{ backgroundColor: '#53F47E' }}>
            <Toolbar>
                <Title variant="h6" color={"black"}>
                    GroceryEase
                </Title>
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
                    <StyledLink to="/login" active={location.pathname === '/dashboard'}>
                        About Us
                    </StyledLink>
                </Button>
                <Button color="inherit" sx={{ textTransform: 'none' }}>
                    <StyledLink to="/login" active={location.pathname === '/dashboard'}>
                        Contact Us
                    </StyledLink>
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;