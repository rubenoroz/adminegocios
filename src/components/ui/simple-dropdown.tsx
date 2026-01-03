"use client";

import { useState, useRef, useEffect } from "react";
import { Search, User, Check } from "lucide-react";

interface SimpleDropdownOption {
    value: string;
    label: string;
}

interface SimpleDropdownProps {
    trigger: React.ReactNode;
    options: SimpleDropdownOption[];
    onSelect: (value: string) => void;
    searchable?: boolean;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
}

export function SimpleDropdown({
    trigger,
    options,
    onSelect,
    searchable = true,
    searchPlaceholder = "Buscar...",
    emptyMessage = "No se encontraron resultados",
    className = ""
}: SimpleDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filtrar opciones basado en búsqueda
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (value: string) => {
        onSelect(value);
        setIsOpen(false);
        setSearchTerm("");
    };

    // Get initials from name
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    // Generate consistent color from string
    const getAvatarColor = (name: string) => {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        ];
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            {/* Dropdown Menu - Modern Glass Effect */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        zIndex: 100,
                        marginTop: '8px',
                        width: '320px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                        overflow: 'hidden',
                        animation: 'dropdownFadeIn 0.2s ease-out'
                    }}
                >
                    {/* Search Input - Modern Style */}
                    {searchable && (
                        <div style={{
                            padding: '16px',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                            background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0) 100%)'
                        }}>
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <Search
                                    style={{
                                        position: 'absolute',
                                        left: '14px',
                                        width: '18px',
                                        height: '18px',
                                        color: '#94a3b8'
                                    }}
                                />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 44px',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '12px',
                                        outline: 'none',
                                        background: 'white',
                                        transition: 'all 0.2s ease',
                                        color: '#1e293b'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#818cf8';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(129, 140, 248, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                    autoFocus
                                />
                            </div>
                            <div style={{
                                marginTop: '8px',
                                fontSize: '12px',
                                color: '#94a3b8',
                                fontWeight: 500
                            }}>
                                {filteredOptions.length} {filteredOptions.length === 1 ? 'alumno disponible' : 'alumnos disponibles'}
                            </div>
                        </div>
                    )}

                    {/* Options List - Modern Cards */}
                    <div style={{
                        maxHeight: '320px',
                        overflowY: 'auto',
                        padding: '8px'
                    }}>
                        {filteredOptions.length === 0 ? (
                            <div style={{
                                padding: '32px 16px',
                                textAlign: 'center'
                            }}>
                                <User style={{
                                    width: '40px',
                                    height: '40px',
                                    color: '#cbd5e1',
                                    margin: '0 auto 12px'
                                }} />
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#64748b'
                                }}>
                                    {emptyMessage}
                                </div>
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 14px',
                                        marginBottom: '4px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        background: highlightedIndex === index
                                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)'
                                            : 'transparent',
                                        border: highlightedIndex === index
                                            ? '1px solid rgba(99, 102, 241, 0.2)'
                                            : '1px solid transparent'
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: getAvatarColor(option.label),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                        flexShrink: 0,
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                                    }}>
                                        {getInitials(option.label)}
                                    </div>

                                    {/* Name */}
                                    <div style={{
                                        flex: 1,
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: '#1e293b',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {option.label}
                                        </div>
                                    </div>

                                    {/* Hover indicator */}
                                    {highlightedIndex === index && (
                                        <div style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '8px',
                                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Check style={{ width: '14px', height: '14px', color: 'white' }} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Animation keyframes */}
            <style jsx global>{`
                @keyframes dropdownFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}
