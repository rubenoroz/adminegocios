"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, ArrowRightLeft, Mail, Phone, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    matricula: string;
    email?: string;
    phone?: string;
}

interface ScheduleEnrollment {
    studentId: string;
    scheduleId: string;
    status: string;
}

interface Schedule {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    groupName?: string;
    enrollments: ScheduleEnrollment[];
}

interface CourseStudentsManagerProps {
    course: any;
    onUpdate: () => void;
}

export function CourseStudentsManager({ course, onUpdate }: CourseStudentsManagerProps) {
    const [studentToMove, setStudentToMove] = useState<{ id: string, name: string, currentScheduleId: string } | null>(null);
    const [newScheduleId, setNewScheduleId] = useState<string>("");
    const { toast } = useToast();
    const router = useRouter();

    // Flatten enrollments first
    const baseList = course?.schedules?.flatMap((schedule: Schedule) => {
        return schedule.enrollments?.map((enrollment: any) => {
            const studentDetail = enrollment.student || course.enrollments?.find((e: any) => e.student.id === enrollment.studentId)?.student;

            if (!studentDetail) return null;

            return {
                student: studentDetail,
                scheduleId: schedule.id,
                scheduleInfo: {
                    dayOfWeek: schedule.dayOfWeek,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    groupName: schedule.groupName,
                    id: schedule.id
                },
                // We keep track of all distinct enrollments for this student-group combination
                enrollmentIds: [enrollment.id || `${schedule.id}-${enrollment.studentId}`]
            };
        }).filter(Boolean);
    }) || [];

    // Group logic to deduplicate students in the same Group Name
    const uniqueMap = new Map();

    baseList.forEach((item: any) => {
        // key = studentId + groupName. 
        // If groupName is missing, we might group by 'General' or just keep separate? 
        // For safety, let's group by groupName. Only show multiple rows if they are in distinct named groups.
        const groupName = item.scheduleInfo.groupName || "Grupo General";
        const key = `${item.student.id}-${groupName}`;

        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, {
                ...item,
                groupNameDisplay: groupName,
                schedules: [item.scheduleInfo],
                allEnrollmentIds: [...item.enrollmentIds]
            });
        } else {
            const existing = uniqueMap.get(key);
            // Avoid adding duplicate schedule info if logic causes overlap (unlikely with flatMap on schedules)
            existing.schedules.push(item.scheduleInfo);
            existing.allEnrollmentIds.push(...item.enrollmentIds);
        }
    });

    const enrolledList = Array.from(uniqueMap.values());

    // Generate unique options for the "Move to" dropdown
    const availableGroupsMap = new Map();
    course?.schedules?.forEach((s: any) => {
        const groupName = s.groupName || "Grupo General";
        if (!availableGroupsMap.has(groupName)) {
            availableGroupsMap.set(groupName, {
                name: groupName,
                schedules: [], // List of schedule objects
                representativeId: s.id // Use first ID as value
            });
        }
        availableGroupsMap.get(groupName).schedules.push(s);
    });

    const availableGroups = Array.from(availableGroupsMap.values());

    const handleMoveGroup = async () => {
        if (!studentToMove || !newScheduleId) return;

        try {
            // Find the selected target group object
            const targetGroup = availableGroups.find(g => g.representativeId === newScheduleId);
            if (!targetGroup) return;

            // Enroll in ALL schedules of the new group
            await Promise.all(targetGroup.schedules.map(async (s: any) => {
                const resEnroll = await fetch("/api/schedule-enrollments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        studentIds: [studentToMove.id],
                        scheduleId: s.id
                    })
                });
                if (!resEnroll.ok) throw new Error("Failed to enroll");
            }));

            // Remove from ALL old schedules
            const scheduleIdsToRemove = (studentToMove as any).scheduleIdsToLeave || [];
            await Promise.all(scheduleIdsToRemove.map(async (schedId: string) => {
                await fetch(`/api/schedule-enrollments?studentId=${studentToMove.id}&scheduleId=${schedId}`, {
                    method: "DELETE"
                });
            }));

            toast({ title: "Cambio de grupo exitoso" });
            setStudentToMove(null);
            setNewScheduleId("");
            onUpdate();
            router.refresh();

        } catch (error) {
            toast({ title: "Error al mover alumno", variant: "destructive" });
        }
    };

    const handleUnenroll = async (entry: any) => {
        if (!confirm(`¿Eliminar al alumno de ${entry.groupNameDisplay}? Se eliminará de todos los horarios de este grupo.`)) return;

        try {
            // Remove from all collected schedules for this group
            await Promise.all(entry.schedules.map(async (s: any) => {
                await fetch(`/api/schedule-enrollments?studentId=${entry.student.id}&scheduleId=${s.id}`, {
                    method: "DELETE"
                });
            }));

            toast({ title: "Alumno eliminado del grupo" });
            onUpdate();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50">
                            <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Alumno</th>
                            <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Matrícula</th>
                            <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Grupo asignado</th>
                            <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Contacto</th>
                            <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {enrolledList.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-slate-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                            <Users size={24} />
                                        </div>
                                        <p>No hay alumnos inscritos en ningún grupo.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            enrolledList.map((entry: any, index: number) => (
                                <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0 ring-2 ring-white">
                                                {entry.student?.firstName?.[0]}{entry.student?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">
                                                    {entry.student?.firstName} {entry.student?.lastName}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                            {entry.student?.matricula || "—"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <Badge variant="secondary" className="w-fit bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 px-2.5 py-0.5 font-medium">
                                                {entry.groupNameDisplay}
                                            </Badge>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 ml-0.5">
                                                {/* Aggregate days and times if possible, or list efficiently */}
                                                {(() => {
                                                    // Sort schedules by day
                                                    const sorted = [...entry.schedules].sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek);
                                                    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
                                                    return sorted.map((sch: any, idx: number) => (
                                                        <span key={idx} className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded text-slate-600">
                                                            <span className="font-semibold">{days[sch.dayOfWeek]}</span>
                                                            <span className="text-slate-400">•</span>
                                                            <span>{sch.startTime}</span>
                                                        </span>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5 text-sm">
                                            {entry.student?.email && (
                                                <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                                                    <Mail size={14} className="text-slate-400" />
                                                    {entry.student.email}
                                                </div>
                                            )}
                                            {entry.student?.phone && (
                                                <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {entry.student.phone}
                                                </div>
                                            )}
                                            {!entry.student?.email && !entry.student?.phone && (
                                                <span className="text-slate-400 italic text-xs">Sin datos de contacto</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                            {/* MOVER BUTTON - Gradient Style */}
                                            <button
                                                type="button"
                                                onClick={() => setStudentToMove({
                                                    id: entry.student.id,
                                                    name: `${entry.student.firstName} ${entry.student.lastName}`,
                                                    currentScheduleId: "",
                                                    scheduleIdsToLeave: entry.schedules.map((s: any) => s.id)
                                                } as any)}
                                                style={{
                                                    height: '36px',
                                                    padding: '0 14px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                                    color: '#FFFFFF',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <ArrowRightLeft size={15} color="#FFFFFF" />
                                                Mover
                                            </button>

                                            {/* DELETE BUTTON - Red Style */}
                                            <button
                                                type="button"
                                                onClick={() => handleUnenroll(entry)}
                                                title="Eliminar de todos los horarios"
                                                style={{
                                                    height: '36px',
                                                    width: '36px',
                                                    padding: 0,
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                                    color: '#FFFFFF',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <Trash2 size={16} color="#FFFFFF" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog open={!!studentToMove} onOpenChange={(open) => !open && setStudentToMove(null)}>
                <DialogContent style={{ maxWidth: '520px', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* HEADER */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ArrowRightLeft size={22} color="#FFFFFF" />
                            </div>
                            <span style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937' }}>Mover alumno de grupo</span>
                        </div>
                        <p style={{ fontSize: '15px', color: '#4B5563', margin: 0 }}>
                            Selecciona el nuevo grupo para <strong style={{ color: '#1F2937' }}>{studentToMove?.name}</strong>.
                        </p>
                        {/* Warning Box */}
                        <div style={{ marginTop: '8px', padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{ fontSize: '18px' }}>⚠️</span>
                            <div style={{ fontSize: '13px', color: '#92400E', lineHeight: 1.5 }}>
                                <strong style={{ display: 'block', marginBottom: '4px' }}>Nota Importante</strong>
                                Al mover al alumno, se le dará de baja de <strong>todos</strong> sus horarios actuales en este grupo y se inscribirá en los horarios del grupo seleccionado.
                            </div>
                        </div>
                    </div>

                    {/* GROUP SELECTOR - MATCHING BRANCH SELECTOR STYLE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                            Nuevo Grupo Destino
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                            {availableGroups.map((g: any) => {
                                const isSelected = newScheduleId === g.representativeId;
                                const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
                                const dayNames = g.schedules.map((s: any) => days[s.dayOfWeek]).join("-");
                                const time = g.schedules[0]?.startTime;

                                return (
                                    <div
                                        key={g.representativeId}
                                        onClick={() => setNewScheduleId(g.representativeId)}
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: isSelected ? '2px solid #000000' : '2px solid #D1D5DB',
                                            backgroundColor: isSelected ? '#F3F4F6' : '#FFFFFF',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {/* CHECKBOX - Inline styles for guaranteed visibility */}
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
                                            {isSelected && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '15px', color: '#1F2937' }}>
                                                {g.name}
                                            </span>
                                            <span style={{ fontSize: '13px', color: '#6B7280' }}>
                                                {dayNames} • {time}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* FOOTER BUTTONS */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                        <button
                            type="button"
                            onClick={() => setStudentToMove(null)}
                            style={{
                                height: '44px',
                                padding: '0 24px',
                                borderRadius: '10px',
                                border: '1px solid #D1D5DB',
                                backgroundColor: '#FFFFFF',
                                color: '#374151',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleMoveGroup}
                            disabled={!newScheduleId}
                            style={{
                                height: '44px',
                                padding: '0 24px',
                                borderRadius: '10px',
                                border: 'none',
                                background: !newScheduleId ? '#9CA3AF' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                color: '#FFFFFF',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: !newScheduleId ? 'not-allowed' : 'pointer',
                                boxShadow: !newScheduleId ? 'none' : '0 4px 14px rgba(99, 102, 241, 0.4)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Confirmar Movimiento
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
