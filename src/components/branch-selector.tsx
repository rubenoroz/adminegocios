"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { useBranch } from "@/context/branch-context";

export function BranchSelector() {
    const { selectedBranch, branches, setSelectedBranch, loading } = useBranch();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (loading || !mounted || branches.length === 0) {
        return <div className="w-[180px] h-10" />;
    }

    const handleBranchChange = (branchId: string) => {
        const branch = branches.find(b => b.id === branchId);
        if (branch) {
            setSelectedBranch(branch);
        }
    };

    return (
        <Select value={selectedBranch?.id || ""} onValueChange={handleBranchChange}>
            <SelectTrigger className="h-11 gap-3 px-4 rounded-xl border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                <MapPin className="h-4 w-4 text-slate-500" />
                <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent align="center" className="bg-white w-[200px] p-3 rounded-xl shadow-lg border-slate-200">
                {branches.map((branch) => (
                    <SelectItem
                        key={branch.id}
                        value={branch.id}
                        className="cursor-pointer py-2 px-3 rounded-md mb-1"
                    >
                        {branch.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
