"use client";

import { useState, useEffect } from "react";
import { X, User, Briefcase, Clock, FileText, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    startTime: Date;
    endTime: Date;
    appointment?: {
        id: string;
        notes?: string;
        service: { id: string };
        customer: { id: string };
        employee?: { id: string };
    } | null;
}

interface Service {
    id: string;
    name: string;
    duration: number;
    price: number;
    color: string;
}

interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
}

export function AppointmentModal({
    isOpen,
    onClose,
    onSave,
    startTime,
    endTime,
    appointment,
}: AppointmentModalProps) {
    const [services, setServices] = useState<Service[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [selectedService, setSelectedService] = useState<string>("");
    const [selectedCustomer, setSelectedCustomer] = useState<string>("");
    const [selectedEmployee, setSelectedEmployee] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [customerSearch, setCustomerSearch] = useState<string>("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // Fetch data on open
    useEffect(() => {
        if (isOpen) {
            fetchData();
            if (appointment) {
                setSelectedService(appointment.service.id);
                setSelectedCustomer(appointment.customer.id);
                setSelectedEmployee(appointment.employee?.id || "");
                setNotes(appointment.notes || "");
            } else {
                resetForm();
            }
        }
    }, [isOpen, appointment]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [servicesRes, customersRes, employeesRes] = await Promise.all([
                fetch("/api/services"),
                fetch("/api/customers"),
                fetch("/api/employees"),
            ]);

            if (servicesRes.ok) {
                const data = await servicesRes.json();
                setServices(Array.isArray(data) ? data : []);
            }
            if (customersRes.ok) {
                const data = await customersRes.json();
                setCustomers(Array.isArray(data) ? data : []);
            }
            if (employeesRes.ok) {
                const data = await employeesRes.json();
                setEmployees(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedService("");
        setSelectedCustomer("");
        setSelectedEmployee("");
        setNotes("");
        setCustomerSearch("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedService || !selectedCustomer) {
            alert("Por favor selecciona un servicio y un cliente.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                serviceId: selectedService,
                customerId: selectedCustomer,
                employeeId: selectedEmployee || null,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                notes: notes || null,
                status: "SCHEDULED",
            };

            const url = appointment
                ? `/api/appointments/${appointment.id}`
                : "/api/appointments";
            const method = appointment ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                onSave();
            } else {
                const error = await res.text();
                alert(`Error: ${error}`);
            }
        } catch (error) {
            console.error("Error saving appointment:", error);
            alert("Error al guardar la cita.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!appointment) return;
        if (!confirm("¿Estás seguro de eliminar esta cita?")) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/appointments/${appointment.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                onSave();
            }
        } catch (error) {
            console.error("Error deleting appointment:", error);
        } finally {
            setSaving(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const selectedCustomerObj = customers.find(c => c.id === selectedCustomer);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px",
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "20px",
                    padding: "28px",
                    maxWidth: "500px",
                    width: "100%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0F172A" }}>
                        {appointment ? "Editar Cita" : "Nueva Cita"}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "8px",
                            borderRadius: "10px",
                            border: "none",
                            backgroundColor: "#F1F5F9",
                            cursor: "pointer",
                        }}
                    >
                        <X size={20} color="#64748B" />
                    </button>
                </div>

                {/* Time display */}
                <div
                    style={{
                        backgroundColor: "#EFF6FF",
                        borderRadius: "12px",
                        padding: "16px",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <Clock size={20} color="#3B82F6" />
                    <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E40AF" }}>
                            {format(startTime, "EEEE, d 'de' MMMM", { locale: es })}
                        </div>
                        <div style={{ fontSize: "13px", color: "#3B82F6" }}>
                            {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Service */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                                <Briefcase size={16} />
                                Servicio *
                            </label>
                            <select
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    borderRadius: "10px",
                                    border: "1px solid #E2E8F0",
                                    fontSize: "14px",
                                    backgroundColor: "white",
                                    cursor: "pointer",
                                }}
                            >
                                <option value="">Seleccionar servicio...</option>
                                {services.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.duration} min) - ${s.price}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Customer */}
                        <div style={{ marginBottom: "20px", position: "relative" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                                <User size={16} />
                                Cliente *
                            </label>
                            {selectedCustomerObj ? (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "12px 16px",
                                        borderRadius: "10px",
                                        border: "1px solid #E2E8F0",
                                        backgroundColor: "#F8FAFC",
                                    }}
                                >
                                    <span style={{ fontWeight: 500 }}>{selectedCustomerObj.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedCustomer("");
                                            setCustomerSearch("");
                                        }}
                                        style={{ padding: "4px", border: "none", background: "none", cursor: "pointer" }}
                                    >
                                        <X size={16} color="#64748B" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ position: "relative" }}>
                                        <Search size={16} style={{ position: "absolute", left: "14px", top: "14px", color: "#94A3B8" }} />
                                        <input
                                            type="text"
                                            value={customerSearch}
                                            onChange={(e) => {
                                                setCustomerSearch(e.target.value);
                                                setShowCustomerDropdown(true);
                                            }}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                            placeholder="Buscar cliente..."
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px 12px 40px",
                                                borderRadius: "10px",
                                                border: "1px solid #E2E8F0",
                                                fontSize: "14px",
                                            }}
                                        />
                                    </div>
                                    {showCustomerDropdown && customerSearch && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "100%",
                                                left: 0,
                                                right: 0,
                                                backgroundColor: "white",
                                                border: "1px solid #E2E8F0",
                                                borderRadius: "10px",
                                                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                                                maxHeight: "200px",
                                                overflowY: "auto",
                                                zIndex: 10,
                                            }}
                                        >
                                            {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map((c) => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => {
                                                            setSelectedCustomer(c.id);
                                                            setShowCustomerDropdown(false);
                                                        }}
                                                        style={{
                                                            padding: "12px 16px",
                                                            cursor: "pointer",
                                                            borderBottom: "1px solid #F1F5F9",
                                                        }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                                                    >
                                                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                                                        {c.email && <div style={{ fontSize: "12px", color: "#64748B" }}>{c.email}</div>}
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: "12px 16px", color: "#64748B", textAlign: "center" }}>
                                                    No se encontraron clientes
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Employee (optional) */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                                <User size={16} />
                                Empleado (opcional)
                            </label>
                            <select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    borderRadius: "10px",
                                    border: "1px solid #E2E8F0",
                                    fontSize: "14px",
                                    backgroundColor: "white",
                                    cursor: "pointer",
                                }}
                            >
                                <option value="">Sin asignar</option>
                                {employees.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.firstName} {e.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                                <FileText size={16} />
                                Notas
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Notas adicionales..."
                                rows={3}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    borderRadius: "10px",
                                    border: "1px solid #E2E8F0",
                                    fontSize: "14px",
                                    resize: "vertical",
                                }}
                            />
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "12px" }}>
                            {appointment && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={saving}
                                    style={{
                                        padding: "12px 20px",
                                        borderRadius: "10px",
                                        border: "1px solid #FCA5A5",
                                        backgroundColor: "#FEF2F2",
                                        color: "#DC2626",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        opacity: saving ? 0.5 : 1,
                                    }}
                                >
                                    Eliminar
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: "12px 20px",
                                    borderRadius: "10px",
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "white",
                                    color: "#64748B",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    flex: 1,
                                    padding: "12px 20px",
                                    borderRadius: "10px",
                                    border: "none",
                                    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                                    color: "white",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    opacity: saving ? 0.5 : 1,
                                }}
                            >
                                {saving ? "Guardando..." : appointment ? "Actualizar" : "Crear Cita"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
