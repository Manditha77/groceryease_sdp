import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Paper, Grid, Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider, Avatar } from "@mui/material";
import {AccountCircle} from "@mui/icons-material";
import authService from '../services/authService';

const Profile = () => {
    const location = useLocation();
    const [username, setUsername] = useState('');
    const [user, setUser] = useState({});
    const storedUsername = localStorage.getItem('username');

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
                <Button variant="contained" sx={{ bgcolor: 'rgba(217,217,217,0.50)', color: '#0478C0', fontWeight: 'bold'}}>Edit</Button>
            </Box>
        </Box>
    );
}

export default Profile;