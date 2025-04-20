import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Paper, Grid, Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Snackbar } from "@mui/material";
import {AccountCircle} from "@mui/icons-material";
import authService from '../services/authService';

const Profile = () => {
    const location = useLocation();
    const [username, setUsername] = useState('');
    const [user, setUser] = useState({});
    const storedUsername = localStorage.getItem('username');
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [updatedUser, setUpdatedUser] = useState({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, [location]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data= await authService.getUser(storedUsername);
                setUser(data);
            } catch (error) {
                console.error(error);
            }
        }

        fetchUser();
    }, []);

    const handleEditDialogOpen = () => {
        setUpdatedUser(user);
        setEditDialogOpen(true);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUpdatedUser({ ...updatedUser, [name]: value });
    };

    const handleUpdateUser = async () => {
        try {
            await authService.updateUser(updatedUser.userId, updatedUser.firstName, updatedUser.lastName, updatedUser.email, updatedUser.phoneNo, updatedUser.address, updatedUser.userType, updatedUser.username, updatedUser.password);
            setUser(updatedUser); // Update the user state with the new data
            setSnackbarMessage('Profile updated successfully!');
            setSnackbarOpen(true);
            setEditDialogOpen(false);
        } catch (error) {
            console.error(error);
            setSnackbarMessage('Failed to update profile.');
            setSnackbarOpen(true);
        }
    };

    return (
        <Box sx={{ padding: 4, paddingTop: 7}}>
            <Typography variant="h4" gutterBottom sx={{color: '#0478C0'}}>
                Profile
            </Typography>
            <Divider />
            <Box sx={{padding: 1}}>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center'}}>
                    <Avatar sx={{ width: 250, height: 250, borderRadius: 5}} />
                </Grid>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center'}}>
                    <Typography variant="h4" gutterBottom sx={{ color: '#122E40'}}>
                        {username}
                        <br/>
                        <Typography variant="h6" gutterBottom sx={{ color: '#495D69', fontSize: 18}}>
                            {user.userType}
                        </Typography>
                    </Typography>
                </Grid>
            </Box>
            <Box sx={{padding: 1}}>
                <Paper elevation={3} sx={{ padding: 3, width: 1000, borderRadius: 5, bgcolor: '#BCE1E1', border: 1}}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '100px auto', gap: 1 }}>
                        <Typography variant="h5">ID</Typography>
                        <Typography variant="h5">: {user.userId}</Typography>

                        <Typography variant="h5">Name</Typography>
                        <Typography variant="h5">: {user.firstName} {user.lastName}</Typography>

                        <Typography variant="h5">Address</Typography>
                        <Typography variant="h5">: {user.address}</Typography>

                        <Typography variant="h5">Contact </Typography>
                        <Typography variant="h5">: {user.phoneNo}</Typography>

                        <Typography variant="h5">Email</Typography>
                        <Typography variant="h5">: {user.email}</Typography>
                    </Box>
                </Paper>
            </Box>
            <Box sx={{padding: 1}}>
                <Button variant="contained" sx={{ bgcolor: 'rgba(217,217,217,0.50)', color: '#0478C0', marginLeft: 100, marginRight: 2, fontWeight: 'bold'}}>Reset Password</Button>
                <Button variant="contained" sx={{ bgcolor: 'rgba(217,217,217,0.50)', color: '#0478C0', fontWeight: 'bold'}} onClick={handleEditDialogOpen}>Edit</Button>
            </Box>

            <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={updatedUser.firstName || ''}
                        onChange={handleInputChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={updatedUser.lastName || ''}
                        onChange={handleInputChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Address"
                        name="address"
                        value={updatedUser.address || ''}
                        onChange={handleInputChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Contact"
                        name="phoneNo"
                        value={updatedUser.phoneNo || ''}
                        onChange={handleInputChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={updatedUser.email || ''}
                        onChange={handleInputChange}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditDialogClose}>Cancel</Button>
                    <Button onClick={handleUpdateUser} variant="contained" color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for Confirmation */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Profile;