"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Package, DollarSign, TrendingDown, AlertTriangle, Scan, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { useBranchData, useBranchCreate } from "@/hooks/use-branch-data";
import { useBranch } from "@/context/branch-context";
import { ModernPageHeader } from "@/components/ui/modern-page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";
import { ModernInput } from "@/components/ui/modern-components";

const BarcodeScanner = dynamic(() => import("@/components/inventory/barcode-scanner").then(mod => mod.BarcodeScanner), {
    ssr: false,
});

export function ProductList() {
    const { data: products, loading, refetch } = useBranchData<any[]>('/api/products');
    const createProduct = useBranchCreate('/api/products');
    const { selectedBranch } = useBranch();

    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [newProduct, setNewProduct] = useState({ name: "", price: "", sku: "", category: "" });
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const handleCreate = async () => {
        try {
            await createProduct(newProduct);
            setOpen(false);
            refetch();
            setNewProduct({ name: "", price: "", sku: "", category: "" });
        } catch (error) {
            console.error(error);
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

    const filteredProducts = (products || []).filter(product =>
        searchValue === "" ||
        product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.sku?.includes(searchValue) ||
        product.category?.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Calculate stats
    const totalProducts = products?.length || 0;
    const totalValue = products?.reduce((sum, p) => sum + (p.price * (p.inventory?.[0]?.quantity || 0)), 0) || 0;
    const lowStock = products?.filter(p => (p.inventory?.[0]?.quantity || 0) < 10).length || 0;
    const outOfStock = products?.filter(p => (p.inventory?.[0]?.quantity || 0) === 0).length || 0;

    // Product card colors
    const categoryColors: { [key: string]: string } = {
        "default": "from-orange-600 to-orange-400",
        "electronics": "from-blue-600 to-blue-400",
        "clothing": "from-purple-600 to-purple-400",
        "food": "from-green-600 to-green-400",
        "books": "from-yellow-600 to-yellow-400",
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <ModernPageHeader
                title="Inventario"
                description={selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Gestiona tus productos"}
                gradient="from-orange-600 to-orange-400"
                icon={<Package size={32} />}
                actions={
                    <>
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="button-modern flex items-center gap-2 bg-white border-2 border-orange-600 text-orange-600 hover:bg-orange-50"
                        >
                            <Scan size={18} />
                            Escanear
                        </button>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <button className="button-modern flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
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
                                        Formulario para agregar un nuevo producto al inventario.
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
                                        className="button-modern bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:opacity-50"
                                    >
                                        Guardar Producto
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    label="Total Productos"
                    value={totalProducts}
                    icon={<Package size={24} />}
                    gradient="from-orange-600 to-orange-400"
                    trend={{ value: 5, label: "vs mes anterior" }}
                />
                <StatsCard
                    label="Valor Inventario"
                    value={`$${totalValue.toLocaleString()}`}
                    icon={<DollarSign size={24} />}
                    gradient="from-green-600 to-green-400"
                />
                <StatsCard
                    label="Stock Bajo"
                    value={lowStock}
                    icon={<TrendingDown size={24} />}
                    gradient="from-yellow-600 to-yellow-400"
                />
                <StatsCard
                    label="Sin Stock"
                    value={outOfStock}
                    icon={<AlertTriangle size={24} />}
                    gradient="from-red-600 to-red-400"
                />
            </div>

            {/* Filter Bar */}
            <ModernFilterBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                placeholder="Buscar productos..."
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {/* Products Grid/List */}
            {loading ? (
                <div className="modern-card p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-2 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-text">Cargando productos...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="modern-card p-12 text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-muted-text text-lg">No hay productos disponibles</p>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((product, index) => {
                        const stock = product.inventory?.[0]?.quantity || 0;
                        const gradient = categoryColors[product.category?.toLowerCase()] || categoryColors.default;

                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -8 }}
                                className="modern-card overflow-hidden group"
                            >
                                {/* Product Image/Icon */}
                                <div className={`h-40 bg-gradient-to-br ${gradient} p-6 relative overflow-hidden flex items-center justify-center`}>
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                                    <Package size={64} className="text-white/80" />
                                </div>

                                {/* Content */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <h3 className="font-semibold text-lg line-clamp-2 mb-1">
                                            {product.name}
                                        </h3>
                                        {product.category && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-surface text-muted-text">
                                                {product.category}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs text-muted-text">Precio</div>
                                            <div className="text-xl font-bold text-primary-600">
                                                ${product.price.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-muted-text">Stock</div>
                                            <div className={`text-xl font-bold ${stock === 0 ? "text-red-600" :
                                                stock < 10 ? "text-yellow-600" :
                                                    "text-green-600"
                                                }`}>
                                                {stock}
                                            </div>
                                        </div>
                                    </div>

                                    {product.sku && (
                                        <div className="text-xs text-muted-text font-mono">
                                            SKU: {product.sku}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="flex-1 p-2 hover:bg-surface rounded-lg transition-colors flex items-center justify-center gap-1 text-sm">
                                            <Edit size={14} />
                                            Editar
                                        </button>
                                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="modern-card overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-border bg-surface/50">
                                <th className="px-6 py-4 text-left text-sm font-semibold">Producto</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">SKU</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Categoría</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Precio</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product, index) => {
                                const stock = product.inventory?.[0]?.quantity || 0;
                                return (
                                    <motion.tr
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="border-b border-border hover:bg-primary-50 transition-all group"
                                    >
                                        <td className="px-6 py-4 font-medium">{product.name}</td>
                                        <td className="px-6 py-4 font-mono text-sm">{product.sku || "-"}</td>
                                        <td className="px-6 py-4">
                                            {product.category && (
                                                <span className="px-2 py-1 rounded-full bg-surface text-xs">
                                                    {product.category}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-semibold">${product.price.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`font-semibold ${stock === 0 ? "text-red-600" :
                                                stock < 10 ? "text-yellow-600" :
                                                    "text-green-600"
                                                }`}>
                                                {stock}
                                            </span>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Barcode Scanner */}
            <BarcodeScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScan}
            />
        </div>
    );
}
