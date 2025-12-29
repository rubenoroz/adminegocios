"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BarcodeScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (isOpen && !scannerRef.current) {
            // Initialize scanner when dialog opens
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
        /* verbose= */ false
            );

            scanner.render(
                (decodedText) => {
                    onScan(decodedText);
                    handleClose();
                },
                (errorMessage) => {
                    // Ignore parse errors, they happen constantly when no code is in view
                    // console.warn(errorMessage);
                }
            );

            scannerRef.current = scanner;
        }

        return () => {
            // Cleanup is handled in handleClose or when component unmounts if open
            if (!isOpen && scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, [isOpen]);

    const handleClose = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().then(() => {
                scannerRef.current = null;
                onClose();
            }).catch((err) => {
                console.error("Failed to clear scanner", err);
                onClose();
            });
        } else {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Escanear Código</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-4">
                    <div id="reader" className="w-full max-w-sm overflow-hidden rounded-lg"></div>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                        Apunta la cámara al código de barras o QR del producto.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
