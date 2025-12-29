"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, UserPlus, Clock, FileSpreadsheet, Calendar } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";

interface Schedule {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
}

interface Classroom {
    id: string;
    name: string;
}

interface GroupedSchedule {
    ids: string[];
    days: number[];
    dayLabel: string;
    startTime: string;
    endTime: string;
    room?: string;
}

const DAYS = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
    { value: 0, label: "Domingo" },
];

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday

function getDayLabel(dayValue: number): string {
    return DAYS.find(d => d.value === dayValue)?.label || "";
}

function groupSchedules(schedules: Schedule[]): GroupedSchedule[] {
    // Group by time and room
    const groups: { [key: string]: Schedule[] } = {};

    schedules.forEach(schedule => {
        const key = `${schedule.startTime}-${schedule.endTime}-${schedule.room || ""}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(schedule);
    });

    const result: GroupedSchedule[] = [];

    Object.values(groups).forEach(group => {
        const days = group.map(s => s.dayOfWeek).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
        const ids = group.map(s => s.id);

        // Check if days are consecutive weekdays (Mon-Fri)
        const isConsecutiveWeekdays = days.length >= 2 && days.every(d => d >= 1 && d <= 5);
        let dayLabel = "";

        if (isConsecutiveWeekdays && days.length === 5 &&
            days.includes(1) && days.includes(2) && days.includes(3) && days.includes(4) && days.includes(5)) {
            dayLabel = "Lunes a Viernes";
        } else if (days.length > 2) {
            // Check for consecutive range
            const sorted = [...days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
            const isConsecutive = sorted.every((day, i) => {
                if (i === 0) return true;
                return DAY_ORDER.indexOf(day) === DAY_ORDER.indexOf(sorted[i - 1]) + 1;
            });

            if (isConsecutive) {
                dayLabel = `${getDayLabel(sorted[0])} a ${getDayLabel(sorted[sorted.length - 1])}`;
            } else {
                dayLabel = days.map(getDayLabel).join(", ");
            }
        } else {
            dayLabel = days.map(getDayLabel).join(", ");
        }

        result.push({
            ids,
            days,
            dayLabel,
            startTime: group[0].startTime,
            endTime: group[0].endTime,
            room: group[0].room
        });
    });

    return result;
}

interface CourseScheduleManagerProps {
    onUpdate?: () => void;
}

export function CourseScheduleManager({ onUpdate }: CourseScheduleManagerProps) {
    const params = useParams();
    const { selectedBranch } = useBranch();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [newSchedule, setNewSchedule] = useState({
        selectedDays: [] as number[],
        startTime: "09:00",
        endTime: "10:00",
        room: ""
    });

    const fetchSchedules = async () => {
        try {
            const res = await fetch(`/api/courses/${params.courseId}/schedules`);
            if (res.ok) {
                const data = await res.json();
                setSchedules(data);
            }
        } catch (error) {
            console.error("Error fetching schedules:", error);
        }
    };

    const fetchClassrooms = async () => {
        try {
            const res = await fetch("/api/classrooms");
            if (res.ok) {
                const data = await res.json();
                setClassrooms(data);
            }
        } catch (error) {
            console.error("Error fetching classrooms:", error);
        }
    };

    useEffect(() => {
        if (params.courseId) {
            fetchSchedules();
        }
        fetchClassrooms();
    }, [params.courseId]);

    const handleAdd = async () => {
        if (!selectedBranch?.businessId) return;
        if (newSchedule.selectedDays.length === 0) {
            toast({ title: "Selecciona al menos un día", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            console.log("Creating schedules for days:", newSchedule.selectedDays);
            console.log("Schedule data:", {
                startTime: newSchedule.startTime,
                endTime: newSchedule.endTime,
                room: newSchedule.room,
                businessId: selectedBranch.businessId,
                courseId: params.courseId
            });

            const conflictDays: { day: number; conflicts: Array<{ courseName: string; time: string; room: string }> }[] = [];
            const successDays: number[] = [];
            const duplicateDays: { day: number; message: string }[] = [];

            for (const day of newSchedule.selectedDays) {
                const res = await fetch(`/api/courses/${params.courseId}/schedules`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        dayOfWeek: day,
                        startTime: newSchedule.startTime,
                        endTime: newSchedule.endTime,
                        room: newSchedule.room,
                        businessId: selectedBranch.businessId
                    })
                });

                if (res.status === 400) {
                    // Duplicate schedule detected for same course
                    const errorData = await res.json();
                    if (errorData.isDuplicate) {
                        duplicateDays.push({ day, message: errorData.message });
                        continue;
                    }
                } else if (res.status === 409) {
                    // Room conflict with another course
                    const conflictData = await res.json();
                    conflictDays.push({ day, conflicts: conflictData.conflicts });
                } else if (!res.ok) {
                    const errorText = await res.text();
                    console.error(`Error creating schedule for day ${day}:`, res.status, errorText);
                    throw new Error(`Failed to create schedule: ${errorText}`);
                } else {
                    successDays.push(day);
                }
            }

            // Show single alert for all duplicates
            if (duplicateDays.length > 0) {
                const duplicateList = duplicateDays
                    .map(d => `• ${getDayLabel(d.day)}`)
                    .join("\n");
                alert(
                    `⚠️ HORARIOS DUPLICADOS\n\n` +
                    `Los siguientes días ya tienen este horario registrado:\n\n` +
                    `${duplicateList}\n\n` +
                    `Estos horarios no se crearán.`
                );
            }

            // If there are conflicts, ask user to confirm
            if (conflictDays.length > 0) {
                const dayNames = conflictDays.map(c => getDayLabel(c.day)).join(", ");
                const conflictDetails = conflictDays.flatMap(c =>
                    c.conflicts.map(conf => `${getDayLabel(c.day)}: ${conf.courseName} (${conf.time})`)
                ).join("\n");

                const confirmCreate = confirm(
                    `⚠️ ADVERTENCIA: Conflicto de salón detectado\n\n` +
                    `Los siguientes horarios ya ocupan el salón "${newSchedule.room}":\n\n` +
                    `${conflictDetails}\n\n` +
                    `¿Deseas crear el horario de todos modos?`
                );

                if (confirmCreate) {
                    // Force create the conflicting schedules
                    for (const { day } of conflictDays) {
                        const res = await fetch(`/api/courses/${params.courseId}/schedules`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                dayOfWeek: day,
                                startTime: newSchedule.startTime,
                                endTime: newSchedule.endTime,
                                room: newSchedule.room,
                                businessId: selectedBranch.businessId,
                                forceCreate: true
                            })
                        });

                        if (!res.ok) {
                            const errorText = await res.text();
                            throw new Error(`Failed to create schedule: ${errorText}`);
                        }
                    }
                    successDays.push(...conflictDays.map(c => c.day));
                }
            }

            if (successDays.length > 0) {
                console.log("Created schedules for days:", successDays);
                fetchSchedules();
                setNewSchedule({ ...newSchedule, selectedDays: [], room: "" });
                toast({ title: `${successDays.length} horario(s) agregado(s)` });
                onUpdate?.(); // Refresh parent KPI cards
            } else if (conflictDays.length > 0) {
                toast({ title: "No se crearon horarios", variant: "destructive" });
            }

        } catch (error) {
            console.error("Error adding schedule:", error);
            toast({ title: "Error al agregar horario", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (dayValue: number) => {
        setNewSchedule(prev => {
            const days = prev.selectedDays.includes(dayValue)
                ? prev.selectedDays.filter(d => d !== dayValue)
                : [...prev.selectedDays, dayValue];
            return { ...prev, selectedDays: days };
        });
    };

    const handleDeleteGroup = async (ids: string[]) => {
        if (!confirm(`¿Eliminar ${ids.length > 1 ? "estos horarios" : "este horario"}?`)) return;

        try {
            await Promise.all(ids.map(id =>
                fetch(`/api/schedules/${id}`, { method: "DELETE" })
            ));

            setSchedules(schedules.filter(s => !ids.includes(s.id)));
            toast({ title: "Horario(s) eliminado(s)" });
            onUpdate?.(); // Refresh parent KPI cards
        } catch (error) {
            console.error("Error deleting schedules:", error);
            toast({ title: "Error al eliminar horario", variant: "destructive" });
        }
    };

    const groupedSchedules = groupSchedules(schedules);

    const handleExport = () => {
        if (!selectedBranch?.businessId) return;
        window.open(`/api/exports/schedules?businessId=${selectedBranch.businessId}`, '_blank');
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={handleExport}
                    className="button-modern gradient-blue flex items-center gap-2 py-2 px-6 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar Excel
                </button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Agregar Horario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Days Selection */}
                    <div className="space-y-4">
                        <Label>Días de la semana</Label>
                        <div className="grid grid-cols-4 gap-3">
                            {DAYS.map(day => (
                                <label
                                    key={day.value}
                                    htmlFor={`day-${day.value}`}
                                    className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <Checkbox
                                        id={`day-${day.value}`}
                                        checked={newSchedule.selectedDays.includes(day.value)}
                                        onCheckedChange={() => toggleDay(day.value)}
                                    />
                                    <span className="cursor-pointer font-medium text-slate-700">
                                        {day.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Time, Room, and Button - Custom widths */}
                    <div
                        className="items-end"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '120px 120px 1fr 100px',
                            gap: '16px'
                        }}
                    >
                        <div className="space-y-2">
                            <Label>Inicio</Label>
                            <Input
                                type="time"
                                value={newSchedule.startTime}
                                onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fin</Label>
                            <Input
                                type="time"
                                value={newSchedule.endTime}
                                onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Salón</Label>
                            <Select
                                value={newSchedule.room}
                                onValueChange={(v) => setNewSchedule({ ...newSchedule, room: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classrooms.map(classroom => (
                                        <SelectItem key={classroom.id} value={classroom.name}>
                                            {classroom.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="invisible">Acción</Label>
                            <button
                                onClick={handleAdd}
                                disabled={loading}
                                style={{ borderRadius: '8px' }}
                                className="button-modern w-full h-9 gradient-blue text-sm disabled:opacity-50"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>


            {/* Grouped Schedule Display */}
            {groupedSchedules.length === 0 ? (
                <Card className="rounded-2xl">
                    <CardContent className="py-12 text-center text-slate-400">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No hay horarios registrados</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3" style={{ marginTop: '30px' }}>
                    {groupedSchedules.map((group, index) => (
                        <Card key={index} className="rounded-xl border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                            <CardContent
                                className="py-4 px-6"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr 1fr 80px',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}
                            >
                                {/* Column 1: Days */}
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className="font-bold text-slate-800">
                                        {group.dayLabel}
                                    </span>
                                </div>
                                {/* Column 2: Time */}
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-600 font-medium">
                                        {group.startTime} - {group.endTime}
                                    </span>
                                </div>
                                {/* Column 3: Room */}
                                <div>
                                    {group.room ? (
                                        <span className="text-sm bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-medium">
                                            {group.room}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-slate-300">—</span>
                                    )}
                                </div>
                                {/* Column 4: Delete */}
                                <button
                                    onClick={() => handleDeleteGroup(group.ids)}
                                    className="button-modern-sm gradient-red py-1.5 px-4 text-xs"
                                    title="Eliminar horario"
                                >
                                    Eliminar
                                </button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

