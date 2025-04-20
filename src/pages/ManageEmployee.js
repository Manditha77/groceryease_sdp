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
    Grid, TextField, Avatar, Snackbar, Alert
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
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
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
        const fetchEmployees = async () => {
            try {
                const data = await authService.getEmployees();
                setEmployees(data);
            } catch (error) {
                console.error('Error fetching employees:', error);
            }
        }

        fetchEmployees();
    }, [])

    const handleOpenUpdateDialog = () => {
        setUpdateDialogOpen(true);
    }

    const handleCloseUpdateDialog = () => {
        setUpdateDialogOpen(false);
    }

    const handleUpdateEmployee = async (userId) => {
        const employee = employees.find((employee) => employee.userId === userId);
        setFormData({
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phoneNo: employee.phoneNo,
            address: employee.address,
            username: employee.username,
            password: '', // Clear password fields for security
            confirmPassword: '',
        });
        setSelectedUserId(userId);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }

    const handleConfirmUpdateEmployee = async () => {
        // if (formData.password !== formData.confirmPassword) {
        //     alert("Passwords do not match!");
        //     return;
        // }

        try {
            const updatedEmployee = await authService.updateUser(
                selectedUserId,
                formData.firstName,
                formData.lastName,
                formData.email,
                formData.phoneNo,
                formData.address,
                'EMPLOYEE',
                formData.username,
                formData.password
            );
            const updatedEmployees = employees.map((employee) =>
                employee.userId === selectedUserId ? updatedEmployee : employee
            );
            setEmployees(updatedEmployees);
            setSnackbarMessage('Employee updated successfully');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error updating employee:', error);
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
            handleCloseUpdateDialog();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleOpenRegisterDialog = () => {
        setRegisterDialogOpen(true);
    }

    const handleCloseRegisterDialog = () => {
        setRegisterDialogOpen(false);
    }

    const handleConfirmRegisterEmployee = async () => {
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

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
            setEmployees([...employees, newEmployee]); // Add the new employee to the state
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setSnackbarMessage('Employee registered successfully');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error adding employee:', error);
        }  finally {
            handleCloseRegisterDialog();
        }
    }

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
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error deleting employee:', error);
        } finally {
            handleCloseDeleteDialog();
        }
    };

    return (
        <Box sx={{ padding: 4, paddingTop: 7}}>
            <Box>
                <Typography variant="h4" gutterBottom sx={{color: '#0478C0', fontWeight: 'bold'}}>
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
                                        <Button variant="contained" style={{ marginRight: 8}} sx={{ bgcolor: '#007bff' }} onClick={() => handleUpdateEmployee(employee.userId)}>Edit</Button>
                                        <Button variant="contained" sx={{ bgcolor: '#dc3545' }} onClick={() => handleOpenDeleteDialog(employee.userId)}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box sx={{ paddingTop: 5 }}>
                <Typography variant="h4" align="center" gutterBottom style={{color: '#0478C0'}}>
                    {selectedUserId ? 'Update Employee' : 'Register Employee'}
                </Typography>
                <Paper elevation={3} sx={{ padding: 4, marginTop: 2 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" align={"center"} sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}>
                                Employee Details
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
                                    <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} variant="outlined" required />
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Avatar sx={{ width: 250, height: 250, bgcolor: 'lightgray', borderRadius: 5}} />
                        </Grid>

                        <Grid item xs={12} md={6} hidden={!!selectedUserId}>
                            <Typography variant="h6" align={"center"} sx={{ marginBottom: 2, fontWeight: 'bold', color: '#2e7d32' }}>
                                Login Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Username" name="username" value={formData.username} onChange={handleChange} variant="outlined" required disabled={!!selectedUserId}/>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} variant="outlined" required disabled={!!selectedUserId}/>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} variant="outlined" required disabled={!!selectedUserId}/>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                style={{ background: '#007bff', textTransform: 'none', width: '200px', height: '50px', fontSize: '19px' }}
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

            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%', height: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ManageEmployee;