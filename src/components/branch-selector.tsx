"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, ChevronDown, Check, Building2 } from "lucide-react";
import { useBranch } from "@/context/branch-context";

export function BranchSelector() {
    const { selectedBranch, branches, setSelectedBranch, loading } = useBranch();
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (loading || !mounted || branches.length === 0) {
        return <div className="w-[180px] h-10" />;
    }

    const handleBranchChange = (branchId: string) => {
        const branch = branches.find(b => b.id === branchId);
        if (branch) {
            setSelectedBranch(branch);
        }
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Trigger Button - Matching the Modules style */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: 'none',
                    borderRadius: '14px',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.45)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.35)';
                }}
            >
                <MapPin size={18} />
                {selectedBranch?.name || "Sucursal"}
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu - Matching the Modules style */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        marginTop: '8px',
                        background: 'white',
                        borderRadius: '20px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                        padding: '12px',
                        minWidth: '240px',
                        zIndex: 100,
                        animation: 'fadeIn 0.15s ease-out'
                    }}
                >
                    <div style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: '#8b5cf6',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        padding: '8px 12px',
                        marginBottom: '4px'
                    }}>
                        Seleccionar Sucursal
                    </div>

                    {branches.map((branch) => {
                        const isSelected = selectedBranch?.id === branch.id;
                        return (
                            <button
                                key={branch.id}
                                onClick={() => handleBranchChange(branch.id)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 14px',
                                    borderRadius: '14px',
                                    border: 'none',
                                    background: isSelected ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)' : 'transparent',
                                    color: isSelected ? '#8b5cf6' : '#475569',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    marginBottom: '4px'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = '#f8fafc';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '10px',
                                    background: isSelected ? '#8b5cf6' : '#e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isSelected ? 'white' : '#64748b',
                                    transition: 'all 0.15s ease'
                                }}>
                                    <Building2 size={16} />
                                </div>
                                <span style={{ flex: 1, textAlign: 'left' }}>{branch.name}</span>
                                {isSelected && <Check size={18} style={{ color: '#8b5cf6' }} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
