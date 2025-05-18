import React, { useState, useEffect } from "react";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from "@mui/material";
import {
    Dashboard,
    People,
    Inventory,
    Store,
    Assessment,
    CreditCard,
    AccountCircle,
    PointOfSale,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
    const location = useLocation();
    const [selectedIndex, setSelectedIndex] = useState(location.pathname);
    const [userType, setUserType] = useState(localStorage.getItem("userType"));

    useEffect(() => {
        const handleStorageChange = () => {
            setUserType(localStorage.getItem("userType"));
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Define sidebar items based on user role
    const sidebarItems = [
        { path: "/dashboard", icon: <Dashboard />, text: "Dashboard", roles: ["OWNER", "EMPLOYEE"] },
        { path: "/manage-employees", icon: <People />, text: "Manage Employees", roles: ["OWNER"] },
        { path: "/inventory", icon: <Inventory />, text: "Inventory", roles: ["OWNER"] },
        { path: "/manage-suppliers", icon: <Store />, text: "Supplier Management", roles: ["OWNER"] },
        { path: "/reports", icon: <Assessment />, text: "Reports", roles: ["OWNER"] },
        { path: "/credit-customers", icon: <CreditCard />, text: "Credit Customers", roles: ["OWNER"] },
        { path: "/pos", icon: <PointOfSale />, text: "POS Terminal", roles: ["OWNER", "EMPLOYEE"] },
        { path: "/profile", icon: <AccountCircle />, text: "Profile", roles: ["OWNER", "EMPLOYEE"] },
    ];

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
                {sidebarItems.map((item) =>
                        item.roles.includes(userType) && (
                            <>
                                <ListItem key={item.path} disablePadding>
                                    <ListItemButton
                                        component={Link}
                                        to={item.path}
                                        selected={selectedIndex === item.path}
                                        onClick={(event) => handleListItemClick(event, item.path)}
                                    >
                                        <ListItemIcon>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.text} />
                                    </ListItemButton>
                                </ListItem>
                                {item.path !== "/profile" && <Divider />}
                            </>
                        )
                )}
            </List>
        </Drawer>
    );
};

export default Sidebar;