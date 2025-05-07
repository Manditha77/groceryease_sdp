import React, { useState } from "react";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { Dashboard, People, Inventory, Store, Assessment, CreditCard, AccountCircle, PointOfSale } from "@mui/icons-material";
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const location = useLocation();
    const [selectedIndex, setSelectedIndex] = useState(location.pathname);

    const handleListItemClick = (event, index) => {
        setSelectedIndex(index);
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: 250,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: 250,
                    boxSizing: "border-box",
                    backgroundColor: "#e7eff3",
                    borderRight: "2px solid #ddd",
                    marginTop: "64px",
                    height: `calc(100% - 64px)`,
                },
            }}
        >
            <List>
                <ListItem disablePadding>
                    <ListItemButton
                        component={Link}
                        to="/dashboard"
                        selected={selectedIndex === "/dashboard"}
                        onClick={(event) => handleListItemClick(event, "/dashboard")}
                    >
                        <ListItemIcon>
                            <Dashboard />
                        </ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton
                        component={Link}
                        to="/manage-employees"
                        selected={selectedIndex === "/manage-employees"}
                        onClick={(event) => handleListItemClick(event, "/manage-employees")}
                    >
                        <ListItemIcon>
                            <People />
                        </ListItemIcon>
                        <ListItemText primary="Manage Employees" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton
                        component={Link}
                        to="/inventory"
                        selected={selectedIndex === "/inventory"}
                        onClick={(event) => handleListItemClick(event, "/inventory")}
                    >
                        <ListItemIcon>
                            <Inventory />
                        </ListItemIcon>
                        <ListItemText primary="Inventory" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton
                        component={Link}
                        to="/manage-suppliers"
                        selected={selectedIndex === "/manage-suppliers"}
                        onClick={(event) => handleListItemClick(event, "/manage-suppliers")}
                    >
                        <ListItemIcon>
                            <Store />
                        </ListItemIcon>
                        <ListItemText primary="Supplier Management" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton
                        component={Link}
                        to="/reports"
                        selected={selectedIndex === "/reports"}
                        onClick={(event) => handleListItemClick(event, "/reports")}
                    >
                        <ListItemIcon>
                            <Assessment />
                        </ListItemIcon>
                        <ListItemText primary="Reports" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton
                        component={Link}
                        to="/credit-customers"
                        selected={selectedIndex === "/credit-customers"}
                        onClick={(event) => handleListItemClick(event, "/credit-customers")}
                    >
                        <ListItemIcon>
                            <CreditCard />
                        </ListItemIcon>
                        <ListItemText primary="Credit Customers" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton
                        component={Link}
                        to="/pos"
                        selected={selectedIndex === "/pos"}
                        onClick={(event) => handleListItemClick(event, "/pos")}
                    >
                        <ListItemIcon>
                            <PointOfSale />
                        </ListItemIcon>
                        <ListItemText primary="POS Terminal" />
                    </ListItemButton>
                </ListItem>
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton
                        component={Link}
                        to="/profile"
                        selected={selectedIndex === "/profile"}
                        onClick={(event) => handleListItemClick(event, "/profile")}
                    >
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