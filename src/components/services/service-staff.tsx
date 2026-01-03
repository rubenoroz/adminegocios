"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Calendar, DollarSign } from "lucide-react";

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    role: string;
    appointments?: { id: string }[];
}

export function ServiceStaff() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/employees");
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;
    }

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>Personal de Servicios</h2>
                <p style={{ color: '#64748B' }}>Staff disponible para asignar a citas. Administra el personal completo desde Empleados.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {employees.map((emp, idx) => (
                    <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                        style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '20px' }}>
                                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#0F172A' }}>{emp.firstName} {emp.lastName}</h3>
                                <span style={{ fontSize: '13px', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#3B82F6', fontWeight: 600 }}>{emp.role}</span>
                            </div>
                        </div>
                        {emp.email && <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '4px' }}>{emp.email}</div>}
                        {emp.phone && <div style={{ fontSize: '14px', color: '#64748B' }}>{emp.phone}</div>}
                    </motion.div>
                ))}

                {employees.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px', backgroundColor: 'white', borderRadius: '16px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍💼</div>
                        <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Sin personal</h3>
                        <p style={{ color: '#64748B' }}>Agrega empleados desde la sección de Empleados</p>
                    </div>
                )}
            </div>
        </div>
    );
}
