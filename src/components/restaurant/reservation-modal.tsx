"use client";

import { useState, useEffect } from "react";
import { X, User, Clock, Users, Utensils, Phone, Mail, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    startTime: Date;
    endTime: Date;
    reservation?: {
        id: string;
        customerName: string;
        phone?: string | null;
        email?: string | null;
        partySize: number;
        tableId?: string | null;
        notes?: string | null;
        status: string;
    } | null;
}

interface Table {
    id: string;
    name: string;
    capacity: number;
}

export function ReservationModal({
    isOpen,
    onClose,
    onSave,
    startTime,
    endTime,
    reservation,
}: ReservationModalProps) {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [partySize, setPartySize] = useState("2");
    const [tableId, setTableId] = useState("");
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState("PENDING");

    // Fetch tables on open
    useEffect(() => {
        if (isOpen) {
            fetchTables();
            if (reservation) {
                setCustomerName(reservation.customerName);
                setPhone(reservation.phone || "");
                setEmail(reservation.email || "");
                setPartySize(reservation.partySize.toString());
                setTableId(reservation.tableId || "");
                setNotes(reservation.notes || "");
                setStatus(reservation.status);
            } else {
                resetForm();
            }
        }
    }, [isOpen, reservation]);

    const fetchTables = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/restaurant/tables");
            if (res.ok) {
                const data = await res.json();
                setTables(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching tables:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCustomerName("");
        setPhone("");
        setEmail("");
        setPartySize("2");
        setTableId("");
        setNotes("");
        setStatus("PENDING");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName.trim()) {
            alert("Por favor ingresa el nombre del cliente.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                customerName: customerName.trim(),
                phone: phone || null,
                email: email || null,
                partySize: parseInt(partySize),
                tableId: tableId || null,
                date: startTime.toISOString(),
                duration: Math.round((endTime.getTime() - startTime.getTime()) / 60000),
                notes: notes || null,
                status,
            };

            const url = reservation
                ? `/api/restaurant/reservations/${reservation.id}`
                : "/api/restaurant/reservations";
            const method = reservation ? "PUT" : "POST";

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
            console.error("Error saving reservation:", error);
            alert("Error al guardar la reservación.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!reservation) return;
        if (!confirm("¿Estás seguro de eliminar esta reservación?")) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/restaurant/reservations/${reservation.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                onSave();
            }
        } catch (error) {
            console.error("Error deleting reservation:", error);
        } finally {
            setSaving(false);
        }
    };

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
                    <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#f59e0b" }}>
                        {reservation ? "Editar Reservación" : "Nueva Reservación"}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "8px",
                            borderRadius: "10px",
                            border: "none",
                            backgroundColor: "#FEF3C7",
                            cursor: "pointer",
                        }}
                    >
                        <X size={20} color="#92400E" />
                    </button>
                </div>

                {/* Time display */}
                <div
                    style={{
                        backgroundColor: "#FEF3C7",
                        borderRadius: "12px",
                        padding: "16px",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <Clock size={20} color="#f59e0b" />
                    <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#92400E" }}>
                            {format(startTime, "EEEE, d 'de' MMMM", { locale: es })}
                        </div>
                        <div style={{ fontSize: "13px", color: "#B45309" }}>
                            {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Customer Name */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                                <User size={16} />
                                Nombre del Cliente *
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Juan Pérez"
                                required
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    borderRadius: "10px",
                                    border: "1px solid #E2E8F0",
                                    fontSize: "14px",
                                }}
                            />
                        </div>

                        {/* Phone and Party Size - side by side */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                            <div>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                                    <Phone size={16} />
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+52 555 1234567"
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        borderRadius: "10px",
                                        border: "1px solid #E2E8F0",
                                        fontSize: "14px",
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                                    <Users size={16} />
                                    Personas *
                                </label>
                                <input
                                    type="number"
                                    value={partySize}
                                    onChange={(e) => setPartySize(e.target.value)}
                                    min="1"
                                    max="20"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        borderRadius: "10px",
                                        border: "1px solid #E2E8F0",
                                        fontSize: "14px",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                                <Utensils size={16} />
                                Mesa
                            </label>
                            <select
                                value={tableId}
                                onChange={(e) => setTableId(e.target.value)}
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
                                {tables.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} (capacidad: {t.capacity})
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
                                placeholder="Ocasión especial, alergias, preferencias..."
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

                        {/* Status (only for editing) */}
                        {reservation && (
                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                                    Estado
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
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
                                    <option value="PENDING">Pendiente</option>
                                    <option value="CONFIRMED">Confirmada</option>
                                    <option value="CANCELLED">Cancelada</option>
                                    <option value="NO_SHOW">No se presentó</option>
                                    <option value="COMPLETED">Completada</option>
                                </select>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "12px" }}>
                            {reservation && (
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
                                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                    color: "white",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    opacity: saving ? 0.5 : 1,
                                }}
                            >
                                {saving ? "Guardando..." : reservation ? "Actualizar" : "Crear Reservación"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
