import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    Container,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Fade,
} from '@mui/material';
import { styled } from '@mui/system';
import authService from '../services/authService'; // Adjust the path based on your project structure

// Styled components for enhanced UI
const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1),
    },
}));

const StyledButton = styled(Button)(({ theme }) => ({
    borderRadius: 8,
    padding: theme.spacing(1.5, 4),
    fontWeight: 600,
    textTransform: 'none',
    backgroundColor: '#2E7D32', // Green color for contained buttons
    color: '#ffffff', // White text for contrast
    '&:hover': {
        backgroundColor: '#1B5E20', // Darker green on hover
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    },
    '&.MuiButton-outlined': {
        backgroundColor: 'transparent',
        color: '#2E7D32', // Green text for outlined buttons
        borderColor: '#2E7D32', // Green border
        '&:hover': {
            backgroundColor: '#2E7D32', // Green background on hover
            color: '#ffffff', // White text on hover
        },
    },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: 8,
        backgroundColor: '#fff',
        '&:hover fieldset': {
            borderColor: '#2E7D32', // Green on hover
        },
        '&.Mui-focused fieldset': {
            borderColor: '#2E7D32', // Green when focused
        },
    },
    '& .MuiInputLabel-root': {
        color: '#2E7D32', // Green labels
        fontWeight: 500,
    },
    [theme.breakpoints.down('sm')]: {
        '& .MuiInputBase-input': {
            fontSize: '0.9rem',
        },
    },
}));

const CustomerProfile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNo: '',
        address: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [passwordFormErrors, setPasswordFormErrors] = useState({});
    const [confirmSaveDialogOpen, setConfirmSaveDialogOpen] = useState(false);
    const [confirmPasswordDialogOpen, setConfirmPasswordDialogOpen] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const loggedInUser = authService.getLoggedInUser();
                if (!loggedInUser) {
                    navigate('/login');
                    return;
                }
                const userData = await authService.getUser(loggedInUser.username);
                console.log('User data from API:', userData); // Log the API response to inspect
                setUser(userData);
                setFormData({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    phoneNo: userData.phoneNo || '',
                    address: userData.address || '',
                });
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch user data. Please try again.');
                setLoading(false);
            }
        };
        fetchUser();
    }, [navigate]);

    const validateForm = () => {
        const errors = {};
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }
        if (!formData.phoneNo.trim()) {
            errors.phoneNo = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.phoneNo)) {
            errors.phoneNo = 'Phone number must be 10 digits';
        }
        if (!formData.address.trim()) errors.address = 'Address is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validatePasswordForm = () => {
        const errors = {};
        if (!passwordForm.oldPassword.trim()) errors.oldPassword = 'Old password is required';
        if (!passwordForm.newPassword.trim()) {
            errors.newPassword = 'New password is required';
        } else if (passwordForm.newPassword.length < 6) {
            errors.newPassword = 'New password must be at least 6 characters';
        }
        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            errors.confirmNewPassword = 'Passwords do not match';
        }
        setPasswordFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setFormErrors({ ...formErrors, [name]: '' });
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm({ ...passwordForm, [name]: value });
        setPasswordFormErrors({ ...passwordFormErrors, [name]: '' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setConfirmSaveDialogOpen(true);
    };

    const handleConfirmSave = async () => {
        const userId = user?.id || user?.userId;
        if (!userId) {
            setError('User ID is missing. Unable to update profile.');
            setConfirmSaveDialogOpen(false);
            return;
        }

        try {
            setError('');
            setSuccess('');
            await authService.updateUser(
                userId,
                formData.firstName,
                formData.lastName,
                formData.email,
                formData.phoneNo,
                formData.address,
                'CUSTOMER',
                user.username
            );
            setSuccess('Profile updated successfully!');
            setConfirmSaveDialogOpen(false);
            localStorage.setItem('username', user.username);
        } catch (err) {
            setError('Failed to update profile. Please try again.');
            console.error('Update error:', err);
            setConfirmSaveDialogOpen(false);
        }
    };

    const handlePasswordSubmit = () => {
        if (!validatePasswordForm()) return;
        setConfirmPasswordDialogOpen(true);
    };

    const handleConfirmPasswordReset = async () => {
        const userId = user?.id || user?.userId;
        if (!userId) {
            setError('User ID is missing. Unable to reset password.');
            setConfirmPasswordDialogOpen(false);
            return;
        }

        try {
            setError('');
            setSuccess('');
            await authService.resetPassword(
                userId,
                passwordForm.oldPassword,
                passwordForm.newPassword
            );
            setSuccess('Password updated successfully!');
            setPasswordDialogOpen(false);
            setConfirmPasswordDialogOpen(false);
            setPasswordForm({
                oldPassword: '',
                newPassword: '',
                confirmNewPassword: '',
            });
        } catch (err) {
            setError('Failed to update password. Please check your old password and try again.');
            console.error('Password reset error:', err);
            setConfirmPasswordDialogOpen(false);
        }
    };

    const handleOpenPasswordDialog = () => {
        setPasswordDialogOpen(true);
        setPasswordFormErrors({});
    };

    const handleClosePasswordDialog = () => {
        setPasswordDialogOpen(false);
        setPasswordForm({
            oldPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        });
        setPasswordFormErrors({});
    };

    const handleCloseConfirmSaveDialog = () => {
        setConfirmSaveDialogOpen(false);
    };

    const handleCloseConfirmPasswordDialog = () => {
        setConfirmPasswordDialogOpen(false);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress sx={{ color: '#2E7D32' }} />
            </Box>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 12, mb: 4 }}>
            <Fade in={!loading} timeout={500}>
                <StyledCard>
                    <CardContent sx={{ p: 4 }}>
                        <Typography
                            variant="h4"
                            gutterBottom
                            align="center"
                            sx={{ color: '#2E7D32', fontWeight: 700 }}
                        >
                            My Profile
                        </Typography>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 8 }}>
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert severity="success" sx={{ mb: 3, borderRadius: 8 }}>
                                {success}
                            </Alert>
                        )}
                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            <StyledTextField
                                fullWidth
                                label="First Name"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                error={!!formErrors.firstName}
                                helperText={formErrors.firstName}
                                margin="normal"
                                variant="outlined"
                            />
                            <StyledTextField
                                fullWidth
                                label="Last Name"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                error={!!formErrors.lastName}
                                helperText={formErrors.lastName}
                                margin="normal"
                                variant="outlined"
                            />
                            <StyledTextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={!!formErrors.email}
                                helperText={formErrors.email}
                                margin="normal"
                                variant="outlined"
                            />
                            <StyledTextField
                                fullWidth
                                label="Phone Number"
                                name="phoneNo"
                                value={formData.phoneNo}
                                onChange={handleChange}
                                error={!!formErrors.phoneNo}
                                helperText={formErrors.phoneNo}
                                margin="normal"
                                variant="outlined"
                            />
                            <StyledTextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                error={!!formErrors.address}
                                helperText={formErrors.address}
                                margin="normal"
                                variant="outlined"
                            />
                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <StyledButton
                                    type="submit"
                                    variant="contained"
                                >
                                    Save Changes
                                </StyledButton>
                                <StyledButton
                                    variant="outlined"
                                    onClick={handleOpenPasswordDialog}
                                >
                                    Reset Password
                                </StyledButton>
                            </Box>
                        </Box>
                    </CardContent>
                </StyledCard>
            </Fade>

            {/* Password Reset Dialog */}
            <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog}>
                <DialogTitle sx={{ color: '#2E7D32' }}>Reset Password</DialogTitle>
                <DialogContent>
                    <StyledTextField
                        fullWidth
                        label="Old Password"
                        name="oldPassword"
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={handlePasswordChange}
                        error={!!passwordFormErrors.oldPassword}
                        helperText={passwordFormErrors.oldPassword}
                        margin="normal"
                        variant="outlined"
                    />
                    <StyledTextField
                        fullWidth
                        label="New Password"
                        name="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        error={!!passwordFormErrors.newPassword}
                        helperText={passwordFormErrors.newPassword}
                        margin="normal"
                        variant="outlined"
                    />
                    <StyledTextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirmNewPassword"
                        type="password"
                        value={passwordForm.confirmNewPassword}
                        onChange={handlePasswordChange}
                        error={!!passwordFormErrors.confirmNewPassword}
                        helperText={passwordFormErrors.confirmNewPassword}
                        margin="normal"
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <StyledButton
                        onClick={handleClosePasswordDialog}
                        variant="outlined"
                    >
                        Cancel
                    </StyledButton>
                    <StyledButton
                        onClick={handlePasswordSubmit}
                        variant="contained"
                    >
                        Change Password
                    </StyledButton>
                </DialogActions>
            </Dialog>

            {/* Confirm Save Changes Dialog */}
            <Dialog open={confirmSaveDialogOpen} onClose={handleCloseConfirmSaveDialog}>
                <DialogTitle sx={{ color: '#2E7D32' }}>Confirm Profile Update</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to save changes to your profile?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <StyledButton
                        onClick={handleCloseConfirmSaveDialog}
                        variant="outlined"
                    >
                        Cancel
                    </StyledButton>
                    <StyledButton
                        onClick={handleConfirmSave}
                        variant="contained"
                    >
                        Confirm
                    </StyledButton>
                </DialogActions>
            </Dialog>

            {/* Confirm Password Reset Dialog */}
            <Dialog open={confirmPasswordDialogOpen} onClose={handleCloseConfirmPasswordDialog}>
                <DialogTitle sx={{ color: '#2E7D32' }}>Confirm Password Reset</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to reset your password?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <StyledButton
                        onClick={handleCloseConfirmPasswordDialog}
                        variant="outlined"
                    >
                        Cancel
                    </StyledButton>
                    <StyledButton
                        onClick={handleConfirmPasswordReset}
                        variant="contained"
                    >
                        Confirm
                    </StyledButton>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default CustomerProfile;