"use client";

import { TableManager } from "@/components/restaurant/table-manager";
import { KitchenDisplay } from "@/components/restaurant/kitchen-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RestaurantPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Restaurante</h1>

            <Tabs defaultValue="tables" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="tables">Mesas</TabsTrigger>
                    <TabsTrigger value="kitchen">Cocina (KDS)</TabsTrigger>
                </TabsList>
                <TabsContent value="tables" className="space-y-4">
                    <TableManager />
                </TabsContent>
                <TabsContent value="kitchen" className="space-y-4">
                    <KitchenDisplay />
                </TabsContent>
            </Tabs>
        </div>
    );
}
