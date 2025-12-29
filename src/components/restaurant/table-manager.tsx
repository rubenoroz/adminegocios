"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Users, Utensils } from "lucide-react";

export function TableManager() {
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newTable, setNewTable] = useState({ name: "", capacity: "" });

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        const res = await fetch("/api/restaurant/tables");
        const data = await res.json();
        if (Array.isArray(data)) {
            setTables(data);
        } else {
            console.error(data);
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        await fetch("/api/restaurant/tables", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTable)
        });
        setOpen(false);
        setNewTable({ name: "", capacity: "" });
        fetchTables();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Mesas</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Mesa
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agregar Mesa</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre / Número</label>
                                <Input value={newTable.name} onChange={(e) => setNewTable({ ...newTable, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Capacidad (Personas)</label>
                                <Input type="number" value={newTable.capacity} onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate}>Guardar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tables.map(table => (
                    <Card key={table.id} className={`cursor-pointer hover:shadow-md transition-shadow ${table.status === 'OCCUPIED' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                        <CardContent className="p-4 flex flex-col items-center justify-center h-32">
                            <div className="text-xl font-bold mb-2">{table.name}</div>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="w-4 h-4 mr-1" /> {table.capacity}
                            </div>
                            <div className={`mt-2 text-xs font-bold px-2 py-1 rounded-full ${table.status === 'OCCUPIED' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                                {table.status === 'OCCUPIED' ? 'Ocupada' : 'Disponible'}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
