"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Grid, List, X, Users, GraduationCap, Briefcase, UserCheck, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface FilterChip {
    label: string;
    value: string;
    color?: string;
    icon?: React.ReactNode;
}

interface ModernFilterBarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
    filters?: FilterChip[];
    activeFilters?: string[];
    onFilterToggle?: (value: string) => void;
    viewMode?: "grid" | "list";
    onViewModeChange?: (mode: "grid" | "list") => void;
    sortOptions?: { label: string; value: string }[];
    sortValue?: string;
    onSortChange?: (value: string) => void;
}

// CSS class mapping for filter chip colors (uses classes from modern-components.css)
const filterColorClasses: Record<string, { inactive: string; active: string }> = {
    MANAGER: { inactive: "filter-chip filter-chip-purple", active: "filter-chip-active filter-chip-active-purple" },
    ADMIN: { inactive: "filter-chip filter-chip-blue", active: "filter-chip-active filter-chip-active-blue" },
    TEACHER: { inactive: "filter-chip filter-chip-emerald", active: "filter-chip-active filter-chip-active-emerald" },
    STAFF: { inactive: "filter-chip filter-chip-orange", active: "filter-chip-active filter-chip-active-orange" },
    default: { inactive: "filter-chip", active: "filter-chip-active filter-chip-active-blue" }
};

// Icon mapping for filter types
const filterIcons: Record<string, React.ReactNode> = {
    MANAGER: <Briefcase size={16} />,
    ADMIN: <UserCheck size={16} />,
    TEACHER: <GraduationCap size={16} />,
    STAFF: <Users size={16} />
};

export function ModernFilterBar({
    searchValue,
    onSearchChange,
    placeholder = "Buscar...",
    filters = [],
    activeFilters = [],
    onFilterToggle,
    viewMode,
    onViewModeChange,
    sortOptions,
    sortValue,
    onSortChange
}: ModernFilterBarProps) {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="space-y-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Search Input - Icon fuera del cuadro */}
                    <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
                        <Search size={16} className="text-slate-400 flex-shrink-0" />
                        <Input
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={placeholder}
                            className="bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-blue-500 h-10"
                            style={{ fontSize: '14px' }}
                        />
                        {searchValue && (
                            <button
                                onClick={() => onSearchChange("")}
                                className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle Button */}
                    {filters.length > 0 && (
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`filter-toggle-button ${showFilters || activeFilters.length > 0 ? 'active' : ''}`}
                        >
                            <Filter size={18} />
                            <span>Filtros</span>
                            {activeFilters.length > 0 && (
                                <span className="badge">
                                    {activeFilters.length}
                                </span>
                            )}
                            <ChevronDown
                                size={16}
                                className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
                            />
                        </button>
                    )}

                    {/* Sort Dropdown */}
                    {sortOptions && sortOptions.length > 0 && (
                        <select
                            value={sortValue}
                            onChange={(e) => onSortChange?.(e.target.value)}
                            className="h-12 px-4 rounded-lg border-2 border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all duration-200 bg-white shadow-sm hover:shadow-md font-semibold text-slate-600 cursor-pointer"
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* View Mode Toggle */}
                    {viewMode && onViewModeChange && (
                        <div className="flex gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 shadow-sm">
                            <button
                                onClick={() => onViewModeChange("grid")}
                                className={`p-2.5 rounded-md transition-all duration-200 ${viewMode === "grid"
                                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
                                    }`}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => onViewModeChange("list")}
                                className={`p-2.5 rounded-md transition-all duration-200 ${viewMode === "list"
                                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
                                    }`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Chips Panel */}
            <AnimatePresence>
                {showFilters && filters.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="flex flex-wrap items-center gap-4 p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/60 shadow-sm">
                            <span className="text-sm font-semibold text-slate-500 pr-4 border-r border-slate-200">Filtrar por:</span>
                            <div className="flex flex-wrap gap-3">
                                {filters.map((filter) => {
                                    const isActive = activeFilters.includes(filter.value);
                                    const colorClasses = filterColorClasses[filter.value] || filterColorClasses.default;
                                    const icon = filterIcons[filter.value];

                                    return (
                                        <motion.button
                                            key={filter.value}
                                            onClick={() => onFilterToggle?.(filter.value)}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            className={isActive ? colorClasses.active : colorClasses.inactive}
                                        >
                                            {icon && <span>{icon}</span>}
                                            {filter.label}
                                            {isActive && (
                                                <X size={14} className="ml-0.5" />
                                            )}
                                        </motion.button>
                                    );
                                })}

                                {activeFilters.length > 0 && (
                                    <button
                                        onClick={() => activeFilters.forEach(f => onFilterToggle?.(f))}
                                        className="filter-chip-clear"
                                    >
                                        <X size={14} />
                                        Limpiar
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

