"use client";

import { Calendar, Clock, MapPin, Users, Plus, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Schedule {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
    classroom?: { name: string };
    groupName?: string;
    enrollments?: any[];
}

interface CourseGroupsListProps {
    schedules: Schedule[];
    courseId: string;
}

const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function CourseGroupsList({ schedules, courseId }: CourseGroupsListProps) {
    if (!schedules || schedules.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <div className="flex flex-col items-center gap-4">
                    <Calendar size={48} className="text-slate-200" />
                    <p>No hay grupos/horarios asignados a este curso.</p>
                    <Link href="/dashboard/school?section=academico&tab=calendario">
                        <Button variant="outline">Ir al Calendario</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Grouping logic
    const groups: { [key: string]: { name: string, schedules: Schedule[], totalStudents: number, room: string } } = {};

    schedules.forEach(s => {
        const groupName = s.groupName || "Grupo General"; // Fallback name
        if (!groups[groupName]) {
            // Prefer classroom name if available
            const roomName = s.classroom?.name || s.room || "Sin aula asignada";
            groups[groupName] = {
                name: groupName,
                schedules: [],
                totalStudents: 0,
                room: roomName
            };
        }
        groups[groupName].schedules.push(s);
    });

    // Calculate unique students per group
    Object.values(groups).forEach(g => {
        const uniqueStudentIds = new Set();
        g.schedules.forEach(s => {
            s.enrollments?.forEach((e: any) => uniqueStudentIds.add(e.studentId));
        });
        g.totalStudents = uniqueStudentIds.size;
    });

    // Color helper
    const getGroupColor = (name: string, index: number) => {
        const colors = [
            "#3B82F6", // Blue
            "#8B5CF6", // Purple
            "#EC4899", // Pink
            "#F97316", // Orange
            "#10B981", // Emerald
            "#06B6D4", // Cyan
            "#F59E0B", // Amber
            "#6366F1", // Indigo
        ];
        return colors[index % colors.length];
    };

    const hexToRgba = (hex: string, alpha: number) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt("0x" + hex[1] + hex[1]);
            g = parseInt("0x" + hex[2] + hex[2]);
            b = parseInt("0x" + hex[3] + hex[3]);
        } else if (hex.length === 7) {
            r = parseInt("0x" + hex[1] + hex[2]);
            g = parseInt("0x" + hex[3] + hex[4]);
            b = parseInt("0x" + hex[5] + hex[6]);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {Object.values(groups).map((group, index) => {
                const color = getGroupColor(group.name, index);
                const bg = hexToRgba(color, 0.1);

                return (
                    <div
                        key={index}
                        className="group relative transition-all hover:scale-[1.02]"
                        style={{
                            backgroundColor: bg,
                            borderRadius: '24px',
                            padding: '24px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                            minHeight: '260px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div
                                    style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '16px',
                                        backgroundColor: color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        flexShrink: 0
                                    }}
                                >
                                    <Users size={24} className="text-white" />
                                </div>
                                <div>
                                    <h4 style={{ color: '#1E293B', fontSize: '20px', fontWeight: 'bold', lineHeight: '1.2' }}>
                                        {group.name}
                                    </h4>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: color,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        marginTop: '4px'
                                    }}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                        Activo
                                    </span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hover:bg-white/50 -mr-2 -mt-2">
                                <MoreHorizontal size={20} />
                            </Button>
                        </div>

                        <div className="mb-6 flex flex-wrap gap-2">
                            <span style={{
                                padding: '4px 12px',
                                backgroundColor: 'rgba(255,255,255,0.6)',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#475569',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <MapPin size={12} />
                                {group.room}
                            </span>
                        </div>

                        <div className="space-y-2 mb-6 bg-white/60 p-4 rounded-xl flex-1 backdrop-blur-sm">
                            {group.schedules.map((s, i) => (
                                <div key={s.id} className="flex items-center justify-between text-sm text-slate-700 pb-2 last:pb-0 border-b border-slate-100 last:border-0 hover:bg-white/50 p-1 rounded transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Clock size={12} />
                                        </div>
                                        <span className="font-semibold text-slate-700">{days[s.dayOfWeek]}</span>
                                    </div>
                                    <span className="font-mono text-slate-600 text-xs bg-slate-100 px-2 py-1 rounded">{s.startTime} - {s.endTime}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 mt-auto">
                            <div className="text-sm font-medium text-slate-500">
                                Total Inscritos
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-slate-600 shadow-sm border border-slate-100">
                                    <Users size={14} />
                                </div>
                                <span className="text-base font-bold text-slate-700">
                                    {group.totalStudents} <span className="text-xs font-normal text-slate-400">estudiantes</span>
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Link to Calendar for creation */}
            <Link href="/dashboard/school?section=academico&tab=calendario" className="block h-full">
                <div
                    className="h-full min-h-[260px] rounded-[24px] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/10 transition-all gap-4 cursor-pointer p-8 group bg-slate-50/50 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:border-blue-200 group-hover:shadow-md transition-all text-slate-300 group-hover:text-blue-500 mb-2">
                        <Calendar size={32} strokeWidth={1.5} />
                    </div>
                    <div className="max-w-[200px]">
                        <span className="font-bold block text-lg mb-2 text-slate-600 group-hover:text-blue-600">
                            ¿Necesitas un nuevo grupo?
                        </span>
                        <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-500">
                            Para crear un grupo, debes asignar un horario y aula desde el <span className="font-medium underline decoration-blue-300 underline-offset-2">Calendario Académico</span>.
                        </p>
                    </div>
                </div>
            </Link>
        </div>
    );
}
