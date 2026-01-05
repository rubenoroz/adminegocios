"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Clock, User, Phone, Filter, Check, X, Play, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Banknote, CreditCard, Wallet } from "lucide-react";
import { CustomerSelector } from "@/components/sales/customer-selector";
import { CustomerFiscalModal } from "@/components/sales/customer-fiscal-modal";

interface Appointment {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    notes: string | null;
    service: { name: string; duration: number; price: number; color: string };
    customer: { id: string; name: string; phone: string | null; email: string | null };
    employee: { id: string; firstName: string; lastName: string } | null;
}

interface Service { id: string; name: string; duration: number; price: number; color: string; }
interface Customer { id: string; name: string; phone: string | null; }
interface Employee { id: string; firstName: string; lastName: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    SCHEDULED: { label: "Agendada", color: "#3B82F6", bg: "#EFF6FF", icon: Calendar },
    CONFIRMED: { label: "Confirmada", color: "#10B981", bg: "#D1FAE5", icon: Check },
    IN_PROGRESS: { label: "En Curso", color: "#F59E0B", bg: "#FEF3C7", icon: Play },
    COMPLETED: { label: "Completada", color: "#059669", bg: "#D1FAE5", icon: Check },
    CANCELLED: { label: "Cancelada", color: "#EF4444", bg: "#FEE2E2", icon: X },
    NO_SHOW: { label: "No Asistió", color: "#6B7280", bg: "#F3F4F6", icon: AlertCircle }
};

export function AppointmentsList() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [form, setForm] = useState({ serviceId: "", customerId: "", employeeId: "", startTime: "", notes: "" });
    const { toast } = useToast();

    // Payment State
    const [payOpen, setPayOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [requiresInvoice, setRequiresInvoice] = useState(false);
    const [isFiscalModalOpen, setIsFiscalModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedDate, filterStatus]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `/api/appointments?date=${selectedDate}`;
            if (filterStatus) url += `&status=${filterStatus}`;

            const [apptRes, servRes, custRes, empRes] = await Promise.all([
                fetch(url),
                fetch("/api/services"),
                fetch("/api/customers"),
                fetch("/api/employees")
            ]);

            const [apptData, servData, custData, empData] = await Promise.all([
                apptRes.json(), servRes.json(), custRes.json(), empRes.json()
            ]);

            setAppointments(Array.isArray(apptData) ? apptData : []);
            setServices(Array.isArray(servData) ? servData : []);
            setCustomers(Array.isArray(custData) ? custData : []);
            setEmployees(Array.isArray(empData) ? empData : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.serviceId || !form.customerId || !form.startTime) {
            toast({ title: "Completa los campos requeridos", variant: "destructive" });
            return;
        }

        try {
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    startTime: `${selectedDate}T${form.startTime}:00`
                })
            });

            if (res.ok) {
                toast({ title: "Cita creada exitosamente" });
                fetchData();
                setOpen(false);
                setForm({ serviceId: "", customerId: "", employeeId: "", startTime: "", notes: "" });
            }
        } catch (error) {
            toast({ title: "Error al crear cita", variant: "destructive" });
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await fetch(`/api/appointments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            fetchData();
            toast({ title: `Estado actualizado a ${STATUS_CONFIG[status]?.label}` });
        } catch (error) {
            console.error(error);
        }
    };

    const openPaymentModal = (apt: Appointment) => {
        setSelectedAppointment(apt);
        // Pre-select the appointment's customer
        // We need to match the shape expected by CustomerSelector, or just pass id/name
        // The API returns basic customer info, so we might need to fetch full details or just pass what we have
        // But CustomerSelector expects full object or at least id/name to show.
        // Let's assume the basic info is enough to start.
        setSelectedCustomer(apt.customer ? { ...apt.customer, legalName: apt.customer.name, taxId: '' } : null);
        setRequiresInvoice(false);
        setPayOpen(true);
    };

    const handlePayment = async () => {
        if (!selectedAppointment) return;

        try {
            const res = await fetch(`/api/appointments/${selectedAppointment.id}/pay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentMethod,
                    customerId: selectedCustomer?.id,
                    requiresInvoice
                })
            });

            if (res.ok) {
                toast({ title: "Cobro registrado correctamente" });
                fetchData();
                setPayOpen(false);
                setSelectedAppointment(null);
            } else {
                toast({ title: "Error al registrar cobro", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error de conexión", variant: "destructive" });
        }
    };

    const formatTime = (iso: string) => {
        return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div>
            {/* Header with date picker and filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ padding: '12px 16px', borderRadius: '10px', border: '2px solid #E2E8F0', fontWeight: 600, fontSize: '15px' }}
                    />
                    <select
                        value={filterStatus || ""}
                        onChange={(e) => setFilterStatus(e.target.value || null)}
                        style={{ padding: '12px 16px', borderRadius: '10px', border: '2px solid #E2E8F0', fontWeight: 500 }}
                    >
                        <option value="">Todos los estados</option>
                        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                        ))}
                    </select>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                            background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white',
                            borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer'
                        }}>
                            <Plus size={20} /> Nueva Cita
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agendar Cita - {new Date(selectedDate).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</DialogTitle>
                        </DialogHeader>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Servicio *</label>
                                <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}>
                                    <option value="">Seleccionar servicio</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration}min - ${s.price})</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Cliente *</label>
                                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}>
                                    <option value="">Seleccionar cliente</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Hora *</label>
                                    <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Asignar a</label>
                                    <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}>
                                        <option value="">Sin asignar</option>
                                        {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Notas</label>
                                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Observaciones adicionales..." rows={2}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', resize: 'none' }} />
                            </div>
                        </div>
                        <DialogFooter>
                            <button onClick={handleCreate} disabled={!form.serviceId || !form.customerId || !form.startTime}
                                style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 600, background: '#10B981', color: 'white', border: 'none', cursor: 'pointer' }}>
                                Agendar Cita
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Appointments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {appointments.map((apt, idx) => {
                    const statusConf = STATUS_CONFIG[apt.status] || STATUS_CONFIG.SCHEDULED;
                    const StatusIcon = statusConf.icon;

                    return (
                        <motion.div
                            key={apt.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
                                backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}
                        >
                            {/* Time block */}
                            <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>{formatTime(apt.startTime)}</div>
                                <div style={{ fontSize: '13px', color: '#64748B' }}>{formatTime(apt.endTime)}</div>
                            </div>

                            {/* Color bar */}
                            <div style={{ width: '4px', height: '50px', borderRadius: '4px', backgroundColor: apt.service.color }} />

                            {/* Info */}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '16px', color: '#0F172A', marginBottom: '4px' }}>{apt.service.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#64748B' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <User size={14} /> {apt.customer.name}
                                    </span>
                                    {apt.customer.phone && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Phone size={14} /> {apt.customer.phone}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Status badge */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                                borderRadius: '20px', backgroundColor: statusConf.bg, color: statusConf.color, fontWeight: 600, fontSize: '13px'
                            }}>
                                <StatusIcon size={14} /> {statusConf.label}
                            </div>

                            {/* Quick actions */}
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {apt.status === "SCHEDULED" && (
                                    <button onClick={() => updateStatus(apt.id, "CONFIRMED")} title="Confirmar"
                                        style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#D1FAE5', border: 'none', cursor: 'pointer' }}>
                                        <Check size={16} color="#059669" />
                                    </button>
                                )}
                                {(apt.status === "SCHEDULED" || apt.status === "CONFIRMED") && (
                                    <button onClick={() => updateStatus(apt.id, "IN_PROGRESS")} title="Iniciar"
                                        style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FEF3C7', border: 'none', cursor: 'pointer' }}>
                                        <Play size={16} color="#D97706" />
                                    </button>
                                )}
                                {apt.status === "IN_PROGRESS" && (
                                    <button onClick={() => updateStatus(apt.id, "COMPLETED")} title="Completar"
                                        style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#D1FAE5', border: 'none', cursor: 'pointer' }}>
                                        <Check size={16} color="#059669" />
                                    </button>
                                )}
                                {apt.status !== "CANCELLED" && (
                                    <button onClick={() => openPaymentModal(apt)} title="Cobrar"
                                        style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#EFF6FF', border: 'none', cursor: 'pointer' }}>
                                        <Banknote size={16} color="#3B82F6" />
                                    </button>
                                )}
                                {apt.status !== "COMPLETED" && apt.status !== "CANCELLED" && (
                                    <button onClick={() => updateStatus(apt.id, "CANCELLED")} title="Cancelar"
                                        style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FEE2E2', border: 'none', cursor: 'pointer' }}>
                                        <X size={16} color="#EF4444" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {appointments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '64px', backgroundColor: 'white', borderRadius: '16px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                        <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Sin citas para esta fecha</h3>
                        <p style={{ color: '#64748B' }}>Selecciona otra fecha o agenda una nueva cita</p>
                    </div>
                )}
            </div>
            {/* Payment Modal */}
            <Dialog open={payOpen} onOpenChange={setPayOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cobrar Cita</DialogTitle>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-4 py-4">
                            <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center">
                                <span className="text-slate-600">Total a Pagar:</span>
                                <span className="text-2xl font-bold text-slate-900">${selectedAppointment.service.price}</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Método de Pago</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'CASH', label: 'Efectivo', icon: Banknote },
                                        { id: 'CARD', label: 'Tarjeta', icon: CreditCard },
                                        { id: 'TRANSFER', label: 'Transfer', icon: Wallet },
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setPaymentMethod(m.id)}
                                            className={`p-2 rounded-lg border text-sm flex flex-col items-center gap-1 transition-all ${paymentMethod === m.id
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                                                    : 'border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <m.icon size={16} />
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-slate-700">Datos Fiscales</label>
                                        <button
                                            onClick={() => setIsFiscalModalOpen(true)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            Actualizar Datos
                                        </button>
                                    </div>
                                    <CustomerSelector
                                        selectedCustomer={selectedCustomer}
                                        onSelect={setSelectedCustomer}
                                        onNewCustomer={() => setIsFiscalModalOpen(true)}
                                    />
                                    {selectedCustomer && (
                                        <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all">
                                            <input
                                                type="checkbox"
                                                checked={requiresInvoice}
                                                onChange={(e) => setRequiresInvoice(e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700">Requiere Factura</span>
                                                {requiresInvoice && !selectedCustomer.taxId && (
                                                    <span className="text-xs text-amber-600 font-bold">⚠️ Falta RFC</span>
                                                )}
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <button
                            onClick={handlePayment}
                            disabled={!selectedAppointment}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200"
                        >
                            Confirmar Cobro
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CustomerFiscalModal
                isOpen={isFiscalModalOpen}
                onClose={() => setIsFiscalModalOpen(false)}
                onSave={(customer) => setSelectedCustomer(customer)}
            />
        </div>
    );
}
