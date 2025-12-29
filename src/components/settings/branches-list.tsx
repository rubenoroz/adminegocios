"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Branch {
    id: string;
    name: string;
    address: string | null;
}

export function BranchesList({ dict }: { dict: any }) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newBranch, setNewBranch] = useState({ name: "", address: "" });
    const t = dict.branches;

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await fetch("/api/branches");
            const data = await res.json();
            setBranches(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const createBranch = async () => {
        try {
            const res = await fetch("/api/branches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newBranch)
            });

            if (res.ok) {
                setOpen(false);
                setNewBranch({ name: "", address: "" });
                fetchBranches();
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div>{t.loading}</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{t.title}</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {t.add}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t.add}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label>{t.name}</label>
                                <Input
                                    value={newBranch.name}
                                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label>{t.address}</label>
                                <Input
                                    value={newBranch.address}
                                    onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                                />
                            </div>
                            <Button onClick={createBranch} className="w-full">
                                {t.create}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {branches.map((branch) => (
                    <Card key={branch.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {branch.name}
                            </CardTitle>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground mt-2">
                                {branch.address || "No address"}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
