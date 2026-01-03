"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useCart } from "@/context/cart-context";
import { useSync } from "@/hooks/use-sync";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Trash2, Plus, Minus, Package, DollarSign, CreditCard, Banknote, X, Filter, Camera, ScanLine } from "lucide-react";
import dynamic from "next/dynamic";

const BarcodeScanner = dynamic(() => import("@/components/inventory/barcode-scanner").then(mod => mod.BarcodeScanner), { ssr: false });

export function POSInterface() {
    const { items, addItem, removeItem, updateQuantity, total, clearCart } = useCart();
    const { isOnline, saveSaleOffline } = useSync();
    const [products, setProducts] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scanFeedback, setScanFeedback] = useState<string | null>(null);
    const [stockWarning, setStockWarning] = useState<string | null>(null);

    // USB Scanner listener - detects rapid keystrokes
    const barcodeBuffer = useRef("");
    const lastKeyTime = useRef(0);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            // Ensure data is an array to prevent .map() errors
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setProducts([]);
        }
    };

    // Handle barcode scan (from USB or camera)
    const handleBarcodeScanned = useCallback((code: string) => {
        const product = products.find(p =>
            p.sku?.toLowerCase() === code.toLowerCase() ||
            p.barcode?.toLowerCase() === code.toLowerCase() ||
            p.sku?.includes(code) ||
            p.barcode?.includes(code)
        );

        if (product) {
            const stock = product.inventory?.[0]?.quantity || 0;
            const currentInCart = items.find(i => i.productId === product.id)?.quantity || 0;

            if (currentInCart >= stock) {
                setStockWarning(`⚠️ Sin stock disponible para ${product.name}`);
                setTimeout(() => setStockWarning(null), 3000);
                return;
            }

            addItem(product);
            setScanFeedback(`✓ ${product.name} agregado (Stock: ${stock - currentInCart - 1})`);
            // Play success sound (beep)
            try {
                const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQAAfnqtjYx5Ynfb3KJ0RxwYXajq1IIaABBUjLa7iGx1fHJxk5SHeXh1iq7EvoNzVVpqgpOQfXaBjZqWj39sf4qMiYSDgIWHi4uEgYKEhoyMhoaGhoiKioqIhoaHiYqKiYmHh4iJiYmJiIiIiYmJiYmIiIiJiYmJiYiIiImJiYmJiIiIiYmJiYmIiIiJiYmJiYmIiA==");
                audio.volume = 0.3;
                audio.play().catch(() => { });
            } catch { }
        } else {
            setScanFeedback(`✗ Producto no encontrado: ${code}`);
        }

        setTimeout(() => setScanFeedback(null), 2000);
    }, [products, addItem, items]);

    // USB Scanner keyboard listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const now = Date.now();

            // If typing is slow (>50ms between keys), it's manual typing, not scanner
            if (now - lastKeyTime.current > 100) {
                barcodeBuffer.current = "";
            }
            lastKeyTime.current = now;

            // Scanner typically sends Enter at end
            if (e.key === "Enter" && barcodeBuffer.current.length > 3) {
                e.preventDefault();
                handleBarcodeScanned(barcodeBuffer.current);
                barcodeBuffer.current = "";
                return;
            }

            // Only capture printable characters
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Don't capture if user is typing in an input
                const activeElement = document.activeElement;
                const isTypingInInput = activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA";

                if (!isTypingInInput) {
                    barcodeBuffer.current += e.key;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleBarcodeScanned]);

    const handleCheckout = async () => {
        if (items.length === 0) return;
        setLoading(true);

        const saleData = {
            items: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
            })),
            total,
            paymentMethod: "CASH"
        };

        try {
            if (!isOnline) {
                await saveSaleOffline(saleData);
                alert("Venta guardada localmente (Modo Offline)");
                clearCart();
                setLoading(false);
                return;
            }

            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(saleData)
            });

            if (res.ok) {
                alert("Venta realizada con éxito");
                clearCart();
            } else {
                alert("Error al procesar la venta");
            }
        } catch (error) {
            console.error(error);
            await saveSaleOffline(saleData);
            alert("Error de conexión. Venta guardada localmente.");
            clearCart();
        } finally {
            setLoading(false);
        }
    };

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !activeCategory || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const colors = [
        { bg: '#DBEAFE', accent: '#2563EB', iconBg: '#3B82F6' },
        { bg: '#EDE9FE', accent: '#7C3AED', iconBg: '#8B5CF6' },
        { bg: '#D1FAE5', accent: '#059669', iconBg: '#10B981' },
        { bg: '#FCE7F3', accent: '#DB2777', iconBg: '#EC4899' },
        { bg: '#FFEDD5', accent: '#EA580C', iconBg: '#F97316' },
        { bg: '#CCFBF1', accent: '#0D9488', iconBg: '#14B8A6' },
    ];

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Product Grid */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Search & Filters */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 flex-1">
                        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <Input
                            placeholder="Buscar productos (Nombre, SKU)..."
                            className="bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-blue-500 h-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setScannerOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 font-semibold transition-all shrink-0"
                        style={{
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                        }}
                        title="Escanear con cámara"
                    >
                        <Camera className="h-4 w-4" />
                        <span className="hidden sm:inline">Escanear</span>
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 font-semibold transition-all shrink-0 ${showFilters || activeCategory
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                            : 'bg-white text-slate-600 border-2 border-slate-200 hover:bg-slate-50'
                            }`}
                        style={{ borderRadius: '8px' }}
                    >
                        <Filter className="h-4 w-4" />
                        Categorías
                    </button>
                </div>

                {/* Scan Feedback Toast */}
                {scanFeedback && (
                    <div
                        className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-semibold text-white flex items-center gap-2 animate-pulse`}
                        style={{
                            backgroundColor: scanFeedback.startsWith("✓") ? "#059669" : "#DC2626",
                            animation: "fadeInOut 2s ease-in-out"
                        }}
                    >
                        <ScanLine size={20} />
                        {scanFeedback}
                    </div>
                )}

                {/* Stock Warning Toast */}
                {stockWarning && (
                    <div
                        className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-semibold flex items-center gap-2"
                        style={{
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            border: '2px solid #F59E0B'
                        }}
                    >
                        {stockWarning}
                    </div>
                )}

                {/* Camera Scanner Modal */}
                <BarcodeScanner
                    isOpen={scannerOpen}
                    onClose={() => setScannerOpen(false)}
                    onScan={handleBarcodeScanned}
                />

                {/* Category Filters */}
                {showFilters && categories.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-sm font-semibold text-slate-500">Filtrar:</span>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                                className="flex items-center gap-1 font-semibold text-sm"
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    backgroundColor: activeCategory === cat ? '#DBEAFE' : '#FFFFFF',
                                    color: activeCategory === cat ? '#1D4ED8' : '#64748B',
                                    border: activeCategory === cat ? '2px solid #93C5FD' : '1px solid #E2E8F0',
                                    cursor: 'pointer'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                        {activeCategory && (
                            <button
                                onClick={() => setActiveCategory(null)}
                                className="flex items-center gap-1 font-semibold text-sm"
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    backgroundColor: '#FEE2E2',
                                    color: '#DC2626',
                                    border: '1px solid #FCA5A5',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={14} /> Limpiar
                            </button>
                        )}
                    </div>
                )}

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto pr-2 pb-2">
                    {filteredProducts.map((product, index) => {
                        const colorSet = colors[index % 6];
                        const stock = product.inventory?.[0]?.quantity || 0;
                        const inCart = items.find(i => i.productId === product.id)?.quantity || 0;
                        const available = stock - inCart;
                        const isOutOfStock = available <= 0;

                        return (
                            <div
                                key={product.id}
                                className={`cursor-pointer rounded-2xl transition-all ${isOutOfStock ? 'opacity-50' : 'hover:scale-[1.02]'}`}
                                style={{
                                    backgroundColor: colorSet.bg,
                                    padding: '20px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                    position: 'relative'
                                }}
                                onClick={() => {
                                    if (isOutOfStock) {
                                        setStockWarning(`⚠️ ${product.name} - Sin stock disponible`);
                                        setTimeout(() => setStockWarning(null), 2500);
                                        return;
                                    }
                                    addItem(product);
                                }}
                            >
                                {/* Stock Badge */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        backgroundColor: isOutOfStock ? '#FEE2E2' : available <= 5 ? '#FEF3C7' : '#D1FAE5',
                                        color: isOutOfStock ? '#DC2626' : available <= 5 ? '#D97706' : '#059669'
                                    }}
                                >
                                    {isOutOfStock ? 'Agotado' : `${available} disp.`}
                                </div>

                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        backgroundColor: colorSet.iconBg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-8 h-8 object-contain" />
                                    ) : (
                                        <Package className="h-6 w-6 text-white" />
                                    )}
                                </div>
                                <h3 className="font-bold text-slate-800 truncate mb-1" title={product.name}>
                                    {product.name}
                                </h3>
                                <p className="text-sm text-slate-500 mb-3">{product.sku || 'Sin SKU'}</p>
                                <p className="text-2xl font-bold" style={{ color: colorSet.accent }}>
                                    ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        );
                    })}

                    {filteredProducts.length === 0 && (
                        <div className="col-span-full bg-white rounded-2xl shadow-sm p-12 text-center">
                            <div className="text-6xl mb-4">📦</div>
                            <p className="text-slate-500 text-lg">No hay productos disponibles</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Sidebar */}
            <div
                className="w-96 flex flex-col h-full"
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '20px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    border: '1px solid #E2E8F0'
                }}
            >
                {/* Cart Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0' }}>
                    <div className="flex items-center gap-3">
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <ShoppingCart className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Carrito de Venta</h3>
                            <p className="text-sm text-slate-500">{items.length} productos</p>
                        </div>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto" style={{ padding: '16px' }}>
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
                            <p className="text-lg">El carrito está vacío</p>
                            <p className="text-sm">Haz clic en un producto para agregarlo</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item, idx) => {
                                const product = products.find(p => p.id === item.productId);
                                const stock = product?.inventory?.[0]?.quantity || 0;
                                const canIncrease = item.quantity < stock;

                                return (
                                    <div
                                        key={item.productId}
                                        className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                                        style={{ backgroundColor: idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF' }}
                                    >
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                                            <p className="text-sm text-slate-500">${item.price.toFixed(2)} c/u</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="w-8 text-center font-bold text-slate-700">{item.quantity}</span>
                                            <button
                                                onClick={() => {
                                                    if (!canIncrease) {
                                                        setStockWarning(`⚠️ Stock máximo alcanzado para ${item.name}`);
                                                        setTimeout(() => setStockWarning(null), 2500);
                                                        return;
                                                    }
                                                    updateQuantity(item.productId, item.quantity + 1);
                                                }}
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center ${canIncrease ? 'bg-slate-100 hover:bg-slate-200' : 'bg-red-50 cursor-not-allowed'}`}
                                            >
                                                <Plus className={`h-3 w-3 ${canIncrease ? '' : 'text-red-400'}`} />
                                            </button>
                                        </div>
                                        <div className="text-right min-w-[70px]">
                                            <p className="font-bold text-emerald-600">${(item.price * item.quantity).toFixed(2)}</p>
                                            <button
                                                onClick={() => removeItem(item.productId)}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Cart Footer */}
                <div
                    style={{
                        padding: '20px',
                        borderTop: '1px solid #E2E8F0',
                        background: 'linear-gradient(to top, #F8FAFC, #FFFFFF)'
                    }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg text-slate-600">Total</span>
                        <span className="text-3xl font-bold text-slate-800">
                            ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={clearCart}
                            disabled={items.length === 0}
                            className="flex items-center justify-center gap-2 py-3 font-semibold rounded-xl disabled:opacity-50"
                            style={{
                                backgroundColor: '#FEE2E2',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                                borderRadius: '12px'
                            }}
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </button>
                        <button
                            onClick={handleCheckout}
                            disabled={items.length === 0 || loading}
                            className="button-modern bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 flex items-center justify-center gap-2 disabled:opacity-50"
                            style={{ borderRadius: '12px' }}
                        >
                            <DollarSign className="h-4 w-4" />
                            {loading ? "Procesando..." : "Cobrar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
