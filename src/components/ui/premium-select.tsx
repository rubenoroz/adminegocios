"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface PremiumSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    label?: string;
    className?: string;
    disabled?: boolean;
    inline?: boolean; // If true, renders dropdown inline instead of portal (for use inside modals)
}

export function PremiumSelect({
    value,
    onValueChange,
    options,
    placeholder = "Seleccionar...",
    label,
    className,
    disabled = false,
    inline = false
}: PremiumSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Calculate dropdown position (only for portal mode)
    useLayoutEffect(() => {
        if (isOpen && triggerRef.current && !inline) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen, inline]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Check if click is inside dropdown or trigger
            const isInsideDropdown = dropdownRef.current?.contains(target);
            const isInsideTrigger = triggerRef.current?.contains(target);
            const isInsideContainer = containerRef.current?.contains(target);

            if (!isInsideDropdown && !isInsideTrigger && !isInsideContainer) {
                setIsOpen(false);
            }
        };

        // Use 'click' instead of 'mousedown' to allow button clicks to complete first
        document.addEventListener('click', handleClickOutside, true);
        return () => document.removeEventListener('click', handleClickOutside, true);
    }, [isOpen]);

    // Close on scroll (only for portal mode)
    useEffect(() => {
        if (isOpen && !inline) {
            const handleScroll = () => setIsOpen(false);
            window.addEventListener('scroll', handleScroll, true);
            return () => window.removeEventListener('scroll', handleScroll, true);
        }
    }, [isOpen, inline]);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (optValue: string) => {
        onValueChange(optValue);
        setIsOpen(false);
    };

    const dropdownContent = (
        <div
            ref={dropdownRef}
            data-premium-select-dropdown="true"
            onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling
            style={{
                position: inline ? 'absolute' : 'fixed',
                top: inline ? '100%' : position.top,
                left: inline ? 0 : position.left,
                width: inline ? '100%' : position.width,
                marginTop: inline ? '8px' : 0,
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                padding: '12px',
                zIndex: 999999,
                maxHeight: '300px',
                overflowY: 'auto'
            }}
        >
            {label && (
                <div style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: '#8b5cf6',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    padding: '8px 12px',
                    marginBottom: '4px'
                }}>
                    {label}
                </div>
            )}

            {options.map((option) => {
                const isSelected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelect(option.value);
                        }}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '14px',
                            border: 'none',
                            background: isSelected
                                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                                : 'transparent',
                            color: isSelected ? '#8b5cf6' : '#475569',
                            fontWeight: isSelected ? 600 : 500,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            marginBottom: '4px',
                            textAlign: 'left'
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
                        {option.icon && (
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                background: isSelected ? '#8b5cf6' : '#e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isSelected ? 'white' : '#64748b',
                                transition: 'all 0.15s ease',
                                flexShrink: 0
                            }}>
                                {option.icon}
                            </div>
                        )}
                        <span style={{ flex: 1 }}>{option.label}</span>
                        {isSelected && (
                            <Check size={18} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                        )}
                    </button>
                );
            })}

            {options.length === 0 && (
                <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '14px'
                }}>
                    Sin opciones disponibles
                </div>
            )}
        </div>
    );

    return (
        <div ref={containerRef} className={cn("relative", className)} style={{ position: 'relative' }}>
            {/* Trigger Button */}
            <button
                ref={triggerRef}
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!disabled) setIsOpen(!isOpen);
                }}
                disabled={disabled}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '14px',
                    color: selectedOption ? '#1e293b' : '#94a3b8',
                    fontWeight: 500,
                    fontSize: '14px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: disabled ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.backgroundColor = 'white';
                    }
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown
                    size={18}
                    style={{
                        flexShrink: 0,
                        color: '#64748b',
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                inline
                    ? dropdownContent
                    : (mounted && createPortal(dropdownContent, document.body))
            )}
        </div>
    );
}
