"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, User, Building2 } from "lucide-react";

interface CustomerFiscalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: any) => void;
    initialData?: any; // If editing
}

export function CustomerFiscalModal({ isOpen, onClose, onSave, initialData }: CustomerFiscalModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        taxId: "", // RFC
        legalName: "", // Razón Social
        taxRegime: "", // Régimen
        taxZipCode: "",
        cfdiUse: "G03", // Default Gastos en general
        taxEmail: ""
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || "",
                    email: initialData.email || "",
                    phone: initialData.phone || "",
                    taxId: initialData.taxId || "",
                    legalName: initialData.legalName || "",
                    taxRegime: initialData.taxRegime || "",
                    taxZipCode: initialData.taxZipCode || "",
                    cfdiUse: initialData.cfdiUse || "G03",
                    taxEmail: initialData.taxEmail || ""
                });
            } else {
                setFormData({
                    name: "", email: "", phone: "",
                    taxId: "", legalName: "", taxRegime: "", taxZipCode: "",
                    cfdiUse: "G03", taxEmail: ""
                });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // If we have an ID, it's an update (TODO: Implement Update Endpoint or handle here)
            // For Phase 1, we focus on CREATING new customers from POS for speed.
            const url = "/api/customers";
            const method = "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Error saving customer");

            const savedCustomer = await res.json();
            onSave(savedCustomer);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al guardar cliente. Verifique los datos.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-[700px] border-none shadow-2xl p-0"
                style={{
                    borderRadius: '24px',
                    background: '#ffffff',
                    overflow: 'hidden',
                    maxHeight: '90vh',
                    padding: '0 !important'
                }}
            >
                {/* Header con Gradiente */}
                <div style={{
                    padding: '24px 32px',
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    color: 'white'
                }}>
                    <DialogTitle style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        marginBottom: '8px',
                        color: 'white'
                    }}>
                        {initialData ? "Editar Cliente" : "Nuevo Cliente"}
                    </DialogTitle>
                    <p style={{ opacity: 0.8, fontSize: '14px', margin: 0 }}>
                        Ingresa los datos fiscales para facturación.
                    </p>
                </div>

                <div style={{ padding: '32px', overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
                    <form onSubmit={handleSubmit} id="fiscal-form">
                        {/* Seccion Contacto */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '20px',
                                paddingBottom: '12px',
                                borderBottom: '2px solid #f1f5f9'
                            }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: '#eff6ff', color: '#3b82f6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <User size={18} />
                                </div>
                                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                    Datos de Contacto
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                                        Nombre Completo *
                                    </label>
                                    <Input
                                        required
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Ej. Juán Pérez"
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        style={{ fontSize: '15px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                                        Teléfono
                                    </label>
                                    <Input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="55 1234 5678"
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        style={{ fontSize: '15px' }}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                                        Correo Electrónico
                                    </label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="juan@ejemplo.com"
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        style={{ fontSize: '15px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Seccion Fiscal */}
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '20px',
                                paddingBottom: '12px',
                                borderBottom: '2px solid #f1f5f9'
                            }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: '#f5f3ff', color: '#7c3aed',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Building2 size={18} />
                                </div>
                                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                    Datos Fiscales
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                                        RFC
                                    </label>
                                    <Input
                                        name="taxId"
                                        value={formData.taxId}
                                        onChange={handleChange}
                                        placeholder="XAXX010101000"
                                        className="uppercase h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-mono"
                                        style={{ fontSize: '15px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                                        Razón Social
                                    </label>
                                    <Input
                                        name="legalName"
                                        value={formData.legalName}
                                        onChange={handleChange}
                                        placeholder="Razón Social Oficial"
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        style={{ fontSize: '15px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                                        Régimen (Código)
                                    </label>
                                    <Input
                                        name="taxRegime"
                                        value={formData.taxRegime}
                                        onChange={handleChange}
                                        placeholder="Ej. 601"
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        style={{ fontSize: '15px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                                        Código Postal
                                    </label>
                                    <Input
                                        name="taxZipCode"
                                        value={formData.taxZipCode}
                                        onChange={handleChange}
                                        placeholder="00000"
                                        maxLength={5}
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        style={{ fontSize: '15px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                                        Uso CFDI
                                    </label>
                                    <select
                                        name="cfdiUse"
                                        value={formData.cfdiUse}
                                        onChange={handleChange}
                                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus:bg-white transition-all"
                                        style={{ fontSize: '15px' }}
                                    >
                                        <option value="G03">G03 - Gastos en general</option>
                                        <option value="P01">P01 - Por definir</option>
                                        <option value="D01">D01 - Honorarios médicos</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                                        Email Facturas
                                    </label>
                                    <Input
                                        type="email"
                                        name="taxEmail"
                                        value={formData.taxEmail}
                                        onChange={handleChange}
                                        placeholder="facturas@empresa.com"
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        style={{ fontSize: '15px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Sticky */}
                <div style={{
                    padding: '24px 32px',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <Button
                        type="button"
                        onClick={onClose}
                        style={{
                            height: '48px',
                            padding: '0 24px',
                            borderRadius: '12px',
                            background: 'white',
                            border: '2px solid #e2e8f0',
                            color: '#64748b',
                            fontSize: '14px',
                            fontWeight: 600
                        }}
                    >
                        Cancelar
                    </Button>
                    <button
                        form="fiscal-form"
                        type="submit"
                        disabled={isLoading}
                        style={{
                            height: '48px',
                            padding: '0 32px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                            border: 'none',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                        Guardar Cliente
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
