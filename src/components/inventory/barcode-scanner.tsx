"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BarcodeScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const scannerRef = useRef<any>(null);

    useEffect(() => {
        let mounted = true;

        const initScanner = async () => {
            if (!isOpen || scannerRef.current) return;

            try {
                // Small delay to ensure DOM is ready
                await new Promise(resolve => setTimeout(resolve, 200));

                if (!mounted) return;

                // Dynamic import to avoid SSR issues
                const { Html5QrcodeScanner } = await import("html5-qrcode");

                if (!mounted) return;

                const readerElement = document.getElementById("pos-reader");
                if (!readerElement) {
                    console.error("Reader element not found");
                    return;
                }

                const scanner = new Html5QrcodeScanner(
                    "pos-reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 150 },
                        aspectRatio: 1.5,
                        rememberLastUsedCamera: true,
                        showTorchButtonIfSupported: true
                    },
                    false
                );

                scanner.render(
                    (decodedText: string) => {
                        onScan(decodedText);
                        cleanupAndClose();
                    },
                    (errorMessage: string) => {
                        // Ignore parse errors - they happen constantly
                    }
                );

                scannerRef.current = scanner;
                setIsInitialized(true);
                setError(null);
            } catch (err) {
                console.error("Error initializing scanner:", err);
                setError("No se pudo iniciar la cámara. Verifica los permisos.");
            }
        };

        if (isOpen) {
            initScanner();
        }

        return () => {
            mounted = false;
        };
    }, [isOpen, onScan]);

    const cleanupAndClose = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().then(() => {
                scannerRef.current = null;
                setIsInitialized(false);
                onClose();
            }).catch((err: any) => {
                console.error("Failed to clear scanner", err);
                scannerRef.current = null;
                setIsInitialized(false);
                onClose();
            });
        } else {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && cleanupAndClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Escanear Código</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-4">
                    <div id="pos-reader" className="w-full max-w-sm overflow-hidden rounded-lg"></div>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                        Apunta la cámara al código de barras o QR del producto.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
