import React, { useState, useContext } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Badge,
    Box,
    Button,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    useMediaQuery,
    useTheme,
    Avatar,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    ShoppingCart,
    ShoppingBag,
    Menu as MenuIcon,
    Close,
    Person,
    Favorite,
    Home,
    LogOut,
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../CartContext';

interface HeaderProps {
    username?: string;
    onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ username, onLogout }) => {
    const { cartItems } = useContext(CartContext);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const location = useLocation();

    const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    const handleNavigation = (path: string) => {
        navigate(path);
        setDrawerOpen(false);
    };

    const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setUserMenuAnchor(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setUserMenuAnchor(null);
    };

    const handleLogout = () => {
        handleUserMenuClose();
        if (onLogout) onLogout();
    };

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const navItems = [
        { label: 'Home', path: '/', icon: <Home /> },
        { label: 'Products', path: '/product-list', icon: <ShoppingBag /> },
        { label: 'Wishlist', path: '/wishlist', icon: <Favorite /> },
        { label: 'Cart', path: '/cart', icon: <ShoppingCart /> },
    ];

    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    backgroundColor: 'white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    zIndex: (theme) => theme.zIndex.drawer + 1
                }}
            >
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    {isMobile && (
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={() => setDrawerOpen(true)}
                            sx={{ color: '#555' }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Typography
                        variant="h6"
                        component={Link}
                        to="/"
                        sx={{
                            color: '#0478C0',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <ShoppingBag sx={{ mr: 1 }} />
                        GroceryEase
                    </Typography>

                    {!isMobile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {navItems.map((item) => (
                                item.path !== '/cart' && (
                                    <Button
                                        key={item.path}
                                        component={Link}
                                        to={item.path}
                                        startIcon={item.icon}
                                        sx={{
                                            mx: 1,
                                            color: isActive(item.path) ? '#0478C0' : '#555',
                                            fontWeight: isActive(item.path) ? 'bold' : 'normal',
                                            '&:hover': {
                                                backgroundColor: 'rgba(4, 120, 192, 0.08)',
                                            },
                                            borderRadius: 8,
                                            textTransform: 'none',
                                            position: 'relative',
                                        }}
                                    >
                                        {item.label}
                                        {isActive(item.path) && (
                                            <motion.div
                                                layoutId="underline"
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: 3,
                                                    backgroundColor: '#0478C0',
                                                    borderRadius: 8,
                                                }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </Button>
                                )
                            ))}
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            color="inherit"
                            component={Link}
                            to="/cart"
                            sx={{
                                color: isActive('/cart') ? '#0478C0' : '#555',
                                mr: 1,
                            }}
                        >
                            <Badge badgeContent={cartItemCount} color="error">
                                <ShoppingCart />
                            </Badge>
                        </IconButton>

                        {username ? (
                            <>
                                <Button
                                    onClick={handleUserMenuOpen}
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: 8,
                                    }}
                                    startIcon={
                                        <Avatar
                                            sx={{
                                                width: 30,
                                                height: 30,
                                                backgroundColor: '#0478C0',
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            {username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    }
                                >
                                    {isMobile ? '' : username}
                                </Button>
                                <Menu
                                    anchorEl={userMenuAnchor}
                                    open={Boolean(userMenuAnchor)}
                                    onClose={handleUserMenuClose}
                                    PaperProps={{
                                        elevation: 1,
                                        sx: {
                                            mt: 1.5,
                                            borderRadius: 2,
                                            minWidth: 180,
                                        },
                                    }}
                                >
                                    <MenuItem onClick={() => { handleUserMenuClose(); navigate('/profile'); }}>
                                        <ListItemIcon>
                                            <Person fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Profile</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={() => { handleUserMenuClose(); navigate('/orders'); }}>
                                        <ListItemIcon>
                                            <ShoppingBag fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>My Orders</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={handleLogout}>
                                        <ListItemIcon>
                                            <LogOut fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Logout</ListItemText>
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                component={Link}
                                to="/login"
                                sx={{
                                    borderRadius: 8,
                                    textTransform: 'none',
                                    px: 3,
                                    boxShadow: 'none',
                                }}
                            >
                                Login
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>
            <Toolbar /> {/* Empty toolbar for spacing */}

            {/* Mobile Navigation Drawer */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        width: 280,
                        borderTopRightRadius: 16,
                        borderBottomRightRadius: 16,
                        pt: 2,
                    },
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: 2,
                        pb: 2,
                    }}
                >
                    <Typography variant="h6" sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                        GroceryEase
                    </Typography>
                    <IconButton onClick={() => setDrawerOpen(false)}>
                        <Close />
                    </IconButton>
                </Box>

                {username && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 2,
                            borderBottom: '1px solid #eee',
                            mb: 1,
                        }}
                    >
                        <Avatar
                            sx={{
                                backgroundColor: '#0478C0',
                                width: 40,
                                height: 40,
                                mr: 2,
                            }}
                        >
                            {username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="subtitle1">{username}</Typography>
                    </Box>
                )}

                <List sx={{ px: 1 }}>
                    <AnimatePresence>
                        {navItems.map((item) => (
                            <motion.div
                                key={item.path}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ListItem
                                    button
                                    onClick={() => handleNavigation(item.path)}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 1,
                                        backgroundColor: isActive(item.path) ? 'rgba(4, 120, 192, 0.08)' : 'transparent',
                                        color: isActive(item.path) ? '#0478C0' : 'inherit',
                                    }}
                                >
                                    <ListItemIcon sx={{ color: isActive(item.path) ? '#0478C0' : 'inherit' }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.label} />
                                    {item.path === '/cart' && cartItemCount > 0 && (
                                        <Badge badgeContent={cartItemCount} color="error" />
                                    )}
                                </ListItem>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {username ? (
                        <>
                            <ListItem
                                button
                                onClick={() => handleNavigation('/profile')}
                                sx={{ borderRadius: 2, mb: 1 }}
                            >
                                <ListItemIcon>
                                    <Person />
                                </ListItemIcon>
                                <ListItemText primary="Profile" />
                            </ListItem>
                            <ListItem
                                button
                                onClick={() => handleNavigation('/orders')}
                                sx={{ borderRadius: 2, mb: 1 }}
                            >
                                <ListItemIcon>
                                    <ShoppingBag />
                                </ListItemIcon>
                                <ListItemText primary="My Orders" />
                            </ListItem>
                            <ListItem
                                button
                                onClick={handleLogout}
                                sx={{ borderRadius: 2, mb: 1 }}
                            >
                                <ListItemIcon>
                                    <LogOut />
                                </ListItemIcon>
                                <ListItemText primary="Logout" />
                            </ListItem>
                        </>
                    ) : (
                        <ListItem
                            button
                            onClick={() => handleNavigation('/login')}
                            sx={{
                                borderRadius: 2,
                                mb: 1,
                                bgcolor: '#0478C0',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: '#0369a9',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white' }}>
                                <Person />
                            </ListItemIcon>
                            <ListItemText primary="Login" />
                        </ListItem>
                    )}
                </List>
            </Drawer>
        </>
    );
};

export default Header;