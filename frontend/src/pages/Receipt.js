import React, { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';

const Receipt = ({ isPrinting, onPrintComplete, cart, customerName, paymentMethod, totalAmount, staffName }) => {
    const receiptRef = useRef();
    const [isReady, setIsReady] = useState(false);

    const handlePrintReceipt = useReactToPrint({
        content: () => receiptRef.current,
        onBeforePrint: () => console.log('Before print:', receiptRef.current),
        onAfterPrint: () => {
            console.log('After print');
            onPrintComplete();
        },
        onPrintError: (error) => {
            console.error('Print error:', error);
            alert('Failed to print receipt. Check console for details.');
            onPrintComplete();
        },
    });

    useEffect(() => {
        if (receiptRef.current) {
            setIsReady(true);
        }
    }, []);

    useEffect(() => {
        if (isPrinting && isReady && receiptRef.current) {
            console.log('Receipt data available, triggering print');
            try {
                const printResult = handlePrintReceipt();
                if (printResult && typeof printResult.then === 'function') {
                    printResult.catch((err) => {
                        console.error('Error during print operation:', err);
                        alert('Failed to print receipt. Check console for details.');
                        onPrintComplete();
                    });
                } else {
                    // Fallback if printResult is not a Promise
                    onPrintComplete();
                }
            } catch (error) {
                console.error('Unexpected error during print:', error);
                alert('Failed to print receipt. Check console for details.');
                onPrintComplete();
            }
        }
    }, [isPrinting, isReady, handlePrintReceipt, onPrintComplete]);

    if (!isPrinting || !cart || cart.length === 0) return null;

    const transactionDate = new Date().toLocaleString();
    const orderId = `TEMP-${Date.now()}`; // Placeholder; replace with actual order ID if available

    return (
        <div style={{ display: 'none' }}>
            <div
                ref={receiptRef}
                style={{
                    padding: '20px',
                    fontFamily: 'monospace',
                    width: '300px',
                    textAlign: 'center',
                    backgroundColor: '#fff',
                    border: '1px solid #000',
                    fontSize: '12px',
                    lineHeight: '1.5',
                }}
            >
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Grocery Store Receipt</h3>
                <p style={{ margin: '5px 0' }}>Date: {transactionDate}</p>
                <p style={{ margin: '5px 0' }}>Order ID: {orderId}</p>
                <p style={{ margin: '5px 0' }}>Customer: {customerName || 'POS Customer'}</p>
                <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '10px 0' }} />
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                    <thead>
                    <tr>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
                            Item
                        </th>
                        <th style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
                            Qty
                        </th>
                        <th style={{ textAlign: 'right', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
                            Subtotal
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {cart.map((item) => (
                        <tr key={item.productId}>
                            <td style={{ textAlign: 'left', padding: '5px 0' }}>{item.productName}</td>
                            <td style={{ textAlign: 'center', padding: '5px 0' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '5px 0' }}>
                                Rs.{(item.quantity * item.sellingPrice).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '10px 0' }} />
                <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Total: Rs.{totalAmount.toFixed(2)}</p>
                <p style={{ margin: '5px 0' }}>Payment Method: {paymentMethod}</p>
                <p style={{ margin: '5px 0' }}>Staff: {staffName}</p>
                <p style={{ margin: '10px 0 0 0', fontStyle: 'italic' }}>Thank you for shopping with us!</p>
            </div>
        </div>
    );
};

export default Receipt;