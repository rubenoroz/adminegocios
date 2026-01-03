"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Truck, Phone, Mail, Trash2, Package, Search, X, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";

interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export function SupplierList() {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [open, setOpen] = useState(false);
    const [newSupplier, setNewSupplier] = useState({
        name: "", contactName: "", phone: "", email: "", address: "", category: ""
    });

    // Order creation state
    const [orderOpen, setOrderOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [orderNotes, setOrderNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchSuppliers();
    }, [selectedBranch]);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/suppliers');
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newSupplier.name) return;
        try {
            const res = await fetch('/api/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSupplier)
            });
            if (res.ok) {
                toast({ title: "Proveedor agregado exitosamente" });
                setOpen(false);
                setNewSupplier({ name: "", contactName: "", phone: "", email: "", address: "", category: "" });
                fetchSuppliers();
            }
        } catch (error) {
            toast({ title: "Error al crear proveedor", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este proveedor?")) return;
        try {
            const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: "Proveedor eliminado" });
                fetchSuppliers();
            }
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    const handleOpenOrder = async (supplier: any) => {
        setSelectedSupplier(supplier);
        setOrderItems([]);
        setSelectedProductId("");
        setQuantity(1);
        setOrderNotes("");
        setOrderOpen(true);

        // Fetch products for this supplier
        try {
            const res = await fetch(`/api/suppliers/${supplier.id}/products`);
            if (res.ok) {
                const products = await res.json();
                setSupplierProducts(products);
            }
        } catch (error) {
            console.error("Error fetching supplier products:", error);
            setSupplierProducts([]);
        }
    };

    const handleAddItem = () => {
        if (!selectedProductId || quantity <= 0) return;

        const product = supplierProducts.find(p => p.id === selectedProductId);
        if (!product) return;

        // Check if product already in list
        const existingIndex = orderItems.findIndex(item => item.productId === selectedProductId);
        if (existingIndex >= 0) {
            // Update quantity
            const updatedItems = [...orderItems];
            updatedItems[existingIndex].quantity += quantity;
            updatedItems[existingIndex].total = updatedItems[existingIndex].quantity * updatedItems[existingIndex].unitPrice;
            setOrderItems(updatedItems);
        } else {
            // Add new item
            const unitPrice = product.cost || product.price;
            setOrderItems([...orderItems, {
                productId: product.id,
                productName: product.name,
                quantity,
                unitPrice,
                total: quantity * unitPrice
            }]);
        }

        setSelectedProductId("");
        setQuantity(1);
    };

    const handleRemoveItem = (productId: string) => {
        setOrderItems(orderItems.filter(item => item.productId !== productId));
    };

    const handleCreateOrder = async () => {
        if (orderItems.length === 0 || !selectedSupplier) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/suppliers/${selectedSupplier.id}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: orderItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice
                    })),
                    notes: orderNotes
                })
            });

            if (res.ok) {
                toast({ title: `Orden creada para ${selectedSupplier.name}` });
                setOrderOpen(false);
                fetchSuppliers();
            } else {
                toast({ title: "Error al crear orden", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error al crear orden", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const orderTotal = orderItems.reduce((sum, item) => sum + item.total, 0);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        s.contactName?.toLowerCase().includes(searchValue.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchValue.toLowerCase())
    );

    const totalSuppliers = suppliers.length;
    const totalOrders = suppliers.reduce((sum, s) => sum + (s.totalOrders || 0), 0);
    const categories = [...new Set(suppliers.map(s => s.category).filter(Boolean))].length;

    return (
        <div className="bg-slate-100 pb-16">
            {/* Header */}
            <div style={{ padding: "var(--spacing-lg)", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Proveedores</h1>
                        <p className="text-muted-foreground text-lg">Gestiona tus proveedores y órdenes de compra</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <button className="button-modern gradient-purple" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Plus size={18} /> Nuevo Proveedor
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle style={{ fontSize: "1.5rem", fontWeight: 700 }}>Agregar Proveedor</DialogTitle>
                                <DialogDescription style={{ color: "#64748b" }}>Registra un nuevo proveedor</DialogDescription>
                            </DialogHeader>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px 0" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Nombre de la Empresa *</label>
                                    <input type="text" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} className="modern-input" placeholder="Nombre del proveedor" />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Contacto</label>
                                        <input type="text" value={newSupplier.contactName} onChange={(e) => setNewSupplier({ ...newSupplier, contactName: e.target.value })} className="modern-input" placeholder="Nombre del contacto" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Categoría</label>
                                        <input type="text" value={newSupplier.category} onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })} className="modern-input" placeholder="Ej: Bebidas, Abarrotes" />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Teléfono</label>
                                        <input type="tel" value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} className="modern-input" placeholder="555-1234" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Email</label>
                                        <input type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} className="modern-input" placeholder="email@proveedor.com" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Dirección</label>
                                    <input type="text" value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} className="modern-input" placeholder="Dirección del proveedor" />
                                </div>
                            </div>
                            <DialogFooter style={{ gap: "12px" }}>
                                <button onClick={() => setOpen(false)} className="filter-chip">Cancelar</button>
                                <button onClick={handleCreate} disabled={!newSupplier.name} className="button-modern gradient-purple" style={{ opacity: !newSupplier.name ? 0.5 : 1 }}>Guardar</button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPIs */}
            <motion.div style={{ padding: "0 var(--spacing-lg)", marginBottom: "32px" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <ModernKpiCard title="Total Proveedores" value={totalSuppliers.toString()} icon={Truck} gradientClass="gradient-purple" subtitle="Registrados" />
                    <ModernKpiCard title="Órdenes Realizadas" value={totalOrders.toString()} icon={Package} gradientClass="gradient-blue" subtitle="Históricas" />
                    <ModernKpiCard title="Categorías" value={categories.toString()} icon={Truck} gradientClass="gradient-green" subtitle="Diferentes" />
                </div>
            </motion.div>

            {/* Search */}
            <div style={{ padding: "0 var(--spacing-lg)", marginBottom: "24px" }}>
                <div style={{ position: "relative", maxWidth: "400px" }}>
                    <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={20} />
                    <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Buscar proveedores..." className="modern-input" style={{ paddingLeft: "48px" }} />
                </div>
            </div>

            {/* List */}
            <section style={{ padding: "0 var(--spacing-lg)" }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando proveedores...</p>
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">🚚</div>
                        <p className="text-slate-500 text-lg">No hay proveedores registrados</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
                        {filteredSuppliers.map((supplier, index) => {
                            const colors = [
                                { bg: "#EDE9FE", accent: "#7C3AED" },
                                { bg: "#DBEAFE", accent: "#2563EB" },
                                { bg: "#D1FAE5", accent: "#059669" },
                                { bg: "#FEE2E2", accent: "#DC2626" },
                            ][index % 4];

                            return (
                                <motion.div key={supplier.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: colors.bg, borderRadius: "16px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: colors.accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Truck size={24} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b" }}>{supplier.name}</h3>
                                                {supplier.category && <span style={{ fontSize: "12px", padding: "4px 10px", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: "8px", color: colors.accent, fontWeight: 600 }}>{supplier.category}</span>}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(supplier.id)} style={{ padding: "8px", borderRadius: "8px", border: "none", backgroundColor: "white", color: "#ef4444", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                                        {supplier.contactName && <div style={{ marginBottom: "4px" }}>👤 {supplier.contactName}</div>}
                                        {supplier.phone && <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}><Phone size={14} /> {supplier.phone}</div>}
                                        {supplier.email && <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Mail size={14} /> {supplier.email}</div>}
                                    </div>
                                    <div style={{ paddingTop: "16px", borderTop: "2px solid rgba(255,255,255,0.5)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>{supplier.totalOrders || 0} órdenes</div>
                                            <div style={{ fontSize: "11px", color: colors.accent, fontWeight: 600 }}>Última: {supplier.lastOrder || "—"}</div>
                                        </div>
                                        <button onClick={() => handleOpenOrder(supplier)} className="button-modern-sm gradient-purple" style={{ fontSize: "13px", padding: "8px 16px" }}>+ Nueva Orden</button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Order Creation Dialog with Line Items */}
            <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle style={{ fontSize: "1.5rem", fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ShoppingCart size={24} className="text-purple-600" />
                            Nueva Orden
                        </DialogTitle>
                        <DialogDescription style={{ color: "#64748b" }}>
                            {selectedSupplier ? `Crear orden para ${selectedSupplier.name}` : "Crear nueva orden"}
                        </DialogDescription>
                    </DialogHeader>

                    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "16px 0" }}>
                        {/* Product Selector */}
                        <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: '#475569' }}>
                                Agregar Producto
                            </label>
                            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                                <div style={{ flex: 2 }}>
                                    <select
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                        className="modern-input"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Seleccionar producto...</option>
                                        {supplierProducts.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} - ${(product.cost || product.price).toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                    {supplierProducts.length === 0 && (
                                        <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                                            No hay productos vinculados a este proveedor
                                        </p>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: '#64748B' }}>Cantidad</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                        className="modern-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <button
                                    onClick={handleAddItem}
                                    disabled={!selectedProductId}
                                    className="button-modern gradient-blue"
                                    style={{ padding: '12px 20px', opacity: !selectedProductId ? 0.5 : 1 }}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Order Items Table */}
                        {orderItems.length > 0 && (
                            <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#F1F5F9' }}>
                                        <tr>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Producto</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Cantidad</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Precio Unit.</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Total</th>
                                            <th style={{ padding: '12px 16px', width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderItems.map((item) => (
                                            <tr key={item.productId} style={{ borderTop: '1px solid #E2E8F0' }}>
                                                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{item.productName}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>{item.quantity}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>${item.unitPrice.toFixed(2)}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>${item.total.toFixed(2)}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.productId)}
                                                        style={{ padding: '4px', borderRadius: '6px', border: 'none', backgroundColor: '#FEE2E2', color: '#DC2626', cursor: 'pointer' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot style={{ backgroundColor: '#F8FAFC' }}>
                                        <tr style={{ borderTop: '2px solid #E2E8F0' }}>
                                            <td colSpan={3} style={{ padding: '16px', textAlign: 'right', fontSize: '16px', fontWeight: 700 }}>Total de la Orden:</td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontSize: '20px', fontWeight: 900, color: '#7C3AED' }}>${orderTotal.toFixed(2)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Notas adicionales (opcional)</label>
                            <textarea
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                                className="modern-input"
                                placeholder="Instrucciones especiales de entrega..."
                                style={{ minHeight: "60px", resize: "vertical" }}
                            />
                        </div>
                    </div>

                    <DialogFooter style={{ gap: "12px" }}>
                        <button onClick={() => setOrderOpen(false)} className="filter-chip">Cancelar</button>
                        <button
                            onClick={handleCreateOrder}
                            disabled={orderItems.length === 0 || isSubmitting}
                            className="button-modern gradient-purple"
                            style={{ opacity: orderItems.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <ShoppingCart size={16} />
                            )}
                            Crear Orden (${orderTotal.toFixed(2)})
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
