"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Utensils, GraduationCap, Briefcase, Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export function OnboardingWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [data, setData] = useState({
        name: "",
        type: "",
        colors: {
            primary: "221 83% 53%", // Default Blue
        }
    });

    const handleNext = () => setStep(step + 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/business", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                router.push("/dashboard");
                router.refresh(); // Refresh to update session with new businessId
            } else {
                alert("Error creating business");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Configura tu Negocio</CardTitle>
                    <CardDescription>Paso {step} de 3</CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label>Nombre del Negocio</label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData({ ...data, name: e.target.value })}
                                    placeholder="Ej. Tienda Don Pepe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label>Tipo de Negocio</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <BusinessTypeButton
                                        icon={Store}
                                        label="Tienda"
                                        selected={data.type === "RETAIL"}
                                        onClick={() => setData({ ...data, type: "RETAIL" })}
                                    />
                                    <BusinessTypeButton
                                        icon={Utensils}
                                        label="Restaurante"
                                        selected={data.type === "RESTAURANT"}
                                        onClick={() => setData({ ...data, type: "RESTAURANT" })}
                                    />
                                    <BusinessTypeButton
                                        icon={GraduationCap}
                                        label="Escuela"
                                        selected={data.type === "SCHOOL"}
                                        onClick={() => setData({ ...data, type: "SCHOOL" })}
                                    />
                                    <BusinessTypeButton
                                        icon={Briefcase}
                                        label="Servicios"
                                        selected={data.type === "SERVICE"}
                                        onClick={() => setData({ ...data, type: "SERVICE" })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <Palette className="w-12 h-12 mx-auto text-primary mb-2" />
                                <h3 className="text-lg font-medium">Personaliza tu marca</h3>
                                <p className="text-sm text-muted-foreground">Elige el color principal de tu sistema.</p>
                            </div>

                            <div className="grid grid-cols-5 gap-4">
                                {[
                                    { name: "Blue", value: "221 83% 53%", bg: "bg-blue-600" },
                                    { name: "Red", value: "0 84.2% 60.2%", bg: "bg-red-600" },
                                    { name: "Green", value: "142.1 76.2% 36.3%", bg: "bg-green-600" },
                                    { name: "Orange", value: "24.6 95% 53.1%", bg: "bg-orange-600" },
                                    { name: "Purple", value: "262.1 83.3% 57.8%", bg: "bg-purple-600" },
                                ].map((color) => (
                                    <button
                                        key={color.name}
                                        className={cn(
                                            "w-12 h-12 rounded-full ring-offset-2 transition-all",
                                            color.bg,
                                            data.colors.primary === color.value ? "ring-2 ring-primary scale-110" : "hover:scale-105"
                                        )}
                                        onClick={() => setData({ ...data, colors: { primary: color.value } })}
                                    />
                                ))}
                            </div>

                            <div className="p-4 border rounded-lg bg-muted/20">
                                <h4 className="text-sm font-medium mb-2">Vista previa</h4>
                                <Button style={{ backgroundColor: `hsl(${data.colors.primary})` }}>Botón Principal</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center space-y-4">
                            <div className="p-6 bg-green-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                                <Check className="w-12 h-12 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold">¡Todo listo!</h3>
                            <p className="text-muted-foreground">
                                Hemos configurado tu entorno para <strong>{data.name}</strong>.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    {step > 1 && step < 3 && (
                        <Button variant="ghost" onClick={() => setStep(step - 1)}>Atrás</Button>
                    )}
                    {step === 1 && (
                        <Button className="ml-auto" onClick={handleNext} disabled={!data.name || !data.type}>Siguiente</Button>
                    )}
                    {step === 2 && (
                        <Button className="ml-auto" onClick={handleNext}>Siguiente</Button>
                    )}
                    {step === 3 && (
                        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                            {loading ? "Configurando..." : "Ir al Dashboard"}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

function BusinessTypeButton({ icon: Icon, label, selected, onClick }: any) {
    return (
        <Button
            variant={selected ? "default" : "outline"}
            className={cn("h-24 flex flex-col items-center justify-center gap-2", selected && "ring-2 ring-primary ring-offset-2")}
            onClick={onClick}
        >
            <Icon className="w-6 h-6" />
            <span className="text-sm">{label}</span>
        </Button>
    );
}
