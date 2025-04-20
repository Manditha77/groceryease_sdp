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
    Grid, TextField, Avatar, Snackbar, Alert
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

    const [suppliers, setSuppliers] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const data = await authService.getSuppliers();
                setSuppliers(data);
            } catch (error) {
                console.error('Error fetching employees:', error);
            }
        };

        fetchSuppliers();
    }, []);

    const handleOpenRegisterDialog = () => {
        setRegisterDialogOpen(true);
    }

    const handleCloseRegisterDialog = () => {
        setRegisterDialogOpen(false);
    }

    const handleConfirmRegisterSupplier = async () => {
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const newSupplier = await authService.registerSupplier(
                formData.firstName,
                formData.lastName,
                formData.email,
                formData.phoneNo,
                formData.companyName,
                'SUPPLIER',
            );
            setSuppliers([...suppliers, newSupplier]); // Add the new employee to the state
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
        } finally {
            handleCloseRegisterDialog();
        }
    }

    const handleOpenUpdateDialog = () => {
        setUpdateDialogOpen(true);
    }

    const handleCloseUpdateDialog = () => {
        setUpdateDialogOpen(false);
    }

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
    }

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
        } finally {
            handleCloseDeleteDialog();
        }
    };
    return (
        <Box sx={{ padding: 4, paddingTop: 7}}>
            <Box>
                <Typography variant="h4" gutterBottom sx={{color: '#0478C0', fontWeight: 'bold'}}>
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
                                        <Button variant="contained" style={{ marginRight: 8}} sx={{ bgcolor: '#007bff' }} onClick={() => handleUpdateSupplier(supplier.userId)}>Edit</Button>
                                        <Button variant="contained" sx={{ bgcolor: '#dc3545' }} onClick={() => handleOpenDeleteDialog(supplier.userId)}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box sx={{ paddingTop: 5 }}>
                <Typography variant="h4" align="center" gutterBottom style={{color: '#0478C0'}}>
                    {selectedUserId ? 'Update Supplier' : 'Register Supplier'}
                </Typography>
                <Paper elevation={3} sx={{ padding: 4, marginTop: 2 }}>
                    <Grid container spacing={3}>

                        {/* Left Section: Customer Details */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" align={"center"} sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}>
                                Supplier Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} variant="outlined" required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} variant="outlined" required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} variant="outlined" required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Phone Number" name="phoneNo" value={formData.phoneNo} onChange={handleChange} variant="outlined" required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} variant="outlined" required />
                                </Grid>
                            </Grid>
                        </Grid>


                        {/* Avatar - Centered */}
                        <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Avatar sx={{ width: 250, height: 250, bgcolor: 'lightgray', borderRadius: 5}} />
                        </Grid>

                        {/* Register Button */}
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
}

export default SupplierManagement;