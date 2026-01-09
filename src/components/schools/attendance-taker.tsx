"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, AlertCircle, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    matricula: string;
}

interface AttendanceTakerProps {
    courseId: string;
    date: string;
}

type Status = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

// Avatar colors for gradient effect
const avatarColors = [
    { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", text: "#fff" },
    { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", text: "#fff" },
    { bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", text: "#fff" },
    { bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", text: "#fff" },
    { bg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", text: "#fff" },
    { bg: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", text: "#555" },
];

export function AttendanceTaker({ courseId, date }: AttendanceTakerProps) {
    const { toast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, Status>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch students and existing attendance
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const studentsRes = await fetch(`/api/courses/${courseId}/students`);
                if (!studentsRes.ok) throw new Error("Failed to load students");
                const studentsData = await studentsRes.json();
                setStudents(studentsData);

                const attendanceRes = await fetch(`/api/attendance?courseId=${courseId}&date=${date}`);
                if (attendanceRes.ok) {
                    const existingRecords = await attendanceRes.json();
                    const statusMap: Record<string, Status> = {};

                    existingRecords.forEach((r: any) => {
                        statusMap[r.studentId] = r.status as Status;
                    });

                    if (existingRecords.length === 0) {
                        studentsData.forEach((s: Student) => {
                            statusMap[s.id] = "PRESENT";
                        });
                    } else {
                        studentsData.forEach((s: Student) => {
                            if (!statusMap[s.id]) statusMap[s.id] = "PRESENT";
                        });
                    }

                    setAttendance(statusMap);
                }
            } catch (error) {
                console.error(error);
                toast({ title: "Error al cargar datos", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        if (courseId && date) {
            loadData();
        }
    }, [courseId, date]);

    const handleStatusChange = (studentId: string, status: Status) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = Object.entries(attendance).map(([studentId, status]) => ({
                studentId,
                status
            }));

            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId,
                    date,
                    attendanceRecords: records
                })
            });

            if (!res.ok) throw new Error("Failed to save");

            toast({ title: "Asistencia guardada correctamente" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error al guardar", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '48px',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <Loader2 style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
                <p style={{ color: '#64748b', fontSize: '14px' }}>Cargando alumnos...</p>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '48px',
                color: '#64748b',
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                border: '2px dashed #e2e8f0'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                <p style={{ fontSize: '16px', fontWeight: 500 }}>No hay alumnos inscritos en este curso.</p>
            </div>
        );
    }

    // Stats
    const stats = {
        present: Object.values(attendance).filter(s => s === "PRESENT").length,
        late: Object.values(attendance).filter(s => s === "LATE").length,
        excused: Object.values(attendance).filter(s => s === "EXCUSED").length,
        absent: Object.values(attendance).filter(s => s === "ABSENT").length,
        total: students.length
    };

    const getStatusStyles = (status: Status, currentStatus: Status) => {
        const isActive = status === currentStatus;
        const baseStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: isActive ? 700 : 500,
            transition: 'all 0.2s ease',
        };

        if (status === "PRESENT") {
            return {
                ...baseStyle,
                background: isActive ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
                color: isActive ? 'white' : '#64748b',
                boxShadow: isActive ? '0 4px 12px rgba(34, 197, 94, 0.3)' : 'none',
            };
        }
        if (status === "LATE") {
            return {
                ...baseStyle,
                background: isActive ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                color: isActive ? 'white' : '#64748b',
                boxShadow: isActive ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
            };
        }
        if (status === "EXCUSED") {
            return {
                ...baseStyle,
                background: isActive ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                color: isActive ? 'white' : '#64748b',
                boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
            };
        }
        if (status === "ABSENT") {
            return {
                ...baseStyle,
                background: isActive ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
                color: isActive ? 'white' : '#64748b',
                boxShadow: isActive ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none',
            };
        }
        return baseStyle;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Stats Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                padding: '16px 24px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                position: 'sticky',
                top: '16px',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)' }} />
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{stats.present} Presentes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }} />
                        <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '14px' }}>{stats.late} Tarde</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }} />
                        <span style={{ color: '#60a5fa', fontWeight: 600, fontSize: '14px' }}>{stats.excused} Justificado</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} />
                        <span style={{ color: '#f87171', fontWeight: 600, fontSize: '14px' }}>{stats.absent} Ausentes</span>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '14px', marginLeft: '8px' }}>/ {stats.total} Total</span>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s ease',
                    }}
                >
                    {saving ? <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '18px', height: '18px' }} />}
                    Guardar Asistencia
                </button>
            </div>

            {/* Students List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {students.map((student, index) => {
                    const colorIndex = index % avatarColors.length;
                    const avatarColor = avatarColors[colorIndex];
                    const currentStatus = attendance[student.id] || "PRESENT";
                    const isAbsent = currentStatus === "ABSENT";

                    return (
                        <div
                            key={student.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px 20px',
                                borderRadius: '16px',
                                background: isAbsent ? 'linear-gradient(135deg, #fef2f2 0%, #fff 100%)' : '#fff',
                                border: isAbsent ? '2px solid #fecaca' : '1px solid #e2e8f0',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {/* Student Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '14px',
                                    background: avatarColor.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    color: avatarColor.text,
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                }}>
                                    {student.firstName[0]}{student.lastName[0]}
                                </div>
                                <div>
                                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                                        {student.firstName} {student.lastName}
                                    </p>
                                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, marginTop: '2px' }}>
                                        {student.matricula}
                                    </p>
                                </div>
                            </div>

                            {/* Status Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '6px',
                                background: '#f1f5f9',
                                padding: '6px',
                                borderRadius: '14px',
                            }}>
                                <button
                                    onClick={() => handleStatusChange(student.id, "PRESENT")}
                                    style={getStatusStyles("PRESENT", currentStatus)}
                                >
                                    <Check style={{ width: '16px', height: '16px' }} />
                                    Presente
                                </button>
                                <button
                                    onClick={() => handleStatusChange(student.id, "LATE")}
                                    style={getStatusStyles("LATE", currentStatus)}
                                    title="Tarde"
                                >
                                    <Clock style={{ width: '16px', height: '16px' }} />
                                </button>
                                <button
                                    onClick={() => handleStatusChange(student.id, "EXCUSED")}
                                    style={getStatusStyles("EXCUSED", currentStatus)}
                                    title="Justificado"
                                >
                                    <AlertCircle style={{ width: '16px', height: '16px' }} />
                                </button>
                                <button
                                    onClick={() => handleStatusChange(student.id, "ABSENT")}
                                    style={getStatusStyles("ABSENT", currentStatus)}
                                >
                                    <X style={{ width: '16px', height: '16px' }} />
                                    Ausente
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
