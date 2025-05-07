import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";

const MobileScanner = () => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
        }, false);

        scannerRef.current = scanner;

        scanner.render((data) => {
            // Handle successful scan
            axios.post("http://192.168.1.163:8080/api/barcodes", { barcode: data })
                .then(() => {
                    console.log("Barcode sent:", data);
                    alert("Barcode scanned and sent: " + data);
                })
                .catch((error) => console.error("Error sending barcode:", error));

            // Stop scanning after one success
            scanner.clear().catch((err) => console.error("Failed to clear scanner:", err));
        }, (error) => {
            console.error("Scan error:", error);
        });

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((err) => console.error("Failed to clear scanner on unmount:", err));
            }
        };
    }, []);

    return (
        <div>
            <h2>Scan Barcode</h2>
            <div id="reader" style={{ width: "100%" }}></div>
        </div>
    );
};

export default MobileScanner;