"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Package, DollarSign, TrendingDown, AlertTriangle, Scan, Edit, Trash2, Check, X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { useBranchData, useBranchCreate } from "@/hooks/use-branch-data";
import { useBranch } from "@/context/branch-context";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";
import { ModernInput } from "@/components/ui/modern-components";
import { useToast } from "@/components/ui/use-toast";

const BarcodeScanner = dynamic(() => import("@/components/inventory/barcode-scanner").then(mod => mod.BarcodeScanner), {
    ssr: false,
});

export function ProductList() {
    const { data: products, loading, refetch } = useBranchData<any[]>('/api/products');
    const createProduct = useBranchCreate('/api/products');
    const { selectedBranch } = useBranch();
    const { toast } = useToast();

    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string[]>([]);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", sku: "", category: "" });
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const handleCreate = async () => {
        try {
            await createProduct(newProduct);
            setOpen(false);
            toast({ title: "Producto creado exitosamente" });
            refetch();
            setNewProduct({ name: "", price: "", sku: "", category: "" });
        } catch (error) {
            toast({ title: "Error al crear producto", variant: "destructive" });
        }
    };

    const handleScan = (code: string) => {
        const existingProduct = products?.find(p => p.sku === code || p.barcode === code);
        if (existingProduct) {
            setSearchValue(code);
        } else {
            setNewProduct({ ...newProduct, sku: code });
            setOpen(true);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectionMode = () => {
        const nextMode = !isSelectionMode;
        setIsSelectionMode(nextMode);
        if (!nextMode) setSelectedIds([]);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`¿Eliminar ${selectedIds.length} productos permanentemente?`)) return;

        setIsDeletingBulk(true);
        try {
            const res = await fetch("/api/products", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds }),
            });

            if (res.ok) {
                toast({ title: "Productos eliminados exitosamente" });
                setSelectedIds([]);
                setIsSelectionMode(false);
                refetch();
            }
        } catch (error) {
            toast({ title: "Error al eliminar productos", variant: "destructive" });
        } finally {
            setIsDeletingBulk(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este producto?")) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Producto eliminado" });
                refetch();
            }
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    const filteredProducts = (products || []).filter(product => {
        const matchesSearch = searchValue === "" ||
            product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            product.sku?.includes(searchValue) ||
            product.category?.toLowerCase().includes(searchValue.toLowerCase());

        const matchesFilter = filterCategory.length === 0 ||
            filterCategory.some(f => {
                if (f === "LOW_STOCK") return (product.inventory?.[0]?.quantity || 0) < 10;
                if (f === "OUT_OF_STOCK") return (product.inventory?.[0]?.quantity || 0) === 0;
                if (f === "IN_STOCK") return (product.inventory?.[0]?.quantity || 0) >= 10;
                return false;
            });

        return matchesSearch && matchesFilter;
    });

    // Calculate stats
    const totalProducts = products?.length || 0;
    const totalValue = products?.reduce((sum, p) => sum + (p.price * (p.inventory?.[0]?.quantity || 0)), 0) || 0;
    const lowStock = products?.filter(p => (p.inventory?.[0]?.quantity || 0) < 10 && (p.inventory?.[0]?.quantity || 0) > 0).length || 0;
    const outOfStock = products?.filter(p => (p.inventory?.[0]?.quantity || 0) === 0).length || 0;

    // Product colors like course-list
    const productColors: Record<number, { bg: string; accent: string }> = {
        0: { bg: '#FFEDD5', accent: '#EA580C' },
        1: { bg: '#D1FAE5', accent: '#059669' },
        2: { bg: '#DBEAFE', accent: '#2563EB' },
        3: { bg: '#FCE7F3', accent: '#DB2777' },
        4: { bg: '#EDE9FE', accent: '#7C3AED' },
        5: { bg: '#CCFBF1', accent: '#0D9488' },
    };

    return (
        <div className="bg-slate-100 pb-16">
            {/* HEADER - MISMO PATRÓN QUE CURSOS */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '64px',
                position: 'relative',
                zIndex: 10
            }}>
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                        Inventario
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Gestiona tus productos"}
                    </p>
                </div>
            </div>

            {/* KPIS - MISMO PATRÓN QUE CURSOS */}
            <motion.div
                style={{ padding: '0 var(--spacing-lg)', marginBottom: '48px' }}
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                    }
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ModernKpiCard
                        title="Total Productos"
                        value={totalProducts.toString()}
                        icon={Package}
                        gradientClass="gradient-courses"
                        subtitle="Productos en inventario"
                    />
                    <ModernKpiCard
                        title="Valor Inventario"
                        value={`$${totalValue.toLocaleString()}`}
                        icon={DollarSign}
                        gradientClass="gradient-students"
                        subtitle="Valor total estimado"
                    />
                    <ModernKpiCard
                        title="Stock Bajo"
                        value={lowStock.toString()}
                        icon={TrendingDown}
                        gradientClass="gradient-employees"
                        subtitle="Menos de 10 unidades"
                    />
                    <ModernKpiCard
                        title="Sin Stock"
                        value={outOfStock.toString()}
                        icon={AlertTriangle}
                        gradientClass="gradient-finance"
                        subtitle="Requieren reposición"
                    />
                </div>
            </motion.div>

            {/* FILTROS Y BOTONES DE ACCIÓN */}
            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '24px', marginTop: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    {/* BARRA DE BÚSQUEDA */}
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <ModernFilterBar
                            searchValue={searchValue}
                            onSearchChange={setSearchValue}
                            placeholder="Buscar productos..."
                            filters={[
                                { label: "En Stock", value: "IN_STOCK", color: "green" },
                                { label: "Stock Bajo", value: "LOW_STOCK", color: "orange" },
                                { label: "Sin Stock", value: "OUT_OF_STOCK", color: "red" }
                            ]}
                            activeFilters={filterCategory}
                            onFilterToggle={(value) => {
                                setFilterCategory(prev =>
                                    prev.includes(value)
                                        ? prev.filter(v => v !== value)
                                        : [...prev, value]
                                );
                            }}
                        />
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: 'white',
                                color: '#475569',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                            }}
                        >
                            <Scan size={18} />
                            Escanear
                        </button>

                        <button
                            onClick={toggleSelectionMode}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                borderRadius: '12px',
                                border: isSelectionMode ? 'none' : '1px solid #e2e8f0',
                                backgroundColor: isSelectionMode ? '#1e293b' : 'white',
                                color: isSelectionMode ? 'white' : '#475569',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                            }}
                        >
                            {isSelectionMode ? <X size={18} /> : <Trash2 size={18} />}
                            {isSelectionMode ? 'Cancelar' : 'Gestionar'}
                        </button>

                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <button style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    backgroundColor: '#EA580C',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
                                }}>
                                    <Plus size={18} />
                                    Nuevo Producto
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                                        Agregar Nuevo Producto
                                    </DialogTitle>
                                    <DialogDescription className="sr-only">
                                        Formulario para agregar un nuevo producto
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                    <ModernInput
                                        label="Nombre del Producto"
                                        value={newProduct.name}
                                        onChange={(val) => setNewProduct({ ...newProduct, name: val })}
                                        placeholder="Ej: Laptop Dell XPS 15"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <ModernInput
                                            label="Precio"
                                            type="number"
                                            value={newProduct.price}
                                            onChange={(val) => setNewProduct({ ...newProduct, price: val })}
                                            placeholder="0.00"
                                        />
                                        <ModernInput
                                            label="SKU / Código"
                                            value={newProduct.sku}
                                            onChange={(val) => setNewProduct({ ...newProduct, sku: val })}
                                            placeholder="SKU-001"
                                        />
                                    </div>
                                    <ModernInput
                                        label="Categoría"
                                        value={newProduct.category}
                                        onChange={(val) => setNewProduct({ ...newProduct, category: val })}
                                        placeholder="Ej: Electrónicos"
                                    />
                                </div>
                                <DialogFooter>
                                    <button
                                        onClick={handleCreate}
                                        disabled={!newProduct.name || !newProduct.price}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            backgroundColor: '#EA580C',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            opacity: (!newProduct.name || !newProduct.price) ? 0.5 : 1
                                        }}
                                    >
                                        Guardar Producto
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* BARRA DE ACCIONES DE GESTIÓN */}
            {isSelectionMode && (
                <div style={{
                    padding: '0 var(--spacing-lg)',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 24px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '16px',
                        border: '2px dashed #cbd5e1'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                backgroundColor: '#EA580C',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}>
                                {selectedIds.length}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                                {selectedIds.length === 0 ? 'Haz clic en los productos para seleccionarlos' : 'productos seleccionados'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedIds(filteredProducts.map(p => p.id))}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: 'white',
                                    color: '#475569',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Seleccionar todos
                            </button>
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isDeletingBulk}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Trash2 size={16} />
                                    Eliminar seleccionados
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCT CARDS GRID */}
            <section style={{ padding: '0 var(--spacing-lg)', minHeight: '400px' }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando productos...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-slate-500 text-lg">No hay productos disponibles</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '32px' }}>
                        {filteredProducts.map((product, index) => {
                            const isSelected = selectedIds.includes(product.id);
                            const colors = productColors[index % 6];
                            const stock = product.inventory?.[0]?.quantity || 0;
                            const stockStatus = stock === 0 ? { label: 'Sin Stock', color: '#DC2626' } :
                                stock < 10 ? { label: 'Stock Bajo', color: '#D97706' } :
                                    { label: 'En Stock', color: '#059669' };

                            return (
                                <div
                                    key={product.id}
                                    className={`product-card ${isSelectionMode ? 'cursor-pointer' : ''}`}
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderRadius: '20px',
                                        padding: '28px',
                                        minHeight: '280px',
                                        boxShadow: isSelected ? '0 0 0 3px #EA580C' : '0 10px 40px rgba(0,0,0,0.12)',
                                        display: 'flex',
                                        flexDirection: 'column' as const,
                                        position: 'relative' as const
                                    }}
                                    onClick={() => isSelectionMode && toggleSelection(product.id)}
                                >
                                    {isSelectionMode && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '16px',
                                                right: '16px',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '6px',
                                                backgroundColor: isSelected ? colors.accent : 'white',
                                                border: isSelected ? 'none' : '2px solid #E2E8F0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onClick={(e) => { e.stopPropagation(); toggleSelection(product.id); }}
                                        >
                                            {isSelected && <Check size={14} color="white" />}
                                        </div>
                                    )}

                                    {/* ICONO */}
                                    <div
                                        style={{
                                            width: '72px',
                                            height: '72px',
                                            borderRadius: '16px',
                                            backgroundColor: colors.accent,
                                            color: 'white',
                                            fontSize: '28px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '20px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        <Package size={32} />
                                    </div>

                                    {/* NOMBRE */}
                                    <h3 style={{
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: '#1E293B',
                                        marginBottom: '8px',
                                        lineHeight: 1.3
                                    }}>
                                        {product.name}
                                    </h3>

                                    {/* STOCK STATUS (como rol) */}
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '6px 14px',
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: stockStatus.color,
                                        marginBottom: '16px',
                                        width: 'fit-content'
                                    }}>
                                        {stockStatus.label}
                                    </span>

                                    {/* INFO */}
                                    <div style={{ flex: 1, fontSize: '14px', color: '#475569' }}>
                                        {product.sku && (
                                            <div style={{ fontFamily: 'monospace', marginBottom: '4px' }}>
                                                SKU: {product.sku}
                                            </div>
                                        )}
                                        {product.category && (
                                            <div>{product.category}</div>
                                        )}
                                    </div>

                                    {/* FOOTER */}
                                    {!isSelectionMode && (
                                        <div style={{
                                            marginTop: '16px',
                                            paddingTop: '16px',
                                            borderTop: '2px solid rgba(255,255,255,0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A' }}>
                                                    ${product.price.toFixed(2)}
                                                </div>
                                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {stock} unidades
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    backgroundColor: 'white',
                                                    border: 'none',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Edit size={18} color={colors.accent} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '10px',
                                                        backgroundColor: 'white',
                                                        border: 'none',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Trash2 size={18} color="#EF4444" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Floating Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-3xl px-6"
                    >
                        <div className="bg-slate-900 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between gap-6 border border-white/10 backdrop-blur-2xl bg-slate-900/90 ring-1 ring-white/10">
                            <div className="flex items-center gap-5 pl-2">
                                <div className="w-16 h-16 rounded-[1.2rem] bg-orange-600 flex items-center justify-center font-black text-3xl shadow-lg shadow-orange-500/30 text-white">
                                    {selectedIds.length}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white text-lg leading-tight">PRODUCTOS SELECCIONADOS</span>
                                    <span className="text-xs text-orange-300 font-medium">Gestionar selección múltiple</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pr-2">
                                <button
                                    onClick={() => setSelectedIds(filteredProducts.map(p => p.id))}
                                    className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                >
                                    Todos
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isDeletingBulk}
                                    className="h-14 px-8 bg-red-600 hover:bg-red-500 text-white rounded-[1.2rem] font-bold flex items-center gap-3 shadow-lg shadow-red-600/20 active:scale-95 transition-all ml-2"
                                >
                                    {isDeletingBulk ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={20} />}
                                    ELIMINAR
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Barcode Scanner */}
            <BarcodeScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScan}
            />
        </div>
    );
}
