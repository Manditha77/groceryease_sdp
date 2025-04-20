import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find(item => item.productId === product.productId);
            const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

            // Check if the new quantity exceeds available stock
            if (newQuantity > product.quantity) {
                alert(`Cannot add ${product.productName} to cart. Only ${product.quantity} items in stock.`);
                return prevItems; // Do not update cart if stock is exceeded
            }

            if (existingItem) {
                return prevItems.map(item =>
                    item.productId === product.productId
                        ? { ...item, quantity: newQuantity }
                        : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        setCartItems((prevItems) => {
            const item = prevItems.find(item => item.productId === productId);
            if (!item) return prevItems;

            // Check if the new quantity exceeds available stock
            if (newQuantity > item.quantity) { // item.quantity here refers to the stock quantity from the product data
                alert(`Cannot update quantity. Only ${item.quantity} items of ${item.productName} in stock.`);
                return prevItems; // Do not update if stock is exceeded
            }

            if (newQuantity <= 0) {
                return prevItems.filter(item => item.productId !== productId);
            }

            return prevItems.map(item =>
                item.productId === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            );
        });
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, setCartItems }}>
            {children}
        </CartContext.Provider>
    );
};