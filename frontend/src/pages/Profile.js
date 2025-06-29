import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Paper, Grid, Box, Typography, Divider, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Snackbar } from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import authService from '../services/authService';

const Profile = () => {
    const location = useLocation();
    const [username, setUsername] = useState('');
    const [user, setUser] = useState({});
    const storedUsername = localStorage.getItem('username');
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
    const [updatedUser, setUpdatedUser] = useState({});
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, [location]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await authService.getUser(storedUsername);
                setUser(data);
            } catch (error) {
                console.error(error);
                setSnackbar({ open: true, message: 'Failed to fetch user data.', severity: 'error' });
            }
        };

        fetchUser();
    }, []);

    const handleEditDialogOpen = () => {
        setUpdatedUser({ ...user });
        setEditDialogOpen(true);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
    };

    const handleResetPasswordDialogOpen = () => {
        setPasswordData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
        setResetPasswordDialogOpen(true);
    };

    const handleResetPasswordDialogClose = () => {
        setResetPasswordDialogOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUpdatedUser({ ...updatedUser, [name]: value });
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });
    };

    const handleUpdateUser = async () => {
        try {
            await authService.updateUser(
                updatedUser.userId,
                updatedUser.firstName,
                updatedUser.lastName,
                updatedUser.email,
                updatedUser.phoneNo,
                (updatedUser.userType === 'EMPLOYEE' || updatedUser.userType === 'CUSTOMER') ? updatedUser.address : null,
                updatedUser.userType,
                updatedUser.username,
                updatedUser.password
            );
            setUser({ ...user, ...updatedUser });
            setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
            setEditDialogOpen(false);
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Failed to update profile.', severity: 'error' });
        }
    };

    const handleResetPassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            setSnackbar({ open: true, message: 'New password and confirmation do not match.', severity: 'error' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setSnackbar({ open: true, message: 'New password must be at least 6 characters long.', severity: 'error' });
            return;
        }

        try {
            await authService.resetPassword(user.userId, passwordData.oldPassword, passwordData.newPassword);
            setSnackbar({ open: true, message: 'Password reset successfully!', severity: 'success' });
            setResetPasswordDialogOpen(false);
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to reset password. Incorrect old password or other error.', severity: 'error' });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const isOwner = user.userType === 'OWNER';

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                Profile
            </Typography>
            <Divider />
            <Box sx={{ padding: 1 }}>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center' }}>
                    <Avatar sx={{ width: 250, height: 250, borderRadius: 5 }} />
                </Grid>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center' }}>
                    <Typography variant="h4" gutterBottom sx={{ color: '#122E40' }}>
                        {username}
                        <br />
                        <Typography variant="h6" gutterBottom sx={{ color: '#495D69', fontSize: 18 }}>
                            {user.userType}
                        </Typography>
                    </Typography>
                </Grid>
            </Box>
            <Box sx={{ padding: 1 }}>
                <Paper elevation={3} sx={{ padding: 3, width: 1000, borderRadius: 5, bgcolor: '#BCE1E1', border: 1 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '100px auto', gap: 1 }}>
                        <Typography variant="h5">ID</Typography>
                        <Typography variant="h5">: {user.userId}</Typography>

                        <Typography variant="h5">Name</Typography>
                        <Typography variant="h5">: {user.firstName} {user.lastName}</Typography>

                        {!isOwner && (
                            <>
                                <Typography variant="h5">Address</Typography>
                                <Typography variant="h5">: {user.address || 'Not provided'}</Typography>
                            </>
                        )}

                        <Typography variant="h5">Contact</Typography>
                        <Typography variant="h5">: {user.phoneNo}</Typography>

                        <Typography variant="h5">Email</Typography>
                        <Typography variant="h5">: {user.email}</Typography>
                    </Box>
                </Paper>
            </Box>
            <Box sx={{ padding: 1 }}>
                <Button
                    variant="contained"
                    sx={{ bgcolor: 'rgba(217,217,217,0.50)', color: '#0478C0', marginLeft: 100, marginRight: 2, fontWeight: 'bold' }}
                    onClick={handleResetPasswordDialogOpen}
                >
                    Reset Password
                </Button>
                <Button
                    variant="contained"
                    sx={{ bgcolor: 'rgba(217,217,217,0.50)', color: '#0478C0', fontWeight: 'bold' }}
                    onClick={handleEditDialogOpen}
                >
                    Edit
                </Button>
            </Box>

            {/* Edit Profile Dialog */}
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
                    {(updatedUser.userType === 'EMPLOYEE' || updatedUser.userType === 'CUSTOMER') && (
                        <TextField
                            fullWidth
                            label="Address"
                            name="address"
                            value={updatedUser.address || ''}
                            onChange={handleInputChange}
                            margin="normal"
                        />
                    )}
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

            {/* Reset Password Dialog */}
            <Dialog open={resetPasswordDialogOpen} onClose={handleResetPasswordDialogClose}>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Old Password"
                        name="oldPassword"
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={handlePasswordInputChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="New Password"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirmNewPassword"
                        type="password"
                        value={passwordData.confirmNewPassword}
                        onChange={handlePasswordInputChange}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleResetPasswordDialogClose}>Cancel</Button>
                    <Button onClick={handleResetPassword} variant="contained" color="primary">
                        Reset Password
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for Confirmation */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Profile;