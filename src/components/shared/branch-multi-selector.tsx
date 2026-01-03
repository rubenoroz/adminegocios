"use client";

import { Check } from "lucide-react";
import { useBranch } from "@/context/branch-context";

interface BranchMultiSelectorProps {
    selectedBranchIds: string[];
    onChange: (ids: string[]) => void;
    label?: string;
    helperText?: string;
}

export function BranchMultiSelector({
    selectedBranchIds,
    onChange,
    label = "Sucursales Asignadas",
    helperText = "Si no seleccionas ninguna, será visible en todas las sucursales (Global)."
}: BranchMultiSelectorProps) {
    const { branches } = useBranch();

    const toggleBranch = (branchId: string) => {
        if (selectedBranchIds.includes(branchId)) {
            onChange(selectedBranchIds.filter(id => id !== branchId));
        } else {
            onChange([...selectedBranchIds, branchId]);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '4px'
            }}>
                {label}
            </label>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
            }}>
                {branches.map(branch => {
                    const isSelected = selectedBranchIds.includes(branch.id);
                    return (
                        <div
                            key={branch.id}
                            onClick={() => toggleBranch(branch.id)}
                            style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid #000000' : '2px solid #D1D5DB',
                                backgroundColor: isSelected ? '#F3F4F6' : '#FFFFFF',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {/* CHECKBOX - Using inline styles for guaranteed visibility */}
                            <div style={{
                                width: '24px',
                                height: '24px',
                                minWidth: '24px',
                                borderRadius: '6px',
                                border: isSelected ? '2px solid #000000' : '2px solid #6B7280',
                                backgroundColor: isSelected ? '#000000' : '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}>
                                {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                            </div>
                            <span style={{
                                fontWeight: 600,
                                fontSize: '14px',
                                color: '#1F2937'
                            }}>
                                {branch.name}
                            </span>
                        </div>
                    );
                })}
            </div>
            {helperText && (
                <p style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    marginTop: '4px',
                    paddingLeft: '2px'
                }}>
                    {helperText}
                </p>
            )}
        </div>
    );
}
