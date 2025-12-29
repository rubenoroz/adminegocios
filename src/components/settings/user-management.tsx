"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, X, Shield, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    branchId: string | null;
    branch?: {
        name: string;
    };
}

const ROLE_DEFINITIONS = {
    OWNER: {
        label: "Propietario",
        description: "Acceso total al sistema",
        color: "#7C3AED",
        bgColor: "#F3E8FF"
    },
    ADMIN: {
        label: "Administrador",
        description: "Gestión completa excepto configuración de negocio",
        color: "#2563EB",
        bgColor: "#DBEAFE"
    },
    ACCOUNTANT: {
        label: "Contador",
        description: "Acceso completo a finanzas y reportes",
        color: "#059669",
        bgColor: "#D1FAE5"
    },
    RECEPTIONIST: {
        label: "Recepcionista",
        description: "Ver adeudos y registrar pagos",
        color: "#D97706",
        bgColor: "#FEF3C7"
    },
    HR: {
        label: "Recursos Humanos",
        description: "Gestión de empleados y nómina",
        color: "#EA580C",
        bgColor: "#FFEDD5"
    },
    TEACHER: {
        label: "Profesor",
        description: "Gestión de cursos y calificaciones",
        color: "#4F46E5",
        bgColor: "#E0E7FF"
    },
};

// Roles que tienen acceso administrativo (no incluir TEACHER si solo da clases)
const ADMIN_ROLES = ['OWNER', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'HR'];

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const { toast } = useToast();

    // Form states
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("RECEPTIONIST");
    const [newBranchId, setNewBranchId] = useState("");

    useEffect(() => {
        fetchUsers();
        fetchBranches();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                // Filtrar solo usuarios con roles administrativos
                const adminUsers = data.filter((u: User) => ADMIN_ROLES.includes(u.role));
                setUsers(adminUsers);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await fetch("/api/branches");
            if (res.ok) {
                const data = await res.json();
                setBranches(data);
            }
        } catch (error) {
            console.error("Failed to fetch branches", error);
        }
    };

    const handleCreateUser = async () => {
        if (!newName || !newEmail || !newPassword || !newRole) {
            toast({
                title: "Error",
                description: "Por favor completa todos los campos requeridos",
                variant: "destructive",
            });
            return;
        }

        setCreating(true);
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    email: newEmail,
                    password: newPassword,
                    role: newRole,
                    branchId: newBranchId || null,
                }),
            });

            if (res.ok) {
                toast({
                    title: "Usuario creado",
                    description: "El usuario ha sido creado exitosamente",
                });
                setIsCreateOpen(false);
                resetForm();
                fetchUsers();
            } else {
                const error = await res.json();
                toast({
                    title: "Error",
                    description: error.message || "No se pudo crear el usuario",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error al crear el usuario",
                variant: "destructive",
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast({ title: "Usuario eliminado" });
                fetchUsers();
            } else {
                toast({
                    title: "Error",
                    description: "No se pudo eliminar el usuario",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("RECEPTIONIST");
        setNewBranchId("");
    };

    const getRoleBadge = (role: string) => {
        const roleInfo = ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS] || {
            label: role,
            color: "#64748B",
            bgColor: "#F1F5F9"
        };
        return (
            <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: roleInfo.color,
                backgroundColor: roleInfo.bgColor
            }}>
                {roleInfo.label}
            </span>
        );
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        const colors = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#EA580C', '#0891B2'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                        Usuarios Administrativos
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0' }}>
                        Personas con acceso al panel de administración
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 16px',
                                backgroundColor: '#2563EB',
                                color: 'white',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <Plus style={{ width: '16px', height: '16px' }} />
                            Nuevo Usuario
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Crear Usuario</DialogTitle>
                            <DialogDescription>
                                Crea un nuevo usuario con acceso al panel administrativo.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre Completo</Label>
                                    <Input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="juan@ejemplo.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Contraseña</Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Rol</Label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ROLE_DEFINITIONS)
                                            .filter(([key]) => key !== 'TEACHER') // Profesores no van aquí
                                            .map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{value.label}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {value.description}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {branches.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Sucursal (Opcional)</Label>
                                    <Select value={newBranchId} onValueChange={setNewBranchId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas las sucursales" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Todas las sucursales</SelectItem>
                                            {branches.map((branch) => (
                                                <SelectItem key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Permissions Preview */}
                            <div style={{
                                padding: '16px',
                                backgroundColor: '#F8FAFC',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Shield style={{ width: '16px', height: '16px', color: '#64748B' }} />
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                                        Permisos del rol
                                    </span>
                                </div>
                                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                                    {ROLE_DEFINITIONS[newRole as keyof typeof ROLE_DEFINITIONS]?.description}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: 'white',
                                    color: '#475569',
                                    borderRadius: '8px',
                                    border: '1px solid #E2E8F0',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    marginRight: '8px'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateUser}
                                disabled={creating}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    backgroundColor: '#059669',
                                    color: 'white',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: creating ? 'wait' : 'pointer',
                                    opacity: creating ? 0.7 : 1
                                }}
                            >
                                {creating && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                                Crear Usuario
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Users List */}
            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', color: '#64748B' }} />
                </div>
            ) : users.length === 0 ? (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '12px',
                    border: '2px dashed #E2E8F0'
                }}>
                    <p style={{ color: '#64748B', margin: 0 }}>
                        No hay usuarios administrativos registrados.
                    </p>
                </div>
            ) : (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden'
                }}>
                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 2fr 1fr 1fr 80px',
                        gap: '16px',
                        padding: '12px 20px',
                        backgroundColor: '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#64748B',
                        textTransform: 'uppercase'
                    }}>
                        <span>Usuario</span>
                        <span>Email</span>
                        <span>Rol</span>
                        <span>Sucursal</span>
                        <span style={{ textAlign: 'center' }}>Acciones</span>
                    </div>

                    {/* Table Body */}
                    {users.map((user, index) => (
                        <div
                            key={user.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 2fr 1fr 1fr 80px',
                                gap: '16px',
                                padding: '16px 20px',
                                alignItems: 'center',
                                backgroundColor: index % 2 === 1 ? '#F8FAFC' : 'white',
                                borderBottom: index < users.length - 1 ? '1px solid #F1F5F9' : 'none'
                            }}
                        >
                            {/* Name with avatar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    backgroundColor: getAvatarColor(user.name || 'U'),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: 700
                                }}>
                                    {getInitials(user.name || 'U')}
                                </div>
                                <span style={{ fontWeight: 500, color: '#1E293B' }}>{user.name}</span>
                            </div>

                            {/* Email */}
                            <span style={{ color: '#64748B', fontSize: '14px' }}>{user.email}</span>

                            {/* Role */}
                            {getRoleBadge(user.role)}

                            {/* Branch */}
                            <span style={{ color: '#64748B', fontSize: '14px' }}>
                                {user.branch ? user.branch.name : "Todas"}
                            </span>

                            {/* Actions */}
                            <div style={{ textAlign: 'center' }}>
                                {user.role !== "OWNER" && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteUser(user.id)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            backgroundColor: '#FEE2E2',
                                            borderRadius: '8px',
                                            border: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <X style={{ width: '16px', height: '16px', color: '#DC2626' }} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
