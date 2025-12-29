"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Store, Utensils, GraduationCap, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

type BusinessType = "store" | "restaurant" | "school" | "service";

export function DiagnosisForm({ dict }: { dict: any }) {
    const [step, setStep] = useState(1);
    const [type, setType] = useState<BusinessType | null>(null);
    const [employees, setEmployees] = useState<string>("");

    const handleNext = () => setStep(step + 1);

    return (
        <section id="diagnostico" className="diagnosis-container w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6 max-w-3xl mx-auto">
                <Card className="diagnosis-card">
                    <CardHeader>
                        <CardTitle>{dict.title}</CardTitle>
                        <CardDescription>
                            {dict.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 1 && (
                            <div className="space-y-4">
                                <h3 className="font-medium">{dict.businessType}</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <BusinessTypeButton
                                        icon={Store}
                                        label={dict.store}
                                        selected={type === "store"}
                                        onClick={() => setType("store")}
                                    />
                                    <BusinessTypeButton
                                        icon={Utensils}
                                        label={dict.restaurant}
                                        selected={type === "restaurant"}
                                        onClick={() => setType("restaurant")}
                                    />
                                    <BusinessTypeButton
                                        icon={GraduationCap}
                                        label={dict.school}
                                        selected={type === "school"}
                                        onClick={() => setType("school")}
                                    />
                                    <BusinessTypeButton
                                        icon={Briefcase}
                                        label={dict.service}
                                        selected={type === "service"}
                                        onClick={() => setType("service")}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <h3 className="font-medium">¿Cuántos empleados tienes?</h3>
                                <Input
                                    type="number"
                                    placeholder="Ej. 5"
                                    value={employees}
                                    onChange={(e) => setEmployees(e.target.value)}
                                />
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4 text-center">
                                <h3 className="text-xl font-bold text-primary">¡Tenemos un plan para ti!</h3>
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="font-medium text-lg">
                                        {employees && parseInt(employees) > 50 ? "Plan Enterprise" : "Plan Pro"}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Ideal para {type === "store" ? "comercios" : type === "restaurant" ? "restaurantes" : "empresas"} en crecimiento.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        {step > 1 && step < 3 && (
                            <Button variant="outline" onClick={() => setStep(step - 1)}>Atrás</Button>
                        )}
                        {step < 3 ? (
                            <Button className="ml-auto" onClick={handleNext} disabled={step === 1 ? !type : !employees}>
                                Siguiente
                            </Button>
                        ) : (
                            <Button className="w-full" onClick={() => window.location.href = '/register'}>
                                {dict.submit}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </section>
    );
}

function BusinessTypeButton({ icon: Icon, label, selected, onClick }: any) {
    return (
        <Button
            variant={selected ? "default" : "outline"}
            className={cn("h-24 flex flex-col gap-2", selected && "border-primary")}
            onClick={onClick}
        >
            <Icon className="h-6 w-6" />
            {label}
        </Button>
    );
}
