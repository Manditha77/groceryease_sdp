import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext({
    cartItems: [],
    wishlistItems: [],
    addToCart: () => {},
    removeFromCart: () => {},
    updateQuantity: () => {},
    setCartItems: () => {},
    clearCart: () => {},
    toggleWishlistItem: () => {},
    isInWishlist: () => false,
    estimatedPickupDate: null,
    setEstimatedPickupDate: () => {},
});

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [estimatedPickupDate, setEstimatedPickupDate] = useState(null);

    // Load cart from localStorage on initial render
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error parsing saved cart:', error);
                localStorage.removeItem('cart');
            }
        }

        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
            try {
                setWishlistItems(JSON.parse(savedWishlist));
            } catch (error) {
                console.error('Error parsing saved wishlist:', error);
                localStorage.removeItem('wishlist');
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Save wishlist to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const addToCart = (product) => {
        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(
                item => item.productId === product.productId
            );

            if (existingItemIndex !== -1) {
                // Item exists, update quantity
                const updatedItems = [...prevItems];

                // Make sure we don't exceed available stock
                const currentQuantity = updatedItems[existingItemIndex].quantity;
                const newQuantity = currentQuantity + 1;

                if (newQuantity <= product.quantity) {
                    updatedItems[existingItemIndex] = {
                        ...updatedItems[existingItemIndex],
                        quantity: newQuantity,
                    };
                }

                return updatedItems;
            } else {
                // Item doesn't exist, add new item with quantity 1
                return [...prevItems, { ...product, quantity: 1, maxQuantity: product.quantity }];
            }
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems =>
            prevItems.filter(item => item.productId !== productId)
        );
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems(prevItems => {
            return prevItems.map(item => {
                if (item.productId === productId) {
                    // Ensure quantity doesn't exceed available stock
                    const maxQuantity = item.maxQuantity || item.quantity;
                    const safeQuantity = Math.min(quantity, maxQuantity);

                    return { ...item, quantity: safeQuantity };
                }
                return item;
            });
        });
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('cart');
    };

    const toggleWishlistItem = (product) => {
        const isInList = wishlistItems.some(item => item.productId === product.productId);

        if (isInList) {
            // Remove from wishlist
            setWishlistItems(prevItems =>
                prevItems.filter(item => item.productId !== product.productId)
            );
        } else {
            // Add to wishlist
            setWishlistItems(prevItems => [...prevItems, product]);
        }
    };

    const isInWishlist = (productId) => {
        return wishlistItems.some(item => item.productId === productId);
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                wishlistItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                setCartItems,
                clearCart,
                toggleWishlistItem,
                isInWishlist,
                estimatedPickupDate,
                setEstimatedPickupDate,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};