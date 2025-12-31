"use client";

import { useState } from "react";
import { X, ShieldCheck, UserCheck, Phone, Mail, Key, AlertTriangle } from "lucide-react";

interface OwnerRecoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
    businessName: string;
    currentOwner?: {
        id: string;
        email: string;
        name: string | null;
    };
    onComplete: () => void;
}

type RequestType = "RECOVERY" | "TRANSFER";
type VerificationMethod = "EMAIL" | "PHONE" | "IN_PERSON";
type Step = "SELECT_TYPE" | "ENTER_DETAILS" | "VERIFY" | "COMPLETE";

export function OwnerRecoveryModal({
    isOpen,
    onClose,
    businessId,
    businessName,
    currentOwner,
    onComplete
}: OwnerRecoveryModalProps) {
    const [step, setStep] = useState<Step>("SELECT_TYPE");
    const [requestType, setRequestType] = useState<RequestType | null>(null);
    const [reason, setReason] = useState("");
    const [verificationMethod, setVerificationMethod] = useState<VerificationMethod | null>(null);
    const [notes, setNotes] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newOwnerEmail, setNewOwnerEmail] = useState("");
    const [newOwnerName, setNewOwnerName] = useState("");
    const [requestId, setRequestId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleCreateRequest = async () => {
        if (!requestType || !reason) {
            setError("Por favor complete todos los campos");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/owner-recovery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessId,
                    type: requestType,
                    reason,
                    currentOwnerId: currentOwner?.id
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al crear solicitud");
            }

            setRequestId(data.id);
            setStep("VERIFY");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndComplete = async () => {
        if (!verificationMethod || !requestId) {
            setError("Por favor seleccione el método de verificación");
            return;
        }

        if (!newPassword) {
            setError("Por favor ingrese la nueva contraseña");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/owner-recovery/${requestId}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    verificationMethod,
                    notes,
                    newPassword,
                    newOwnerEmail: requestType === "TRANSFER" ? newOwnerEmail : undefined,
                    newOwnerName: requestType === "TRANSFER" ? newOwnerName : undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al completar solicitud");
            }

            setStep("COMPLETE");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep("SELECT_TYPE");
        setRequestType(null);
        setReason("");
        setVerificationMethod(null);
        setNotes("");
        setNewPassword("");
        setNewOwnerEmail("");
        setNewOwnerName("");
        setRequestId(null);
        setError(null);
        onClose();
    };

    const handleFinish = () => {
        onComplete();
        handleClose();
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                backdropFilter: "blur(4px)"
            }}
            onClick={handleClose}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "20px",
                    padding: "32px",
                    maxWidth: "32rem",
                    width: "100%",
                    margin: "0 16px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            backgroundColor: "#FEF3C7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <ShieldCheck size={24} style={{ color: "#D97706" }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0F172A", margin: 0 }}>
                                Gestión de Dueño
                            </h2>
                            <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>{businessName}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "8px",
                            color: "#64748B"
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        backgroundColor: "#FEF2F2",
                        border: "1px solid #FECACA",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#DC2626"
                    }}>
                        <AlertTriangle size={18} />
                        <span style={{ fontSize: "14px" }}>{error}</span>
                    </div>
                )}

                {/* Step 1: Select Type */}
                {step === "SELECT_TYPE" && (
                    <>
                        <p style={{ color: "#475569", marginBottom: "20px", fontSize: "14px" }}>
                            Seleccione el tipo de acción que desea realizar:
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                            <button
                                onClick={() => { setRequestType("RECOVERY"); setStep("ENTER_DETAILS"); }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                    padding: "16px",
                                    border: "2px solid #E2E8F0",
                                    borderRadius: "12px",
                                    backgroundColor: "white",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "#3B82F6";
                                    e.currentTarget.style.backgroundColor = "#EFF6FF";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "#E2E8F0";
                                    e.currentTarget.style.backgroundColor = "white";
                                }}
                            >
                                <div style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "10px",
                                    backgroundColor: "#DBEAFE",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <Key size={22} style={{ color: "#2563EB" }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>
                                        Recuperar Acceso
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#64748B" }}>
                                        Resetear la contraseña del dueño actual
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => { setRequestType("TRANSFER"); setStep("ENTER_DETAILS"); }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                    padding: "16px",
                                    border: "2px solid #E2E8F0",
                                    borderRadius: "12px",
                                    backgroundColor: "white",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "#8B5CF6";
                                    e.currentTarget.style.backgroundColor = "#F5F3FF";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "#E2E8F0";
                                    e.currentTarget.style.backgroundColor = "white";
                                }}
                            >
                                <div style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "10px",
                                    backgroundColor: "#EDE9FE",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <UserCheck size={22} style={{ color: "#7C3AED" }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>
                                        Transferir Propiedad
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#64748B" }}>
                                        Cambiar el dueño del negocio
                                    </div>
                                </div>
                            </button>
                        </div>

                        {currentOwner && (
                            <div style={{
                                backgroundColor: "#F8FAFC",
                                borderRadius: "8px",
                                padding: "12px 16px",
                                fontSize: "13px",
                                color: "#475569"
                            }}>
                                <strong>Dueño actual:</strong> {currentOwner.name || currentOwner.email}
                            </div>
                        )}
                    </>
                )}

                {/* Step 2: Enter Details */}
                {step === "ENTER_DETAILS" && (
                    <>
                        <p style={{ color: "#475569", marginBottom: "20px", fontSize: "14px" }}>
                            {requestType === "RECOVERY"
                                ? "Documente la razón para recuperar el acceso:"
                                : "Documente la razón para transferir la propiedad:"}
                        </p>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#334155", marginBottom: "8px" }}>
                                Razón *
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Describa la razón de esta solicitud (requerido para auditoría)..."
                                rows={3}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    resize: "vertical",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>

                        {requestType === "TRANSFER" && (
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#334155", marginBottom: "8px" }}>
                                    Email del nuevo dueño *
                                </label>
                                <input
                                    type="email"
                                    value={newOwnerEmail}
                                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                                    placeholder="nuevo.dueno@email.com"
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        border: "1px solid #CBD5E1",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={() => { setStep("SELECT_TYPE"); setRequestType(null); }}
                                style={{
                                    flex: 1,
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    border: "1px solid #CBD5E1",
                                    backgroundColor: "white",
                                    color: "#334155",
                                    fontWeight: 500,
                                    cursor: "pointer"
                                }}
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handleCreateRequest}
                                disabled={loading || !reason}
                                style={{
                                    flex: 1,
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: reason ? "#2563EB" : "#94A3B8",
                                    color: "white",
                                    fontWeight: 500,
                                    cursor: reason ? "pointer" : "not-allowed"
                                }}
                            >
                                {loading ? "Creando..." : "Continuar"}
                            </button>
                        </div>
                    </>
                )}

                {/* Step 3: Verify */}
                {step === "VERIFY" && (
                    <>
                        <div style={{
                            backgroundColor: "#FEF3C7",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                            <AlertTriangle size={18} style={{ color: "#D97706" }} />
                            <span style={{ fontSize: "14px", color: "#92400E" }}>
                                Verifique la identidad del dueño antes de continuar
                            </span>
                        </div>

                        <p style={{ color: "#475569", marginBottom: "16px", fontSize: "14px" }}>
                            ¿Cómo verificó la identidad del solicitante?
                        </p>

                        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                            {[
                                { value: "EMAIL", label: "Email", icon: <Mail size={16} /> },
                                { value: "PHONE", label: "Teléfono", icon: <Phone size={16} /> },
                                { value: "IN_PERSON", label: "En persona", icon: <UserCheck size={16} /> }
                            ].map((method) => (
                                <button
                                    key={method.value}
                                    onClick={() => setVerificationMethod(method.value as VerificationMethod)}
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: verificationMethod === method.value ? "2px solid #2563EB" : "1px solid #CBD5E1",
                                        backgroundColor: verificationMethod === method.value ? "#EFF6FF" : "white",
                                        color: verificationMethod === method.value ? "#2563EB" : "#475569",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "6px",
                                        fontSize: "13px"
                                    }}
                                >
                                    {method.icon}
                                    {method.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#334155", marginBottom: "8px" }}>
                                Nueva contraseña *
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>

                        {requestType === "TRANSFER" && (
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#334155", marginBottom: "8px" }}>
                                    Nombre del nuevo dueño
                                </label>
                                <input
                                    type="text"
                                    value={newOwnerName}
                                    onChange={(e) => setNewOwnerName(e.target.value)}
                                    placeholder="Nombre completo"
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        border: "1px solid #CBD5E1",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#334155", marginBottom: "8px" }}>
                                Notas adicionales
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Detalles de la verificación..."
                                rows={2}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    resize: "vertical",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={() => setStep("ENTER_DETAILS")}
                                style={{
                                    flex: 1,
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    border: "1px solid #CBD5E1",
                                    backgroundColor: "white",
                                    color: "#334155",
                                    fontWeight: 500,
                                    cursor: "pointer"
                                }}
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handleVerifyAndComplete}
                                disabled={loading || !verificationMethod || !newPassword}
                                style={{
                                    flex: 1,
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: (verificationMethod && newPassword) ? "#059669" : "#94A3B8",
                                    color: "white",
                                    fontWeight: 500,
                                    cursor: (verificationMethod && newPassword) ? "pointer" : "not-allowed"
                                }}
                            >
                                {loading ? "Procesando..." : "Confirmar y Completar"}
                            </button>
                        </div>
                    </>
                )}

                {/* Step 4: Complete */}
                {step === "COMPLETE" && (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "50%",
                            backgroundColor: "#D1FAE5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px"
                        }}>
                            <ShieldCheck size={32} style={{ color: "#059669" }} />
                        </div>
                        <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#0F172A", marginBottom: "8px" }}>
                            ¡Completado!
                        </h3>
                        <p style={{ color: "#64748B", marginBottom: "24px", fontSize: "14px" }}>
                            {requestType === "RECOVERY"
                                ? "La contraseña del dueño ha sido actualizada exitosamente."
                                : "La propiedad del negocio ha sido transferida exitosamente."}
                        </p>
                        <button
                            onClick={handleFinish}
                            style={{
                                padding: "12px 32px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: "#2563EB",
                                color: "white",
                                fontWeight: 500,
                                cursor: "pointer"
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
