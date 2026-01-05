"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface BusinessFormProps {
    business: {
        id: string;
        name: string;
        type: string;
        taxId?: string | null;
        legalName?: string | null;
        taxRegime?: string | null;
        taxZipCode?: string | null;
    };
    lang: string;
}

import Link from "next/link";
import { Settings } from "lucide-react";

export function BusinessForm({ business, lang }: BusinessFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    // ... existing state ...
    const [isLoading, setIsLoading] = useState(false);

    // We keep general info (name) and tax info in the same form for simplicity
    const [formData, setFormData] = useState({
        name: business.name,
        taxId: business.taxId || "",
        legalName: business.legalName || "",
        taxRegime: business.taxRegime || "",
        taxZipCode: business.taxZipCode || ""
    });

    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const isChanged =
            formData.name !== business.name ||
            formData.taxId !== (business.taxId || "") ||
            formData.legalName !== (business.legalName || "") ||
            formData.taxRegime !== (business.taxRegime || "") ||
            formData.taxZipCode !== (business.taxZipCode || "");
        setIsDirty(isChanged);
    }, [formData, business]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/business", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to update business");

            toast({
                title: "Actualizado",
                description: "Información del negocio actualizada correctamente.",
            });
            setIsDirty(false); // Reset dirty
            router.refresh();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudo actualizar la información.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nombre Comercial</label>
                    <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="bg-slate-50"
                        placeholder="Ej. Mi Tienda"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tipo de Negocio</label>
                    <Input
                        value={business.type}
                        disabled
                        className="bg-slate-100/50 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400">El tipo de negocio no se puede cambiar.</p>
                </div>
            </div>

            <div className="border-t border-slate-100 pt-8 mb-12">
                <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-6">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    Datos Fiscales (Para Facturación)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">RFC</label>
                        <Input
                            name="taxId"
                            value={formData.taxId}
                            onChange={handleChange}
                            placeholder="XAXX010101000"
                            className="uppercase"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Razón Social</label>
                        <Input
                            name="legalName"
                            value={formData.legalName}
                            onChange={handleChange}
                            placeholder="Nombre legal de la empresa"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Régimen Fiscal</label>
                        <Input
                            name="taxRegime"
                            value={formData.taxRegime}
                            onChange={handleChange}
                            placeholder="Ej. 601 - General de Ley"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Código Postal Fiscal</label>
                        <Input
                            name="taxZipCode"
                            value={formData.taxZipCode}
                            onChange={handleChange}
                            placeholder="00000"
                            maxLength={5}
                        />
                    </div>
                </div>
            </div>

            {/* Unified Footer Actions */}
            <div className="flex items-center justify-between w-full pt-10 mt-4 border-t border-slate-100">
                {/* Left: Manage Branches */}
                <Link
                    href={`/${lang}/dashboard/settings/branches`}
                    className="button-modern bg-blue-600 hover:bg-blue-700 flex items-center gap-2 text-white shadow-md"
                >
                    <Settings className="h-4 w-4" />
                    Gestionar Sucursales
                </Link>

                {/* Right: Save Action */}
                <div>
                    {isDirty ? (
                        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
                            <span className="text-sm text-amber-600 font-medium hidden sm:inline-block">
                                Hay cambios sin guardar
                            </span>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="button-modern bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 text-white shadow-md"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            disabled
                            variant="ghost"
                            className="button-modern bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center gap-2 border border-slate-200 shadow-none"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Sin cambios pendientes
                        </Button>
                    )}
                </div>
            </div>
        </form>
    );
}
