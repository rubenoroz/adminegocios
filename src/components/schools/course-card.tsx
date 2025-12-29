"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, User, Users, Check, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import React from "react";

export interface CourseCardProps {
    course: {
        id: string;
        name: string;
        description: string | null;
        schedule: string | null;
        room: string | null;
        teacher: {
            id: string;
            name: string;
        } | null;
        _count: {
            enrollments: number;
        };
    };
    gradient: string;
    isSelected?: boolean;
    isSelectionMode?: boolean;
    onToggleSelection?: (id: string) => void;
    onDelete?: (id: string) => void;
    customActions?: React.ReactNode;
}

export function CourseCard({
    course,
    gradient,
    isSelected = false,
    isSelectionMode = false,
    onToggleSelection,
    onDelete,
    customActions
}: CourseCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
                flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 relative
                border
                ${isSelected
                    ? 'border-blue-500 shadow-xl ring-2 ring-blue-500/10 z-10'
                    : 'border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/50 hover:-translate-y-1'
                }
                ${isSelectionMode ? 'cursor-pointer' : ''}
            `}
            onClick={() => isSelectionMode && onToggleSelection?.(course.id)}
        >
            {isSelectionMode && (
                <div className="absolute top-3 right-3 z-30">
                    <div className={`w-5 h-5 rounded-md border-2 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'} flex items-center justify-center`}>
                        {isSelected && <Check size={12} strokeWidth={4} />}
                    </div>
                </div>
            )}

            {/* Slim Colored Header Strip */}
            <div className={`h-1.5 bg-gradient-to-r ${gradient} w-full`} />

            {/* Main Content */}
            <div className="p-6 flex flex-col gap-5 flex-1">

                {/* Titles - Increased Hierarchy */}
                <div className="space-y-2">
                    <h3 className="font-bold text-slate-800 text-xl leading-snug tracking-tight line-clamp-2" title={course.name}>
                        {course.name}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed h-[2.5rem]" title={course.description || ""}>
                        {course.description || "Sin descripción disponible para este curso."}
                    </p>
                </div>

                {/* Clean Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent w-full" />

                {/* Implicit Metadata Grid - No Labels */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">

                    <div className="flex items-center gap-2.5 text-slate-600 group hover:text-blue-600 transition-colors" title="Profesor">
                        <div className="w-5 flex justify-center"><User size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" /></div>
                        <span className="truncate font-medium">{course.teacher?.name || "Sin asignar"}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-slate-600" title="Horario">
                        <div className="w-5 flex justify-center"><Clock size={16} className="text-slate-400" /></div>
                        <span className="truncate font-medium">{course.schedule || "--:--"}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-slate-600" title="Salón">
                        <div className="w-5 flex justify-center"><MapPin size={16} className="text-slate-400" /></div>
                        <span className="truncate font-medium">{course.room || "S/A"}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-slate-600" title="Alumnos inscritos">
                        <div className="w-5 flex justify-center"><Users size={16} className="text-slate-400" /></div>
                        <span className="font-medium">{course._count.enrollments} alumnos</span>
                    </div>

                </div>

                {/* Subtle Actions */}
                <div className="mt-auto pt-3 flex justify-between items-center gap-3">
                    {customActions ? customActions : (
                        !isSelectionMode && (
                            <>
                                <Link href={`/dashboard/courses/${course.id}`} onClick={e => e.stopPropagation()} className="flex-1">
                                    <button className="w-full py-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-sm font-bold flex items-center justify-center gap-2 group">
                                        Ver Curso <Eye size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </Link>
                                {onDelete && (
                                    <button
                                        onClick={e => { e.stopPropagation(); onDelete(course.id); }}
                                        className="w-10 h-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center active:scale-95"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </>
                        )
                    )}
                </div>
            </div>
        </motion.div>
    );
}
