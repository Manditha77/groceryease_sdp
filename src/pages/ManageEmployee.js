import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const ManageEmployee = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNo: '',
        address: '',
        username: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNo: '',
        address: '',
        username: '',
        password: '',
        confirmPassword: '',
        general: ''
    });
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value.trimStart() }); // Prevent leading spaces
        setErrors({ ...errors, [name]: '', general: '' });
    };

    const fetchEmployees = async () => {
        try {
            const data = await authService.getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            setSnackbarMessage('Failed to fetch employees. Please try again.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const validateForm = () => {
        let newErrors = { ...errors, general: '' };
        let isValid = true;

        const trimmedFormData = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phoneNo: formData.phoneNo.trim(),
            address: formData.address.trim(),
            username: formData.username.trim(),
            password: formData.password.trim(),
            confirmPassword: formData.confirmPassword.trim(),
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

        if (!trimmedFormData.address) {
            newErrors.address = 'Address is required';
            isValid = false;
        } else if (trimmedFormData.address.length > 255) {
            newErrors.address = 'Address cannot exceed 255 characters';
            isValid = false;
        }

        if (!selectedUserId) {
            if (!trimmedFormData.username) {
                newErrors.username = 'Username is required';
                isValid = false;
            } else if (trimmedFormData.username.length < 3 || trimmedFormData.username.length > 50) {
                newErrors.username = 'Username must be between 3 and 50 characters';
                isValid = false;
            } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedFormData.username)) {
                newErrors.username = 'Username can only contain letters, numbers, and underscores';
                isValid = false;
            }

            if (!trimmedFormData.password) {
                newErrors.password = 'Password is required';
                isValid = false;
            } else if (trimmedFormData.password.length < 8) {
                newErrors.password = 'Password must be at least 8 characters long';
                isValid = false;
            } else if (!/[A-Z]/.test(trimmedFormData.password) || !/[0-9]/.test(trimmedFormData.password)) {
                newErrors.password = 'Password must contain at least one uppercase letter and one number';
                isValid = false;
            }

            if (!trimmedFormData.confirmPassword) {
                newErrors.confirmPassword = 'Confirm password is required';
                isValid = false;
            } else if (trimmedFormData.password !== trimmedFormData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
                isValid = false;
            }
        }

        if (!selectedUserId) {
            const emailExists = employees.some(emp => emp.email === trimmedFormData.email && emp.userId !== selectedUserId);
            if (emailExists) {
                newErrors.email = 'Email is already registered';
                isValid = false;
            }
            const usernameExists = employees.some(emp => emp.username === trimmedFormData.username && emp.userId !== selectedUserId);
            if (usernameExists) {
                newErrors.username = 'Username is already taken';
                isValid = false;
            }
        } else {
            const emailExists = employees.some(emp => emp.email === trimmedFormData.email && emp.userId !== selectedUserId);
            if (emailExists) {
                newErrors.email = 'Email is already registered';
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleOpenUpdateDialog = () => {
        if (validateForm()) {
            setUpdateDialogOpen(true);
        } else {
            setSnackbarMessage('Please fix the errors in the form before submitting.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleCloseUpdateDialog = () => {
        setUpdateDialogOpen(false);
    };

    const handleUpdateEmployee = async (userId) => {
        const employee = employees.find((employee) => employee.userId === userId);
        setFormData({
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phoneNo: employee.phoneNo,
            address: employee.address,
            username: employee.username,
            password: '',
            confirmPassword: '',
        });
        setSelectedUserId(userId);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const handleConfirmUpdateEmployee = async () => {
        try {
            const updatePayload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNo: formData.phoneNo,
                address: formData.address,
                role: 'EMPLOYEE',
            };

            const updatedEmployee = await authService.updateUserDetails(
                selectedUserId,
                updatePayload.firstName,
                updatePayload.lastName,
                updatePayload.email,
                updatePayload.phoneNo,
                updatePayload.address,
                updatePayload.role
            );

            const updatedEmployees = employees.map((employee) =>
                employee.userId === selectedUserId ? { ...employee, ...updatedEmployee } : employee
            );
            setEmployees(updatedEmployees);
            setSnackbarMessage('Employee updated successfully');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error updating employee:', error);
            setSnackbarMessage(error.response?.data?.message || 'Failed to update employee. Please try again.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phoneNo: '',
                address: '',
                username: '',
                password: '',
                confirmPassword: '',
            });
            setSelectedUserId(null);
            setErrors({
                firstName: '',
                lastName: '',
                email: '',
                phoneNo: '',
                address: '',
                username: '',
                password: '',
                confirmPassword: '',
                general: ''
            });
            handleCloseUpdateDialog();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            await fetchEmployees();
        }
    };

    const handleOpenRegisterDialog = () => {
        if (validateForm()) {
            setRegisterDialogOpen(true);
        } else {
            setSnackbarMessage('Please fix the errors in the form before submitting.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleCloseRegisterDialog = () => {
        setRegisterDialogOpen(false);
    };

    const handleConfirmRegisterEmployee = async () => {
        try {
            const newEmployee = await authService.register(
                formData.firstName,
                formData.lastName,
                formData.email,
                formData.phoneNo,
                formData.address,
                'EMPLOYEE',
                formData.username,
                formData.password
            );
            setEmployees([...employees, newEmployee]);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phoneNo: '',
                address: '',
                username: '',
                password: '',
                confirmPassword: '',
            });
            setErrors({
                firstName: '',
                lastName: '',
                email: '',
                phoneNo: '',
                address: '',
                username: '',
                password: '',
                confirmPassword: '',
                general: ''
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setSnackbarMessage('Employee registered successfully');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error adding employee:', error);
            setSnackbarMessage(error.response?.data?.message || 'Failed to register employee. Please try again.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            handleCloseRegisterDialog();
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
            await authService.deleteUser(selectedUserId);
            const updatedEmployees = employees.filter((employee) => employee.userId !== selectedUserId);
            setEmployees(updatedEmployees);
            setSnackbarMessage('Employee deleted successfully');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error deleting employee:', error);
            setSnackbarMessage('Failed to delete employee. Please try again.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            handleCloseDeleteDialog();
        }
    };

    return (
        <Box sx={{ padding: 4, paddingTop: 7 }}>
            <Box>
                <Typography variant="h4" gutterBottom sx={{ color: '#0478C0', fontWeight: 'bold' }}>
                    Manage Employees
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Address</TableCell>
                                <TableCell>Contact-Number:</TableCell>
                                <TableCell>Username</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.userId}>
                                    <TableCell>{employee.userId}</TableCell>
                                    <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                                    <TableCell>{employee.address}</TableCell>
                                    <TableCell>{employee.phoneNo}</TableCell>
                                    <TableCell>{employee.username}</TableCell>
                                    <TableCell>{employee.email}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            style={{ marginRight: 8 }}
                                            sx={{ bgcolor: '#007bff' }}
                                            onClick={() => handleUpdateEmployee(employee.userId)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="contained"
                                            sx={{ bgcolor: '#dc3545' }}
                                            onClick={() => handleOpenDeleteDialog(employee.userId)}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box sx={{ paddingTop: 5 }}>
                <Typography
                    variant="h4"
                    align="center"
                    gutterBottom
                    style={{ color: '#0478C0' }}
                >
                    {selectedUserId ? 'Update Employee' : 'Register Employee'}
                </Typography>
                <Paper elevation={3} sx={{ padding: 4, marginTop: 2 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography
                                variant="h6"
                                align="center"
                                sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}
                            >
                                Employee Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        variant="outlined"
                                        required
                                        error={!!errors.firstName}
                                        helperText={errors.firstName}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Last Name"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        variant="outlined"
                                        required
                                        error={!!errors.lastName}
                                        helperText={errors.lastName}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        variant="outlined"
                                        required
                                        error={!!errors.email}
                                        helperText={errors.email}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        name="phoneNo"
                                        value={formData.phoneNo}
                                        onChange={handleChange}
                                        variant="outlined"
                                        required
                                        error={!!errors.phoneNo}
                                        helperText={errors.phoneNo}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        variant="outlined"
                                        required
                                        error={!!errors.address}
                                        helperText={errors.address}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid
                            item
                            xs={6}
                            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        >
                            <Avatar sx={{ width: 250, height: 250, bgcolor: 'lightgray', borderRadius: 5 }} />
                        </Grid>

                        <Grid item xs={12} md={6} hidden={!!selectedUserId}>
                            <Typography
                                variant="h6"
                                align="center"
                                sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}
                            >
                                Login Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        variant="outlined"
                                        required
                                        disabled={!!selectedUserId}
                                        error={!!errors.username}
                                        helperText={errors.username}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        variant="outlined"
                                        required
                                        disabled={!!selectedUserId}
                                        error={!!errors.password}
                                        helperText={errors.password}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Confirm Password"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        variant="outlined"
                                        required
                                        disabled={!!selectedUserId}
                                        error={!!errors.confirmPassword}
                                        helperText={errors.confirmPassword}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                style={{
                                    background: '#007bff',
                                    textTransform: 'none',
                                    width: '200px',
                                    height: '50px',
                                    fontSize: '19px'
                                }}
                                onClick={selectedUserId ? handleOpenUpdateDialog : handleOpenRegisterDialog}
                                size="large"
                            >
                                {selectedUserId ? 'Confirm Update' : 'Register'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>

            <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this employee?
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
                        Are you sure you want to register this employee?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRegisterDialog}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmRegisterEmployee}>
                        Register
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={updateDialogOpen} onClose={handleCloseUpdateDialog}>
                <DialogTitle>Confirm Update</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to update this employee?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUpdateDialog}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmUpdateEmployee}>
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    sx={{ width: '100%', height: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ManageEmployee;