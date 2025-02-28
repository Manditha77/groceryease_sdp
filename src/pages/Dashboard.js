import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Snackbar, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const Dashboard = () => {
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.success || '');
    const [open, setOpen] = useState(!!location.state?.success);

    useEffect(() => {
        if (location.state?.success) {
            setTimeout(() => setOpen(false), 3000); // Hide Snackbar after 3 seconds
        }
    }, [location.state]);

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Box sx={{ padding: 4 }}>
            {/* Success Snackbar */}
            <Snackbar open={open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={handleClose} severity="success" sx={{ width: '100%', height: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            <Typography variant="h4" gutterBottom paddingTop="30px">
                Dashboard
            </Typography>
        </Box>
    );
};

export default Dashboard;
