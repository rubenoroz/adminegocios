"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText,
    Plus,
    Search,
    Users,
    Trash2,
    Edit,
    Link2,
    X,
    Check,
    Building2,
    Mail,
    Phone
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { CustomerFiscalModal } from "@/components/sales/customer-fiscal-modal";

interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    taxId?: string;
    legalName?: string;
    taxRegime?: string;
    taxZipCode?: string;
    students?: { id: string; firstName: string; lastName: string; matricula?: string }[];
}

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    matricula?: string;
}

export function BillingProfilesManager() {
    const { toast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modals
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkingCustomer, setLinkingCustomer] = useState<Customer | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [studentSearch, setStudentSearch] = useState("");

    useEffect(() => {
        fetchCustomers();
        fetchStudents();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await fetch("/api/customers?includeStudents=true");
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch("/api/students");
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const handleDeleteCustomer = async (customerId: string) => {
        if (!confirm("¿Estás seguro de eliminar este cliente de facturación?")) return;

        try {
            const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Cliente eliminado", description: "El perfil de facturación ha sido eliminado." });
                fetchCustomers();
            } else {
                toast({ title: "Error", description: "No se pudo eliminar el cliente.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Error deleting customer:", error);
        }
    };

    const handleCustomerSaved = (customer: Customer) => {
        setShowCustomerModal(false);
        setEditingCustomer(null);
        fetchCustomers();
        toast({ title: "Guardado", description: "Cliente de facturación guardado correctamente." });
    };

    const openLinkModal = (customer: Customer) => {
        setLinkingCustomer(customer);
        setSelectedStudents(customer.students?.map(s => s.id) || []);
        setStudentSearch("");
        setShowLinkModal(true);
    };

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSaveLinks = async () => {
        if (!linkingCustomer) return;

        try {
            const res = await fetch(`/api/customers/${linkingCustomer.id}/students`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentIds: selectedStudents })
            });

            if (res.ok) {
                toast({ title: "Vínculos actualizados", description: "Los estudiantes han sido vinculados correctamente." });
                setShowLinkModal(false);
                setLinkingCustomer(null);
                fetchCustomers();
            } else {
                toast({ title: "Error", description: "No se pudieron guardar los vínculos.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Error saving links:", error);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.taxId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.legalName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredStudents = students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.matricula?.toLowerCase().includes(studentSearch.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div className="relative" style={{ flex: 1, maxWidth: '400px' }}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nombre o RFC..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        style={{ borderRadius: '12px', height: '44px' }}
                    />
                </div>
                <button
                    onClick={() => { setEditingCustomer(null); setShowCustomerModal(true); }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <Plus size={18} />
                    Nuevo Cliente
                </button>
            </div>

            {/* Customer List */}
            {loading ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-500">Cargando clientes...</p>
                </div>
            ) : filteredCustomers.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-slate-500 text-lg">No hay clientes de facturación registrados.</p>
                    <p className="text-slate-400 text-sm mt-2">Crea uno nuevo para empezar a vincular estudiantes.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '32px' }}>
                    <AnimatePresence>
                        {filteredCustomers.map((customer, index) => {
                            // Color palette matching student cards
                            const cardColors: Record<number, { bg: string; accent: string }> = {
                                0: { bg: '#EDE9FE', accent: '#7C3AED' },  // Purple
                                1: { bg: '#DBEAFE', accent: '#2563EB' },  // Blue
                                2: { bg: '#D1FAE5', accent: '#059669' },  // Green
                                3: { bg: '#FCE7F3', accent: '#DB2777' },  // Pink
                                4: { bg: '#FFEDD5', accent: '#EA580C' },  // Orange
                                5: { bg: '#CCFBF1', accent: '#0D9488' },  // Teal
                            };
                            const colors = cardColors[index % 6];
                            const initials = (customer.legalName || customer.name).split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

                            return (
                                <motion.div
                                    key={customer.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderRadius: '20px',
                                        padding: '28px',
                                        minHeight: '280px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '16px',
                                        backgroundColor: colors.accent,
                                        color: 'white',
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '20px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                    }}>
                                        {initials}
                                    </div>

                                    {/* Name */}
                                    <h3 style={{
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: '#1E293B',
                                        marginBottom: '4px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {customer.legalName || customer.name}
                                    </h3>

                                    {/* RFC */}
                                    <p style={{
                                        fontSize: '14px',
                                        color: '#64748B',
                                        fontFamily: 'monospace',
                                        marginBottom: '16px'
                                    }}>
                                        {customer.taxId || "Sin RFC"}
                                    </p>

                                    {/* Contact Info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                        {customer.email && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '10px',
                                                    backgroundColor: 'rgba(255,255,255,0.8)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                }}>
                                                    <Mail size={16} style={{ color: colors.accent }} />
                                                </div>
                                                <span style={{ fontSize: '14px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {customer.email}
                                                </span>
                                            </div>
                                        )}
                                        {customer.phone && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '10px',
                                                    backgroundColor: 'rgba(255,255,255,0.8)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                }}>
                                                    <Phone size={16} style={{ color: colors.accent }} />
                                                </div>
                                                <span style={{ fontSize: '14px', color: '#475569' }}>{customer.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Linked Students */}
                                    <div style={{ marginBottom: '16px', flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '11px',
                                            color: '#64748B',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            marginBottom: '8px'
                                        }}>
                                            <Users size={12} />
                                            <span>Estudiantes vinculados</span>
                                        </div>
                                        {customer.students && customer.students.length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {customer.students.slice(0, 3).map(student => (
                                                    <span
                                                        key={student.id}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            padding: '6px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '12px',
                                                            fontWeight: 500,
                                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                                            color: colors.accent,
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                                                        }}
                                                    >
                                                        {student.firstName} {student.lastName}
                                                    </span>
                                                ))}
                                                {customer.students.length > 3 && (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: 500,
                                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                                        color: '#64748B'
                                                    }}>
                                                        +{customer.students.length - 3} más
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>
                                                Sin estudiantes vinculados
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        paddingTop: '16px',
                                        borderTop: '1px solid rgba(0,0,0,0.08)',
                                        marginTop: 'auto'
                                    }}>
                                        <button
                                            onClick={() => openLinkModal(customer)}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                backgroundColor: colors.accent,
                                                color: 'white',
                                                border: 'none',
                                                cursor: 'pointer',
                                                boxShadow: `0 4px 12px ${colors.accent}40`,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <Link2 size={16} />
                                            Vincular
                                        </button>
                                        <button
                                            onClick={() => { setEditingCustomer(customer); setShowCustomerModal(true); }}
                                            style={{
                                                width: '44px',
                                                height: '44px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '12px',
                                                backgroundColor: 'rgba(255,255,255,0.9)',
                                                color: '#475569',
                                                border: 'none',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                                                transition: 'all 0.2s ease'
                                            }}
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCustomer(customer.id)}
                                            style={{
                                                width: '44px',
                                                height: '44px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '12px',
                                                backgroundColor: '#FEE2E2',
                                                color: '#DC2626',
                                                border: 'none',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                                                transition: 'all 0.2s ease'
                                            }}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Customer Modal */}
            <CustomerFiscalModal
                isOpen={showCustomerModal}
                onClose={() => { setShowCustomerModal(false); setEditingCustomer(null); }}
                onSave={handleCustomerSaved}
                initialData={editingCustomer}
            />

            {/* Link Students Modal */}
            <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
                <DialogContent className="sm:max-w-[500px] p-0">
                    <DialogHeader style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        padding: '24px',
                        borderTopLeftRadius: '20px',
                        borderTopRightRadius: '20px',
                        color: 'white'
                    }}>
                        <DialogTitle className="text-xl font-bold text-white">Vincular Estudiantes</DialogTitle>
                        <DialogDescription className="text-slate-300">
                            {linkingCustomer?.legalName || linkingCustomer?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar estudiante..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="pl-10"
                                style={{ borderRadius: '12px' }}
                            />
                        </div>

                        <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredStudents.map((student, index) => {
                                const avatarColors = ['#7C3AED', '#2563EB', '#059669', '#DB2777', '#EA580C', '#0D9488'];
                                const color = avatarColors[index % 6];
                                const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
                                const isSelected = selectedStudents.includes(student.id);

                                return (
                                    <div
                                        key={student.id}
                                        onClick={() => toggleStudent(student.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            padding: '12px 16px',
                                            borderRadius: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: isSelected ? '#EDE9FE' : '#F8FAFC',
                                            border: isSelected ? '2px solid #8B5CF6' : '2px solid transparent',
                                            boxShadow: isSelected ? '0 4px 12px rgba(139, 92, 246, 0.2)' : 'none'
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '12px',
                                            backgroundColor: color,
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                            flexShrink: 0
                                        }}>
                                            {initials}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: '15px',
                                                color: '#1E293B',
                                                marginBottom: '2px'
                                            }}>
                                                {student.firstName} {student.lastName}
                                            </div>
                                            {student.matricula && (
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#64748B',
                                                    fontFamily: 'monospace'
                                                }}>
                                                    Mat: {student.matricula}
                                                </div>
                                            )}
                                        </div>

                                        {/* Checkbox */}
                                        <div style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '8px',
                                            backgroundColor: isSelected ? '#8B5CF6' : '#E2E8F0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {isSelected && <Check size={16} color="white" strokeWidth={3} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            marginTop: '24px',
                            paddingTop: '20px',
                            borderTop: '1px solid #E2E8F0'
                        }}>
                            <button
                                onClick={() => setShowLinkModal(false)}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    backgroundColor: '#F1F5F9',
                                    color: '#475569',
                                    border: '1px solid #E2E8F0',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveLinks}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)'
                                }}
                            >
                                <Check size={18} />
                                Guardar Vínculos
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
