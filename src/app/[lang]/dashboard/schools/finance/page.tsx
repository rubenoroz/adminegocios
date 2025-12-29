"use client";

import { TemplateManager } from "@/components/schools/template-manager";
import { ScholarshipManager } from "@/components/schools/scholarship-manager";
import { FinancialOverview } from "@/components/schools/financial-overview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SchoolFinancePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Finanzas Escolares</h1>
                <p className="text-muted-foreground">
                    Gestiona plantillas de cobro, becas y genera cobros automáticamente.
                </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="templates">Plantillas</TabsTrigger>
                    <TabsTrigger value="scholarships">Becas</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <FinancialOverview />
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                    <TemplateManager />
                </TabsContent>

                <TabsContent value="scholarships">
                    <ScholarshipManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
