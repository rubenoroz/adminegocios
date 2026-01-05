"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, User, X, Check } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this exists or I'll use simple timeout

// Simple debounce impl inside component if hook doesn't exist
function useLocalDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

interface CustomerSelectorProps {
    onSelect: (customer: any) => void;
    selectedCustomer: any | null;
    onNewCustomer: () => void;
}

export function CustomerSelector({ onSelect, selectedCustomer, onNewCustomer }: CustomerSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const debouncedSearch = useLocalDebounce(searchTerm, 300);

    useEffect(() => {
        if (debouncedSearch.length > 1) {
            setLoading(true);
            fetch(`/api/customers?query=${encodeURIComponent(debouncedSearch)}`)
                .then(res => res.json())
                .then(data => {
                    setCustomers(Array.isArray(data) ? data : []);
                    setLoading(false);
                    setIsOpen(true);
                })
                .catch(err => {
                    console.error(err);
                    setCustomers([]);
                    setLoading(false);
                });
        }
    }, [debouncedSearch]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    if (selectedCustomer) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-sm">{selectedCustomer.name}</p>
                        <p className="text-xs text-slate-500">{selectedCustomer.taxId || "Sin RFC"}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onSelect(null)} className="h-8 w-8 text-blue-400 hover:text-blue-600">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar Cliente / RFC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => { if (customers.length > 0) setIsOpen(true); }}
                        className="pl-9 bg-white"
                    />
                </div>
                <Button onClick={onNewCustomer} className="bg-slate-800 text-white hover:bg-slate-700" title="Nuevo Cliente">
                    <UserPlus className="h-4 w-4" />
                </Button>
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute top-12 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-slate-400">Buscando...</div>
                    ) : customers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-400">No se encontraron clientes</div>
                    ) : (
                        <div>
                            {customers.map(customer => (
                                <div
                                    key={customer.id}
                                    onClick={() => {
                                        onSelect(customer);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-700 text-sm">{customer.name}</p>
                                        <p className="text-xs text-slate-400">{customer.taxId || "Sin RFC"} • {customer.email || "Sin Email"}</p>
                                    </div>
                                    <div className="text-slate-300">
                                        <Check className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
