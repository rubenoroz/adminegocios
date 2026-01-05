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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* General Info */}
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                            <User className="h-4 w-4 text-slate-500" />
                            Datos de Contacto
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Nombre *</label>
                                <Input required name="name" value={formData.name} onChange={handleChange} placeholder="Juán Pérez" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Teléfono</label>
                                <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="55 1234 5678" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium mb-1 block">Email</label>
                                <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="juan@ejemplo.com" />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4"></div>

                    {/* Fiscal Info */}
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                            <Building2 className="h-4 w-4 text-slate-500" />
                            Datos Fiscales (Facturación)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">RFC</label>
                                <Input name="taxId" value={formData.taxId} onChange={handleChange} placeholder="XAXX010101000" className="uppercase" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Razón Social</label>
                                <Input name="legalName" value={formData.legalName} onChange={handleChange} placeholder="Juán Pérez S.A. de C.V." />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Régimen Fiscal</label>
                                <Input name="taxRegime" value={formData.taxRegime} onChange={handleChange} placeholder="Ej. 601" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">CP Fiscal</label>
                                <Input name="taxZipCode" value={formData.taxZipCode} onChange={handleChange} placeholder="00000" maxLength={5} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Uso CFDI</label>
                                <select
                                    name="cfdiUse"
                                    value={formData.cfdiUse}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="G03">G03 - Gastos en general</option>
                                    <option value="P01">P01 - Por definir</option>
                                    <option value="D01">D01 - Honorarios médicos</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Email Fiscal</label>
                                <Input type="email" name="taxEmail" value={formData.taxEmail} onChange={handleChange} placeholder="facturas@ejemplo.com" />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />}
                            Guardar Cliente
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
