import React from "react";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider } from "@mui/material";
import { Dashboard, People, Inventory, Store, Assessment, CreditCard, AccountCircle } from "@mui/icons-material";
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <Drawer
            variant="permanent"
            sx={{
                width: 250,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: 250,
                    boxSizing: "border-box",
                    backgroundColor: "#F8F9FA", // Light gray background
                    borderRight: "2px solid #ddd", // Sidebar border
                    marginTop: "64px", // Pushes Sidebar below Navbar (assuming Navbar height is 64px)
                    height: `calc(100% - 64px)`, // Makes sure Sidebar fits below Navbar
                },
            }}
        >
            <List>
                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/dashboard">
                        <ListItemIcon>
                            <Dashboard />
                        </ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/manage-employees">
                        <ListItemIcon>
                            <People />
                        </ListItemIcon>
                        <ListItemText primary="Manage Employees" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/inventory">
                        <ListItemIcon>
                            <Inventory />
                        </ListItemIcon>
                        <ListItemText primary="Inventory" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/manage-suppliers">
                        <ListItemIcon>
                            <Store />
                        </ListItemIcon>
                        <ListItemText primary="Supplier Management" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/reports">
                        <ListItemIcon>
                            <Assessment />
                        </ListItemIcon>
                        <ListItemText primary="Reports" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/credit-customers">
                        <ListItemIcon>
                            <CreditCard />
                        </ListItemIcon>
                        <ListItemText primary="Credit Customers" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/profile">
                        <ListItemIcon>
                            <AccountCircle />
                        </ListItemIcon>
                        <ListItemText primary="Profile" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Drawer>
    );
};

export default Sidebar;