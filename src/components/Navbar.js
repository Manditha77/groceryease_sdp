import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('username');
        localStorage.removeItem('authToken');
        setUsername('');
        setIsAuthenticated(false); // Update state immediately
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
                            {username}
                        </Typography>
                        <Button color="inherit" sx={{ textTransform: 'none' }} onClick={handleLogout}>
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
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
