"use client";

import { useState } from "react";
import { X, Plus, Clock, AlertCircle, Calendar, Info, Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ScheduleEntry {
    id: string;
    days: number[];
    startTime: string;
    endTime: string;
}

interface CourseScheduleSelectorProps {
    value: ScheduleEntry[];
    onChange: (schedules: ScheduleEntry[]) => void;
    classroomId?: string;
    classroomName?: string;
    courseId?: string;
    onConflictCheck?: (schedule: ScheduleEntry) => Promise<{ hasConflict: boolean; conflictingCourse?: string }>;
}

const DAYS = [
    { value: 1, fullName: "Lunes" },
    { value: 2, fullName: "Martes" },
    { value: 3, fullName: "Miércoles" },
    { value: 4, fullName: "Jueves" },
    { value: 5, fullName: "Viernes" },
    { value: 6, fullName: "Sábado" },
    { value: 0, fullName: "Domingo" },
];

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const time24 = `${hour.toString().padStart(2, "0")}:${minute}`;

    // Convert to 12-hour format
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? "AM" : "PM";
    const time12 = `${hour12}:${minute} ${period}`;

    return { value: time24, label: time12 };
});

export function CourseScheduleSelector({
    value,
    onChange,
    classroomId,
    classroomName,
    courseId,
    onConflictCheck,
}: CourseScheduleSelectorProps) {
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [startTime, setStartTime] = useState("08:00");
    const [endTime, setEndTime] = useState("10:00");
    const [isAdding, setIsAdding] = useState(false);
    const [conflict, setConflict] = useState<string | null>(null);

    const toggleDay = (day: number) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
        );
    };

    const addSchedule = async () => {
        if (selectedDays.length === 0) {
            alert("Por favor selecciona al menos un día de la semana");
            return;
        }

        if (startTime >= endTime) {
            alert("La hora de fin debe ser posterior a la hora de inicio");
            return;
        }

        const newSchedule: ScheduleEntry = {
            id: Date.now().toString(),
            days: selectedDays,
            startTime,
            endTime,
        };

        if (classroomId && onConflictCheck) {
            setIsAdding(true);
            const result = await onConflictCheck(newSchedule);
            setIsAdding(false);

            if (result.hasConflict) {
                setConflict(result.conflictingCourse || "Hay un conflicto de horario");
                return;
            }
        }

        onChange([...value, newSchedule]);
        setSelectedDays([]);
        setStartTime("08:00");
        setEndTime("10:00");
        setConflict(null);
    };

    const removeSchedule = (id: string) => {
        onChange(value.filter(s => s.id !== id));
    };

    const getDayFullNames = (days: number[]) => {
        return days
            .map(d => DAYS.find(day => day.value === d)?.fullName)
            .filter(Boolean)
            .join(", ");
    };

    const formatTime = (time24: string) => {
        const [hour, minute] = time24.split(':').map(Number);
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour < 12 ? "AM" : "PM";
        return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <div className="space-y-6">
            {classroomName && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    Configurando horarios para: <span className="font-bold">{classroomName}</span>
                </div>
            )}
            {/* Days Selection */}
            <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                    Días de la semana
                </label>
                <div className="grid grid-cols-1 gap-2.5" style={{ marginTop: '24px' }}>
                    {DAYS.map(day => {
                        const isSelected = selectedDays.includes(day.value);
                        return (
                            <label
                                key={day.value}
                                className={cn(
                                    "flex items-center gap-4 p-3.5 rounded-lg border-2 cursor-pointer transition-all",
                                    isSelected
                                        ? "bg-blue-50 border-blue-500 shadow-sm"
                                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                )}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleDay(day.value)}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                />
                                <span className={cn(
                                    "font-medium text-sm",
                                    isSelected ? "text-blue-900 font-bold" : "text-gray-700"
                                )}>
                                    {day.fullName}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-4" style={{ marginTop: '56px' }}>
                <label className="block text-sm font-semibold text-gray-700">
                    Horario de clase
                </label>
                <div className="grid grid-cols-2 gap-6" style={{ marginTop: '24px' }}>
                    <div className="space-y-2.5">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hora de inicio
                        </label>
                        <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 font-medium appearance-none cursor-pointer hover:border-gray-300 shadow-sm"
                            style={{
                                color: '#111827'
                            }}
                        >
                            {TIME_OPTIONS.map(time => (
                                <option key={time.value} value={time.value} style={{ color: '#111827' }}>
                                    {time.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2.5">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hora de fin
                        </label>
                        <select
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 font-medium appearance-none cursor-pointer hover:border-gray-300 shadow-sm"
                            style={{
                                color: '#111827'
                            }}
                        >
                            {TIME_OPTIONS.map(time => (
                                <option key={time.value} value={time.value} style={{ color: '#111827' }}>
                                    {time.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Conflict warning */}
            {conflict && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between gap-4 p-4 bg-red-50 border-2 border-red-100 rounded-lg shadow-sm"
                    style={{ marginTop: '24px' }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-red-900">Conflicto</p>
                            <p className="text-sm text-red-700 font-medium leading-relaxed">{conflict}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setConflict(null)}
                        className="px-4 py-2 font-semibold text-sm text-white rounded-xl transition-all flex-shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            border: 'none',
                            outline: 'none'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        Entendido
                    </button>
                </motion.div>
            )}

            {!classroomId && !conflict && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm font-medium" style={{ marginTop: '24px' }}>
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <Info className="h-4 w-4" />
                    </div>
                    <span>Selecciona un salón para verificar si hay conflictos con otras clases.</span>
                </div>
            )}

            {/* Add button */}
            <div style={{ marginTop: '48px' }}>
                <button
                    type="button"
                    onClick={addSchedule}
                    disabled={isAdding || selectedDays.length === 0}
                    className="button-modern w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50"
                >
                    {isAdding ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Verificando disponibilidad...
                        </>
                    ) : (
                        <>
                            <Plus className="h-5 w-5" />
                            {selectedDays.length > 0
                                ? `Añadir horario`
                                : 'Selecciona días para continuar'
                            }
                        </>
                    )}
                </button>
            </div>

            {/* Schedule list */}
            {value.length > 0 && (
                <div className="space-y-3 pt-4 border-t-2 border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700">
                        Horarios configurados
                    </label>
                    <div className="space-y-2">
                        {value.map((schedule) => (
                            <div
                                key={schedule.id}
                                className="flex items-center justify-between gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                        {getDayFullNames(schedule.days)}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeSchedule(schedule.id)}
                                    className="px-4 py-2 font-semibold text-sm text-white rounded-xl transition-all"
                                    style={{
                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                        border: 'none',
                                        outline: 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
