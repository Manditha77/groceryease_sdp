import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext({
    cartItems: [],
    wishlistItems: [],
    addToCart: () => {},
    removeFromCart: () => {},
    updateUnits: () => {},
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

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                const migratedCart = parsedCart.map(item => ({
                    ...item,
                    units: item.units ?? item.quantity ?? 1,
                    maxUnits: item.maxUnits ?? item.maxQuantity ?? item.quantity ?? 1,
                }));
                setCartItems(migratedCart);
                console.log('Loaded cart from localStorage:', migratedCart);
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

    useEffect(() => {
        console.log('Cart items updated:', cartItems);
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const addToCart = (product, units) => {
        console.log(`CartContext: addToCart called - Product ID: ${product.productId}, Units: ${units}, Unit Type: ${product.unitType}`);

        if (units === undefined || units <= 0) {
            console.log('CartContext: Invalid units provided, aborting addToCart');
            return;
        }

        if (units > product.units) {
            console.log(`CartContext: Cannot add product. Requested units (${units}) exceed stock (${product.units})`);
            return;
        }

        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(
                item => item.productId === product.productId
            );

            if (existingItemIndex !== -1) {
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    units: units,
                };
                console.log(`CartContext: Updated existing product: ${product.productName}, New units: ${units}`);
                return updatedItems;
            } else {
                const newItem = { ...product, units, maxUnits: product.units };
                const newCart = [...prevItems, newItem];
                console.log(`CartContext: Added new product to cart: ${product.productName}, Units: ${units}`);
                return newCart;
            }
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems =>
            prevItems.filter(item => item.productId !== productId)
        );
    };

    const updateUnits = (productId, newUnits) => {
        if (newUnits <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems(prevItems => {
            return prevItems.map(item => {
                if (item.productId === productId) {
                    let safeUnits = newUnits;
                    if (item.unitType === 'WEIGHT') {
                        safeUnits = Math.max(0.01, newUnits);
                    } else {
                        safeUnits = Math.max(1, Math.round(newUnits));
                    }

                    const maxUnits = item.maxUnits || item.units;
                    safeUnits = Math.min(safeUnits, maxUnits);

                    return { ...item, units: safeUnits };
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
            setWishlistItems(prevItems =>
                prevItems.filter(item => item.productId !== product.productId)
            );
        } else {
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
                updateUnits,
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