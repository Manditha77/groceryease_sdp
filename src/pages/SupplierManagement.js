import React, { useEffect, useState } from 'react';
import authService from '../services/authService';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    TextField,
    Avatar,
    Snackbar,
    Alert
} from '@mui/material';
import PersonIcon from "@mui/icons-material/Person";

const SupplierManagement = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNo: '',
        companyName: '',
    });
    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNo: '',
        companyName: '',
        general: ''
    });
    const [suppliers, setSuppliers] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarErrorOpen, setSnackbarErrorOpen] = useState(false);
    const [snackbarErrorMessage, setSnackbarErrorMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value.trimStart() }); // Prevent leading spaces
        setErrors({ ...errors, [name]: '', general: '' });
    };

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const data = await authService.getSuppliers();
                setSuppliers(data);
            } catch (error) {
                console.error('Error fetching suppliers:', error);
            }
        };

        fetchSuppliers();
    }, []);

    const validateForm = () => {
        let newErrors = { ...errors, general: '' };
        let isValid = true;

        const trimmedFormData = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phoneNo: formData.phoneNo.trim(),
            companyName: formData.companyName.trim(),
        };

        setFormData(trimmedFormData);

        if (!trimmedFormData.firstName) {
            newErrors.firstName = 'First name is required';
            isValid = false;
        } else if (trimmedFormData.firstName.length > 50) {
            newErrors.firstName = 'First name cannot exceed 50 characters';
            isValid = false;
        }

        if (!trimmedFormData.lastName) {
            newErrors.lastName = 'Last name is required';
            isValid = false;
        } else if (trimmedFormData.lastName.length > 50) {
            newErrors.lastName = 'Last name cannot exceed 50 characters';
            isValid = false;
        }

        if (!trimmedFormData.email) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedFormData.email)) {
            newErrors.email = 'Please enter a valid email address';
            isValid = false;
        } else if (trimmedFormData.email.length > 100) {
            newErrors.email = 'Email cannot exceed 100 characters';
            isValid = false;
        }

        if (!trimmedFormData.phoneNo) {
            newErrors.phoneNo = 'Phone number is required';
            isValid = false;
        } else if (!/^\d{10}$/.test(trimmedFormData.phoneNo)) {
            newErrors.phoneNo = 'Phone number must be exactly 10 digits';
            isValid = false;
        }

        if (!trimmedFormData.companyName) {
            newErrors.companyName = 'Company name is required';
            isValid = false;
        } else if (trimmedFormData.companyName.length > 100) {
            newErrors.companyName = 'Company name cannot exceed 100 characters';
            isValid = false;
        }

        // Check for duplicate email during registration
        if (!selectedUserId) {
            const emailExists = suppliers.some(sup => sup.email === trimmedFormData.email && sup.userId !== selectedUserId);
            if (emailExists) {
                newErrors.email = 'Email is already registered';
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleOpenRegisterDialog = () => {
        if (validateForm()) {
            setRegisterDialogOpen(true);
        } else {
            setSnackbarErrorMessage('Please fix the errors in the form before submitting.');
            setSnackbarErrorOpen(true);
        }
    };

    const handleCloseRegisterDialog = () => {
        setRegisterDialogOpen(false);
    };

    const handleConfirmRegisterSupplier = async () => {
        try {
            const newSupplier = await authService.registerSupplier(
                formData.firstName,
                formData.lastName,
                formData.email,
                formData.phoneNo,
                formData.companyName,
                'SUPPLIER',
            );
            setSuppliers([...suppliers, newSupplier]);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phoneNo: '',
                companyName: '',
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setSnackbarMessage('Supplier registered successfully');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error adding supplier:', error);
            setSnackbarErrorMessage('Failed to register supplier. Please try again.');
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseRegisterDialog();
        }
    };

    const handleOpenUpdateDialog = () => {
        if (validateForm()) {
            setUpdateDialogOpen(true);
        } else {
            setSnackbarErrorMessage('Please fix the errors in the form before submitting.');
            setSnackbarErrorOpen(true);
        }
    };

    const handleCloseUpdateDialog = () => {
        setUpdateDialogOpen(false);
    };

    const handleUpdateSupplier = async (userId) => {
        const supplier = suppliers.find((supplier) => supplier.userId === userId);
        setFormData({
            firstName: supplier.firstName,
            lastName: supplier.lastName,
            email: supplier.email,
            phoneNo: supplier.phoneNo,
            companyName: supplier.companyName,
        });
        setSelectedUserId(userId);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const handleConfirmUpdateSupplier = async () => {
        try {
            const updatedSupplier = await authService.updateSupplier(
                selectedUserId,
                formData.firstName,
                formData.lastName,
                formData.email,
                formData.phoneNo,
                formData.companyName,
            );

            const updatedSuppliers = suppliers.map((supplier) =>
                supplier.userId === selectedUserId ? updatedSupplier : supplier
            );
            setSuppliers(updatedSuppliers);
            setSnackbarMessage('Supplier updated successfully');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error updating supplier:', error);
            setSnackbarErrorMessage('Failed to update supplier. Please try again.');
            setSnackbarErrorOpen(true);
        } finally {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phoneNo: '',
                companyName: '',
            });
            setSelectedUserId(null);
            handleCloseUpdateDialog();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleOpenDeleteDialog = (userId) => {
        setSelectedUserId(userId);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSelectedUserId(null);
    };

    const handleConfirmDelete = async () => {
        try {
            await authService.deleteSupplier(selectedUserId);
            const updatedSuppliers = suppliers.filter((supplier) => supplier.userId !== selectedUserId);
            setSuppliers(updatedSuppliers);
            setSnackbarMessage('Supplier deleted successfully');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error deleting supplier:', error);
            setSnackbarErrorMessage('Failed to delete supplier. Please try again.');
            setSnackbarErrorOpen(true);
        } finally {
            handleCloseDeleteDialog();
        }
    };

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            <Box>
                <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                    Manage Suppliers
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Company Name</TableCell>
                                <TableCell>Contact-Number:</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {suppliers.map((supplier) => (
                                <TableRow key={supplier.userId}>
                                    <TableCell>{supplier.userId}</TableCell>
                                    <TableCell>{supplier.firstName} {supplier.lastName}</TableCell>
                                    <TableCell>{supplier.companyName}</TableCell>
                                    <TableCell>{supplier.phoneNo}</TableCell>
                                    <TableCell>{supplier.email}</TableCell>
                                    <TableCell>
                                        <Button variant="contained" style={{ marginRight: 8 }} sx={{ bgcolor: '#007bff' }} onClick={() => handleUpdateSupplier(supplier.userId)}>Edit</Button>
                                        <Button variant="contained" sx={{ bgcolor: '#dc3545' }} onClick={() => handleOpenDeleteDialog(supplier.userId)}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box sx={{ paddingTop: 5 }}>
                <Typography variant="h4" align="center" gutterBottom style={{ color: '#0478C0' }}>
                    {selectedUserId ? 'Update Supplier' : 'Register Supplier'}
                </Typography>
                <Paper elevation={3} sx={{ padding: 4, marginTop: 2 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" align="center" sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}>
                                Supplier Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} variant="outlined" required error={!!errors.firstName} helperText={errors.firstName} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} variant="outlined" required error={!!errors.lastName} helperText={errors.lastName} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} variant="outlined" required error={!!errors.email} helperText={errors.email} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Phone Number" name="phoneNo" value={formData.phoneNo} onChange={handleChange} variant="outlined" required error={!!errors.phoneNo} helperText={errors.phoneNo} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} variant="outlined" required error={!!errors.companyName} helperText={errors.companyName} />
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Avatar sx={{ width: 250, height: 250, bgcolor: 'lightgray', borderRadius: 5 }} />
                        </Grid>

                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                style={{ background: '#007bff', textTransform: 'none', width: '200px', height: '50px', fontSize: '19px' }}
                                onClick={selectedUserId ? handleOpenUpdateDialog : handleOpenRegisterDialog}
                                size="large"
                            >
                                {selectedUserId ? 'Update Supplier' : 'Register Supplier'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>

            <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this supplier?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={registerDialogOpen} onClose={handleCloseRegisterDialog}>
                <DialogTitle>Confirm Registration</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to register this supplier?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRegisterDialog}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmRegisterSupplier}>
                        Register
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={updateDialogOpen} onClose={handleCloseUpdateDialog}>
                <DialogTitle>Confirm Update</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to update this supplier?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUpdateDialog}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmUpdateSupplier}>
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%', height: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SupplierManagement;