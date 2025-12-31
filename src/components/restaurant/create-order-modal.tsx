"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Search, ChefHat, Users, Trash2, ShoppingCart, Send, UtensilsCrossed } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Product {
    id: string;
    name: string;
    price: number;
    category?: string | null;
    image?: string | null;
}

interface CartItem {
    productId: string;
    product: Product;
    quantity: number;
    guestName: string;
    notes: string;
}

interface CreateOrderModalProps {
    tableId: string;
    tableName: string;
    currentPax?: number | null;
    onClose: () => void;
    onOrderCreated: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
};

export function CreateOrderModal({ tableId, tableName, currentPax, onClose, onOrderCreated }: CreateOrderModalProps) {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Generar nombres de comensales según PAX
    const guestNames = useMemo(() => {
        const names = ['Yo'];
        if (currentPax && currentPax > 1) {
            for (let i = 2; i <= currentPax; i++) {
                names.push(`Comensal ${i}`);
            }
        }
        names.push('Compartido');
        return names;
    }, [currentPax]);

    const [selectedGuest, setSelectedGuest] = useState(guestNames[0]);

    // Cargar productos
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            if (Array.isArray(data)) {
                setProducts(data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast({ title: 'Error al cargar productos', variant: 'destructive' });
        }
        setLoading(false);
    };

    // Obtener categorías únicas
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category || 'Sin categoría'));
        return Array.from(cats);
    }, [products]);

    // Filtrar productos
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = searchValue === '' ||
                p.name.toLowerCase().includes(searchValue.toLowerCase());
            const matchesCategory = !selectedCategory ||
                (p.category || 'Sin categoría') === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchValue, selectedCategory]);

    // Agregar al carrito
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(
                item => item.productId === product.id && item.guestName === selectedGuest
            );
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id && item.guestName === selectedGuest
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                productId: product.id,
                product,
                quantity: 1,
                guestName: selectedGuest,
                notes: ''
            }];
        });
    };

    // Actualizar cantidad
    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart[index].quantity += delta;
            if (newCart[index].quantity <= 0) {
                newCart.splice(index, 1);
            }
            return newCart;
        });
    };

    // Actualizar notas
    const updateNotes = (index: number, notes: string) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart[index].notes = notes;
            return newCart;
        });
    };

    // Calcular total
    const total = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }, [cart]);

    // Enviar orden
    const handleSubmit = async () => {
        if (cart.length === 0) {
            toast({ title: 'Agrega al menos un producto', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/restaurant/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tableId,
                    type: 'DINE_IN',
                    items: cart.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        guestName: item.guestName,
                        notes: item.notes || null
                    }))
                })
            });

            if (!res.ok) {
                throw new Error('Error al crear orden');
            }

            toast({ title: '¡Orden enviada a cocina!' });
            onOrderCreated();
            onClose();
        } catch (error) {
            toast({ title: 'Error al crear orden', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: '90vh' }}
            >
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-orange-600 to-amber-500 flex justify-between items-center">
                    <div className="text-white">
                        <h3 className="font-bold text-xl flex items-center gap-2">
                            <UtensilsCrossed size={24} />
                            Nueva Orden - {tableName}
                        </h3>
                        {currentPax && (
                            <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                                <Users size={14} />
                                {currentPax} comensales
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Left: Product Selection */}
                    <div className="w-7/12 border-r flex flex-col">
                        {/* Search & Filters */}
                        <div className="p-4 border-b bg-slate-50">
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${!selectedCategory
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    Todos
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === cat
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Guest Selector */}
                        <div className="px-4 py-3 border-b bg-amber-50">
                            <p className="text-xs font-bold text-amber-800 mb-2">Agregando para:</p>
                            <div className="flex gap-2 flex-wrap">
                                {guestNames.map(guest => (
                                    <button
                                        key={guest}
                                        onClick={() => setSelectedGuest(guest)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedGuest === guest
                                                ? 'bg-amber-600 text-white shadow-md'
                                                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-100'
                                            }`}
                                    >
                                        {guest}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full" />
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                    <ChefHat size={48} className="mb-3 opacity-50" />
                                    <p className="font-medium">No hay productos</p>
                                    <p className="text-sm">Agrega productos en la sección de inventario</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {filteredProducts.map(product => (
                                        <motion.button
                                            key={product.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => addToCart(product)}
                                            className="bg-white p-4 rounded-xl border border-slate-100 hover:border-orange-300 hover:shadow-md transition-all text-left"
                                        >
                                            <p className="font-bold text-slate-800 mb-1 line-clamp-1">{product.name}</p>
                                            <p className="text-orange-600 font-bold">{formatCurrency(product.price)}</p>
                                            {product.category && (
                                                <span className="text-xs text-slate-400">{product.category}</span>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Cart */}
                    <div className="w-5/12 flex flex-col bg-slate-50">
                        <div className="p-4 border-b">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <ShoppingCart size={18} />
                                Orden
                                {cart.length > 0 && (
                                    <span className="ml-auto bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {cart.reduce((s, i) => s + i.quantity, 0)} items
                                    </span>
                                )}
                            </h4>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <ShoppingCart size={40} className="mb-2 opacity-50" />
                                    <p className="text-sm">Carrito vacío</p>
                                    <p className="text-xs">Selecciona productos del menú</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map((item, index) => (
                                        <div key={`${item.productId}-${item.guestName}-${index}`} className="bg-white p-3 rounded-xl border border-slate-100">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800 text-sm">{item.product.name}</p>
                                                    <p className="text-xs text-amber-600">{item.guestName}</p>
                                                </div>
                                                <p className="font-bold text-slate-700 text-sm">
                                                    {formatCurrency(item.product.price * item.quantity)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center bg-slate-100 rounded-lg">
                                                    <button
                                                        onClick={() => updateQuantity(index, -1)}
                                                        className="p-1.5 hover:bg-slate-200 rounded-l-lg transition-colors"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="px-3 font-bold text-sm">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(index, 1)}
                                                        className="p-1.5 hover:bg-slate-200 rounded-r-lg transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Nota: sin cebolla..."
                                                    value={item.notes}
                                                    onChange={(e) => updateNotes(index, e.target.value)}
                                                    className="flex-1 text-xs py-1.5 px-2 bg-slate-50 rounded-lg border-none focus:ring-1 focus:ring-orange-500 outline-none"
                                                />
                                                <button
                                                    onClick={() => updateQuantity(index, -item.quantity)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Cart Footer */}
                        <div className="p-4 border-t bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-slate-700">Total</span>
                                <span className="text-2xl font-bold text-slate-800">{formatCurrency(total)}</span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={cart.length === 0 || isSubmitting}
                                className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl font-bold text-lg hover:from-orange-700 hover:to-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Enviar a Cocina
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
