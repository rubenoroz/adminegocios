"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    GraduationCap,
    Utensils,
    BookOpen,
    DollarSign,
    Upload,
    Megaphone,
    TrendingUp,
    Loader2,
    Building2,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

import { useSession } from "next-auth/react";
import { useBranding } from "@/context/branding-context";
import Image from "next/image";

export function Sidebar({
    dict,
    serverBusinessType = "",
    serverRole = "",
    serverLogoUrl = null,
    serverLogoOrientation = "SQUARE",
    serverLogoHeight = 64
}: {
    dict: any;
    serverBusinessType?: string;
    serverRole?: string;
    serverLogoUrl?: string | null;
    serverLogoOrientation?: "HORIZONTAL" | "VERTICAL" | "SQUARE";
    serverLogoHeight?: number;
}) {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const locale = pathname.split("/")[1] || "es";
    const t = dict.dashboard.sidebar;

    // Usar valores del servidor como fallback mientras carga la sesión
    const businessType = session?.user?.businessType || serverBusinessType;
    const role = session?.user?.role || serverRole;
    const isLoading = status === "loading" && !serverBusinessType;

    // Debug: Monitor session state
    if (status === "authenticated") {
        console.log("Sidebar: Session Loaded", { role, businessType, status });
        console.log("🔍 DEBUG - Role normalizado:", role?.toUpperCase().trim());
        console.log("🔍 DEBUG - ¿Es SUPERADMIN?", role?.toUpperCase().trim() === "SUPERADMIN");
    }

    // Definir rutas con grupos y colores del nuevo sistema de diseño
    const allRoutes = [
        // Dashboard
        {
            label: "Dashboard Principal",
            icon: LayoutDashboard,
            href: "/dashboard",
            moduleColor: "var(--module-dashboard)",
            group: "Dashboard",
            allowedTypes: ["RETAIL", "SERVICE", "SCHOOL", "RESTAURANT"],
            allowedRoles: ["OWNER", "ADMIN", "MANAGER", "CASHIER", "WAITER", "RECEPTIONIST", "TEACHER"]
        },
        {
            label: "Dashboard Ejecutivo",
            icon: TrendingUp,
            href: "/dashboard/executive",
            moduleColor: "var(--module-dashboard)",
            group: "Dashboard",
            allowedTypes: ["RETAIL", "RESTAURANT", "SCHOOL", "SERVICE"],
            allowedRoles: ["OWNER", "ADMIN"]
        },
        {
            label: "Inventario",
            icon: Package,
            href: "/dashboard/inventory",
            moduleColor: "var(--module-inventory)",
            group: "Inventario",
            allowedTypes: ["RETAIL", "RESTAURANT", "SERVICE"],
            allowedRoles: ["OWNER", "ADMIN", "MANAGER"]
        },

        // Personas - Solo para tipos de negocio sin módulo propio de personal
        {
            label: t.employees,
            icon: Users,
            href: "/dashboard/employees",
            moduleColor: "var(--module-employees)",
            group: "Personas",
            allowedTypes: ["RETAIL", "SERVICE"], // SCHOOL y RESTAURANT tienen personal en sus pestañas
            allowedRoles: ["OWNER", "ADMIN", "HR"]
        },

        // Escuela - Un solo enlace con pestañas internas (incluye Cursos, Alumnos, Padres, Calificaciones, Asistencia, Personal, Comunicación)
        {
            label: "Escuela",
            icon: GraduationCap,
            href: "/dashboard/school",
            moduleColor: "var(--module-courses)",
            group: "Escuela",
            allowedTypes: ["SCHOOL"],
            allowedRoles: ["OWNER", "ADMIN", "TEACHER", "RECEPTIONIST"]
        },

        // Restaurante - Un solo enlace con pestañas internas (incluye Mesas, Cocina, Órdenes, Reservaciones, Staff)
        {
            label: "Restaurante",
            icon: Utensils,
            href: "/dashboard/restaurant",
            moduleColor: "var(--module-restaurant)",
            group: "Restaurante",
            allowedTypes: ["RESTAURANT"],
            allowedRoles: ["OWNER", "ADMIN", "WAITER", "MANAGER"]
        },

        // Tienda - Un solo enlace con pestañas internas (incluye POS, Inventario, Clientes, Proveedores, Historial, Caja, Staff)
        {
            label: "Tienda",
            icon: ShoppingCart,
            href: "/dashboard/store",
            moduleColor: "var(--module-sales)",
            group: "Tienda",
            allowedTypes: ["RETAIL"],
            allowedRoles: ["OWNER", "ADMIN", "CASHIER", "MANAGER"]
        },

        {
            label: "Finanzas",
            icon: DollarSign,
            href: "/dashboard/finance",
            moduleColor: "var(--module-finance)",
            group: "Finanzas",
            allowedTypes: ["SCHOOL"],
            allowedRoles: ["OWNER", "ADMIN", "ACCOUNTANT"]
        },
        {
            label: "Comisiones",
            icon: DollarSign,
            href: "/dashboard/commissions",
            moduleColor: "var(--module-finance)",
            group: "Finanzas",
            allowedTypes: ["SCHOOL"],
            allowedRoles: ["OWNER", "ADMIN", "ACCOUNTANT"]
        },
        {
            label: "Ventas",
            icon: ShoppingCart,
            href: "/dashboard/sales",
            moduleColor: "var(--module-sales)",
            group: "Finanzas",
            allowedTypes: ["RETAIL", "RESTAURANT", "SERVICE"],
            allowedRoles: ["OWNER", "ADMIN", "CASHIER"]
        },
        {
            label: "Contabilidad",
            icon: FileText,
            href: "/dashboard/accounting",
            moduleColor: "var(--module-finance)",
            group: "Finanzas",
            allowedTypes: ["RETAIL", "RESTAURANT", "SCHOOL", "SERVICE"],
            allowedRoles: ["OWNER", "ADMIN", "ACCOUNTANT"]
        },
        {
            label: t.reports,
            icon: FileText,
            href: "/dashboard/reports",
            moduleColor: "var(--module-reports)",
            group: "Finanzas",
            allowedTypes: ["RETAIL", "RESTAURANT", "SCHOOL", "SERVICE"],
            allowedRoles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"]
        },

        // Administración
        {
            label: "Importar Datos",
            icon: Upload,
            href: "/dashboard/settings/import",
            moduleColor: "var(--muted-text)",
            group: "Administración",
            allowedTypes: ["SCHOOL"],
            allowedRoles: ["OWNER", "ADMIN"]
        },
        {
            label: t.settings,
            icon: Settings,
            href: "/dashboard/settings",
            moduleColor: "var(--muted-text)",
            group: "Administración",
            allowedTypes: ["RETAIL", "RESTAURANT", "SCHOOL", "SERVICE"],
            allowedRoles: ["OWNER", "ADMIN"]
        },
        {
            label: "Panel de Admin",
            icon: Settings,
            href: "/dashboard/admin",
            moduleColor: "var(--muted-text)",
            group: "Super Admin",
            allowedTypes: ["RETAIL", "RESTAURANT", "SCHOOL", "SERVICE"],
            allowedRoles: ["SUPERADMIN"]
        },
        {
            label: "Gestión de Negocios",
            icon: Building2,
            href: "/dashboard/admin/businesses",
            moduleColor: "var(--muted-text)",
            group: "Super Admin",
            allowedTypes: ["RETAIL", "RESTAURANT", "SCHOOL", "SERVICE"],
            allowedRoles: ["SUPERADMIN"]
        },
        {
            label: "Gestión de Planes",
            icon: CreditCard,
            href: "/dashboard/admin/plans",
            moduleColor: "var(--muted-text)",
            group: "Super Admin",
            allowedTypes: ["RETAIL", "RESTAURANT", "SCHOOL", "SERVICE"],
            allowedRoles: ["SUPERADMIN"]
        },
    ];

    // Normalizar role y type para comparaciones seguras
    const currentRole = role?.toUpperCase().trim();
    const currentType = businessType?.toUpperCase().trim();

    // Filtrar rutas por tipo de negocio y rol con bypass para OWNER
    const routes = allRoutes.filter(route => {
        // En estado de carga, mostramos todo por petición del usuario (menú azul)
        if (isLoading) return true;

        // SUPERADMIN ve TODO sin restricciones
        if (currentRole === "SUPERADMIN") {
            return true;
        }

        // Validar tipo de negocio (siempre obligatorio si está definido en la ruta)
        const typeMatch = !currentType || route.allowedTypes.includes(currentType as any);

        // Bypass total para OWNER y ADMIN (ven todo lo de su tipo de negocio)
        if (currentRole === "OWNER" || currentRole === "ADMIN") {
            return typeMatch;
        }

        // Filtro normal para otros roles
        const roleMatch = !currentRole || route.allowedRoles.includes(currentRole as any);
        return typeMatch && roleMatch;
    });

    console.log("🔍 DEBUG - Total rutas filtradas:", routes.length);
    console.log("🔍 DEBUG - Rutas de Super Admin:", routes.filter(r => r.group === "Super Admin").map(r => r.label));

    // Agrupar rutas
    const groupedRoutes = routes.reduce((acc, route) => {
        const group = route.group || "Otros";
        if (!acc[group]) acc[group] = [];
        acc[group].push(route);
        return acc;
    }, {} as Record<string, typeof routes>);

    const groupOrder = ["Super Admin", "Dashboard", "Personas", "Escuela", "Restaurante", "Tienda", "Finanzas", "Inventario", "Administración"];

    const branding = useBranding();

    // Usar valores del contexto cuando ya cargó, de lo contrario usar valores del servidor
    const logoUrl = branding.loading ? serverLogoUrl : (branding.logoUrl || serverLogoUrl);
    const logoOrientation = branding.loading ? serverLogoOrientation : branding.logoOrientation;
    const logoHeight = branding.loading ? serverLogoHeight : branding.logoHeight;

    // Debug logo
    if (logoUrl) {
        console.log("Sidebar: Rendering logo", { logoUrl, logoOrientation, logoHeight });
    }

    return (
        <div className="sidebar flex flex-col h-full" style={{ backgroundColor: 'inherit' }}>
            <div className="flex-none">
                <Link href={`/${locale}/dashboard`} className={cn("sidebar-brand block", logoUrl && "px-4 py-4 h-auto")}>
                    {logoUrl ? (
                        <div
                            className="relative flex items-center justify-center w-full overflow-hidden"
                            style={{
                                height: logoHeight ? `${logoHeight}px` : (logoOrientation === "VERTICAL" ? "96px" : "64px"),
                                maxWidth: '100%'
                            }}
                        >
                            <Image
                                src={logoUrl}
                                alt="Logo"
                                fill
                                sizes="(max-width: 768px) 200px, 250px"
                                className="object-contain"
                                style={{
                                    objectFit: 'contain',
                                    objectPosition: 'center'
                                }}
                                priority
                                unoptimized={logoUrl.endsWith('.svg')}
                            />
                        </div>
                    ) : (
                        "Admnegocios"
                    )}
                </Link>
            </div>

            {/* Contenedor con scroll */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    minHeight: 0,
                    paddingLeft: "0.75rem",
                    paddingRight: "0.75rem",
                    paddingTop: "var(--spacing-sm)",
                    paddingBottom: "var(--spacing-lg)"
                }}
            >
                {groupOrder.map((groupName) => {
                    const groupRoutes = groupedRoutes[groupName];
                    if (!groupRoutes || groupRoutes.length === 0) return null;

                    return (
                        <div key={groupName} style={{ marginBottom: "var(--spacing-md)" }}>
                            {/* Group Label */}
                            <div
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    color: "rgba(255, 255, 255, 0.4)",
                                    padding: "var(--spacing-xs) var(--spacing-md)",
                                    marginBottom: "var(--spacing-xs)"
                                }}
                            >
                                {groupName}
                            </div>

                            {/* Group Items */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                {groupRoutes.map((route) => {
                                    const href = `/${locale}${route.href}`;
                                    const isActive = pathname === href || pathname.startsWith(`${href}/`);

                                    return (
                                        <Link
                                            key={route.href}
                                            href={href}
                                            className={cn(
                                                "sidebar-link",
                                                isActive && "active"
                                            )}
                                        >
                                            <route.icon
                                                size={20}
                                                style={{ color: isActive ? route.moduleColor : "inherit" }}
                                            />
                                            <span>{route.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="px-3 py-2 flex-none mt-auto">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10 gap-4"
                    onClick={() => signOut({ callbackUrl: "/" })}
                >
                    <LogOut className="h-5 w-5" />
                    {t.logout}
                </Button>
            </div>
        </div>
    );
}
