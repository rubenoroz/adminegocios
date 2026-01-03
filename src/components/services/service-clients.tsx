"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, User, Mail, Phone, Calendar, X, Clock, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
}

interface Appointment {
    id: string;
    startTime: string;
    status: string;
    service: { name: string; price: number; color: string };
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    SCHEDULED: { label: "Agendada", color: "#3B82F6", bg: "#EFF6FF" },
    CONFIRMED: { label: "Confirmada", color: "#10B981", bg: "#D1FAE5" },
    IN_PROGRESS: { label: "En Curso", color: "#F59E0B", bg: "#FEF3C7" },
    COMPLETED: { label: "Completada", color: "#059669", bg: "#D1FAE5" },
    CANCELLED: { label: "Cancelada", color: "#EF4444", bg: "#FEE2E2" },
    NO_SHOW: { label: "No Asistió", color: "#6B7280", bg: "#F3F4F6" }
};

export function ServiceClients() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerHistory, setCustomerHistory] = useState<Appointment[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "" });
    const { toast } = useToast();

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await fetch("/api/customers");
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerHistory = async (customerId: string) => {
        setHistoryLoading(true);
        try {
            const res = await fetch(`/api/appointments?customerId=${customerId}`);
            const data = await res.json();
            setCustomerHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setCustomerHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const openHistory = (customer: Customer) => {
        setSelectedCustomer(customer);
        setHistoryOpen(true);
        fetchCustomerHistory(customer.id);
    };

    const handleCreate = async () => {
        if (!form.name) return;
        try {
            const res = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                toast({ title: "Cliente creado" });
                fetchCustomers();
                setOpen(false);
                setForm({ name: "", email: "", phone: "" });
            }
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
    );

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '400px' }}>
                    <Search size={20} color="#64748B" />
                    <input
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid #E2E8F0', fontSize: '15px' }}
                    />
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                            <Plus size={20} /> Nuevo Cliente
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Nuevo Cliente</DialogTitle></DialogHeader>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Nombre *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Email</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Teléfono</label>
                                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 123 456 7890" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                            </div>
                        </div>
                        <DialogFooter>
                            <button onClick={handleCreate} disabled={!form.name} style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 600, background: '#10B981', color: 'white', border: 'none', cursor: 'pointer' }}>Crear Cliente</button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Clients Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {filteredCustomers.map((customer, idx) => (
                    <motion.div key={customer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                        style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '18px' }}>
                                {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#0F172A' }}>{customer.name}</h3>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>
                            {customer.email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={14} /> {customer.email}</div>}
                            {customer.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} /> {customer.phone}</div>}
                        </div>
                        <button
                            onClick={() => openHistory(customer)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#3B82F6', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Calendar size={16} /> Ver Historial
                        </button>
                    </motion.div>
                ))}

                {filteredCustomers.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px', backgroundColor: 'white', borderRadius: '16px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                        <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Sin clientes</h3>
                        <p style={{ color: '#64748B' }}>Agrega tu primer cliente para empezar</p>
                    </div>
                )}
            </div>

            {/* History Modal */}
            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent style={{ maxWidth: '600px' }}>
                    <DialogHeader>
                        <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                                {selectedCustomer?.name.charAt(0)}
                            </div>
                            Historial de {selectedCustomer?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px 0' }}>
                        {historyLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                            </div>
                        ) : customerHistory.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {customerHistory.map(apt => {
                                    const statusConf = STATUS_LABELS[apt.status] || STATUS_LABELS.SCHEDULED;
                                    return (
                                        <div key={apt.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                                            <div style={{ width: '4px', height: '40px', borderRadius: '2px', backgroundColor: apt.service.color }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#0F172A' }}>{apt.service.name}</div>
                                                <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Clock size={12} /> {formatDate(apt.startTime)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, backgroundColor: statusConf.bg, color: statusConf.color }}>{statusConf.label}</span>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>${apt.service.price}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                                <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                <p>Sin historial de citas</p>
                            </div>
                        )}
                    </div>
                    {customerHistory.length > 0 && (
                        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span style={{ color: '#64748B' }}>Total de citas:</span>
                                <span style={{ fontWeight: 700 }}>{customerHistory.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span style={{ color: '#64748B' }}>Citas completadas:</span>
                                <span style={{ fontWeight: 700, color: '#059669' }}>{customerHistory.filter(a => a.status === 'COMPLETED').length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span style={{ color: '#64748B' }}>Total gastado:</span>
                                <span style={{ fontWeight: 700, color: '#059669' }}>
                                    ${customerHistory.filter(a => a.status === 'COMPLETED').reduce((sum, a) => sum + a.service.price, 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
