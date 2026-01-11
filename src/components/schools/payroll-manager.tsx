"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useBranch } from "@/context/branch-context";
import {
    FileText, Calendar, DollarSign, Search,
    Loader2, AlertCircle, CheckCircle2, Receipt, Sparkles, TrendingUp
} from "lucide-react";
import {
    generatePayrollReceiptPDF,
    downloadPayrollReceipt,
    calculatePayrollDetails,
} from "@/lib/payroll-receipt-generator";

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    role: string;
    salary: number | null;
    paymentFrequency: string;
    hireDate: string;
}

interface CommissionSummary {
    teacherId: string;
    totalCommission: number;
    paymentCount: number;
}

interface Business {
    name: string;
    address?: string;
    rfc?: string;
}

const ROLE_LABELS: Record<string, string> = {
    OWNER: "Propietario",
    ADMIN: "Administrador",
    MANAGER: "Gerente",
    TEACHER: "Maestro",
    STAFF: "Personal",
    RECEPTIONIST: "Recepcionista",
};

const FREQUENCY_LABELS: Record<string, string> = {
    WEEKLY: "Semanal",
    BIWEEKLY: "Quincenal",
    MONTHLY: "Mensual",
};

const CARD_GRADIENTS = [
    { bg: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)", accent: "#8b5cf6" },
    { bg: "linear-gradient(135deg, #164e63 0%, #0e7490 100%)", accent: "#06b6d4" },
    { bg: "linear-gradient(135deg, #065f46 0%, #059669 100%)", accent: "#10b981" },
    { bg: "linear-gradient(135deg, #78350f 0%, #b45309 100%)", accent: "#f59e0b" },
    { bg: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)", accent: "#ef4444" },
    { bg: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)", accent: "#3b82f6" },
];

export function PayrollManager() {
    const { selectedBranch } = useBranch();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [commissions, setCommissions] = useState<CommissionSummary[]>([]);
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [generatingFor, setGeneratingFor] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedBranch?.businessId) return;

            setLoading(true);
            try {
                const [empRes, bizRes, commRes] = await Promise.all([
                    fetch(`/api/employees?businessId=${selectedBranch.businessId}`),
                    fetch(`/api/business/settings`),
                    fetch(`/api/commissions`),
                ]);

                if (empRes.ok) {
                    const data = await empRes.json();
                    // Include employees with salary OR commissions
                    setEmployees(data);
                }

                if (bizRes.ok) {
                    const bizData = await bizRes.json();
                    setBusiness({
                        name: bizData.businessName || selectedBranch.name || "Mi Negocio",
                        address: bizData.address,
                        rfc: bizData.rfc,
                    });
                }

                if (commRes.ok) {
                    const commData = await commRes.json();
                    // Map commission summary to a simpler structure
                    const mappedCommissions: CommissionSummary[] = (commData.summary || []).map((s: any) => ({
                        teacherId: s.teacher.id,
                        totalCommission: s.totalCommission,
                        paymentCount: s.paymentCount,
                    }));
                    setCommissions(mappedCommissions);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedBranch?.businessId]);

    // Get commission for an employee
    const getCommissionForEmployee = (employeeId: string): CommissionSummary | undefined => {
        return commissions.find(c => c.teacherId === employeeId);
    };

    // Filter employees that have salary OR pending commissions
    const employeesWithPayroll = employees.filter(emp => {
        const hasSalary = emp.salary && emp.salary > 0;
        const hasCommissions = getCommissionForEmployee(emp.id)?.totalCommission ?? 0 > 0;
        return hasSalary || hasCommissions;
    });

    const handleGenerateReceipt = async (employee: Employee) => {
        if (!business) return;

        const commission = getCommissionForEmployee(employee.id);
        const baseSalary = employee.salary || 0;
        const commissionAmount = commission?.totalCommission || 0;

        if (baseSalary === 0 && commissionAmount === 0) return;

        setGeneratingFor(employee.id);
        setSuccessMessage(null);

        try {
            const now = new Date();
            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

            let period = "";
            if (employee.paymentFrequency === "BIWEEKLY") {
                const day = now.getDate();
                if (day <= 15) {
                    period = `1-15 ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
                } else {
                    period = `16-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
                }
            } else if (employee.paymentFrequency === "WEEKLY") {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                period = `${weekStart.getDate()}-${weekEnd.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
            } else {
                period = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
            }

            // Calculate payroll with commissions included
            const payrollDetails = calculatePayrollDetails(baseSalary, commissionAmount);

            const blob = await generatePayrollReceiptPDF({
                businessName: business.name,
                businessAddress: business.address,
                businessRfc: business.rfc,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                employeeRole: ROLE_LABELS[employee.role] || employee.role,
                employeeId: employee.id,
                period,
                paymentDate: now.toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                baseSalary,
                deductions: payrollDetails.deductions,
                perceptions: payrollDetails.perceptions,
            });

            downloadPayrollReceipt(blob, `${employee.firstName}_${employee.lastName}`, period);
            setSuccessMessage(`Recibo generado para ${employee.firstName}`);

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error("Error generating receipt:", error);
        } finally {
            setGeneratingFor(null);
        }
    };

    const filteredEmployees = employeesWithPayroll.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate totals
    const totalSalaries = employeesWithPayroll.reduce((sum, e) => sum + (e.salary || 0), 0);
    const totalCommissions = commissions.reduce((sum, c) => sum + c.totalCommission, 0);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <div
                    style={{
                        width: '56px',
                        height: '56px',
                        border: '4px solid #e2e8f0',
                        borderTopColor: '#6366f1',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }}
                />
                <p style={{ marginTop: '20px', color: '#64748b', fontSize: '15px', fontWeight: 500 }}>
                    Cargando empleados y comisiones...
                </p>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ padding: '8px' }}>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                marginBottom: '32px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{
                                padding: '12px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
                            }}>
                                <Receipt size={24} color="#fff" />
                            </div>
                            <h2 style={{
                                fontSize: '28px',
                                fontWeight: 800,
                                color: '#0f172a',
                                letterSpacing: '-0.02em',
                                margin: 0,
                            }}>
                                Nómina
                            </h2>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 500, margin: 0 }}>
                            Genera recibos de pago profesionales (salarios + comisiones)
                        </p>
                    </div>

                    {/* Search Box */}
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Buscar empleado..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                paddingLeft: '44px',
                                paddingRight: '16px',
                                paddingTop: '12px',
                                paddingBottom: '12px',
                                width: '280px',
                                borderRadius: '14px',
                                border: '2px solid #e2e8f0',
                                background: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#0f172a',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#6366f1';
                                e.target.style.background = '#fff';
                                e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.background = '#f8fafc';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Summary KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid #a7f3d0',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <DollarSign size={18} color="#059669" />
                            <span style={{ color: '#047857', fontSize: '13px', fontWeight: 600 }}>Total Salarios</span>
                        </div>
                        <span style={{ color: '#065f46', fontSize: '24px', fontWeight: 800 }}>
                            ${totalSalaries.toLocaleString('es-MX')}
                        </span>
                    </div>
                    <div style={{
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid #fcd34d',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <TrendingUp size={18} color="#d97706" />
                            <span style={{ color: '#92400e', fontSize: '13px', fontWeight: 600 }}>Comisiones Pendientes</span>
                        </div>
                        <span style={{ color: '#78350f', fontSize: '24px', fontWeight: 800 }}>
                            ${totalCommissions.toLocaleString('es-MX')}
                        </span>
                    </div>
                    <div style={{
                        background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid #c4b5fd',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Receipt size={18} color="#7c3aed" />
                            <span style={{ color: '#5b21b6', fontSize: '13px', fontWeight: 600 }}>Total a Pagar</span>
                        </div>
                        <span style={{ color: '#4c1d95', fontSize: '24px', fontWeight: 800 }}>
                            ${(totalSalaries + totalCommissions).toLocaleString('es-MX')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                        border: '1px solid #6ee7b7',
                        borderRadius: '16px',
                        marginBottom: '24px',
                    }}
                >
                    <CheckCircle2 size={22} color="#059669" />
                    <span style={{ color: '#047857', fontWeight: 600, fontSize: '15px' }}>
                        {successMessage}
                    </span>
                </motion.div>
            )}

            {/* Empty State */}
            {filteredEmployees.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 24px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '24px',
                    border: '2px dashed #cbd5e1',
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}>
                        <AlertCircle size={36} color="#d97706" />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                        {employees.length === 0
                            ? "No hay empleados registrados"
                            : "No se encontraron resultados"
                        }
                    </h3>
                    <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto', fontSize: '15px' }}>
                        {employees.length === 0
                            ? "Agrega empleados con salario o comisiones para generar recibos."
                            : "Intenta con otros términos de búsqueda."
                        }
                    </p>
                </div>
            ) : (
                /* Employee Cards Grid */
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '24px',
                }}>
                    {filteredEmployees.map((employee, index) => {
                        const colorScheme = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
                        const isGenerating = generatingFor === employee.id;
                        const commission = getCommissionForEmployee(employee.id);
                        const baseSalary = employee.salary || 0;
                        const commissionAmount = commission?.totalCommission || 0;
                        const totalToPay = baseSalary + commissionAmount;

                        return (
                            <motion.div
                                key={employee.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    background: colorScheme.bg,
                                    borderRadius: '24px',
                                    padding: '28px',
                                    boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.08) inset',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.12) inset';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.08) inset';
                                }}
                            >
                                {/* Decorative gradient orb */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-40%',
                                    right: '-20%',
                                    width: '200px',
                                    height: '200px',
                                    borderRadius: '50%',
                                    background: `radial-gradient(circle, ${colorScheme.accent}40 0%, transparent 70%)`,
                                    pointerEvents: 'none',
                                }} />

                                {/* Employee Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '16px',
                                        background: 'rgba(255,255,255,0.15)',
                                        backdropFilter: 'blur(10px)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        fontWeight: 800,
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                    }}>
                                        {employee.firstName[0]}{employee.lastName[0]}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: '#fff',
                                            margin: 0,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {employee.firstName} {employee.lastName}
                                        </h3>
                                        <span style={{
                                            display: 'inline-block',
                                            marginTop: '6px',
                                            padding: '4px 12px',
                                            borderRadius: '8px',
                                            background: 'rgba(255,255,255,0.15)',
                                            color: 'rgba(255,255,255,0.9)',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                        }}>
                                            {ROLE_LABELS[employee.role] || employee.role}
                                        </span>
                                    </div>
                                </div>

                                {/* Payment Breakdown */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                                    {/* Base Salary */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <DollarSign size={16} color="rgba(255,255,255,0.7)" />
                                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500 }}>Salario Base</span>
                                        </div>
                                        <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>
                                            ${baseSalary.toLocaleString('es-MX')}
                                        </span>
                                    </div>

                                    {/* Commissions */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        background: commissionAmount > 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        border: commissionAmount > 0 ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <TrendingUp size={16} color={commissionAmount > 0 ? "#fbbf24" : "rgba(255,255,255,0.7)"} />
                                            <span style={{ color: commissionAmount > 0 ? '#fbbf24' : 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500 }}>
                                                Comisiones {commission?.paymentCount ? `(${commission.paymentCount} pagos)` : ''}
                                            </span>
                                        </div>
                                        <span style={{ color: commissionAmount > 0 ? '#fbbf24' : '#fff', fontSize: '16px', fontWeight: 700 }}>
                                            ${commissionAmount.toLocaleString('es-MX')}
                                        </span>
                                    </div>

                                    {/* Total */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '14px 16px',
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(16, 185, 129, 0.4)',
                                    }}>
                                        <span style={{ color: '#6ee7b7', fontSize: '14px', fontWeight: 600 }}>TOTAL BRUTO</span>
                                        <span style={{ color: '#6ee7b7', fontSize: '20px', fontWeight: 800 }}>
                                            ${totalToPay.toLocaleString('es-MX')}
                                        </span>
                                    </div>
                                </div>

                                {/* Frequency */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '20px',
                                    position: 'relative',
                                    zIndex: 1,
                                }}>
                                    <Calendar size={14} color="rgba(255,255,255,0.5)" />
                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 500 }}>
                                        {FREQUENCY_LABELS[employee.paymentFrequency] || employee.paymentFrequency}
                                    </span>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={() => handleGenerateReceipt(employee)}
                                    disabled={isGenerating || totalToPay === 0}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        padding: '16px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        cursor: isGenerating || totalToPay === 0 ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                        zIndex: 1,
                                        background: isGenerating || totalToPay === 0
                                            ? 'rgba(255,255,255,0.2)'
                                            : 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
                                        color: isGenerating || totalToPay === 0 ? 'rgba(255,255,255,0.8)' : '#0f172a',
                                        boxShadow: isGenerating || totalToPay === 0
                                            ? 'none'
                                            : '0 8px 20px rgba(0, 0, 0, 0.2)',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isGenerating && totalToPay > 0) {
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.3)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isGenerating && totalToPay > 0) {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
                                        }
                                    }}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <FileText size={20} />
                                            Generar Recibo PDF
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Info Card */}
            <div style={{
                marginTop: '40px',
                padding: '24px',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                borderRadius: '20px',
                boxShadow: '0 15px 30px rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px',
            }}>
                <div style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.1)',
                    flexShrink: 0,
                }}>
                    <Sparkles size={24} color="#a5b4fc" />
                </div>
                <div>
                    <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>
                        Sobre los Recibos
                    </h4>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                        Los recibos incluyen el salario base más las comisiones pendientes del empleado.
                        Las deducciones (IMSS 3%, ISR 10%) se calculan sobre el total bruto.
                        Nota: Generar el recibo <strong>no liquida</strong> las comisiones automáticamente.
                    </p>
                </div>
            </div>
        </div>
    );
}
