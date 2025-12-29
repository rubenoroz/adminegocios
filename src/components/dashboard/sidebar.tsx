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
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

import { useSession } from "next-auth/react";
import { useBranding } from "@/context/branding-context";
import Image from "next/image";

export function Sidebar({ dict }: { dict: any }) {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const locale = pathname.split("/")[1] || "es";
    const t = dict.dashboard.sidebar;
    const businessType = session?.user?.businessType;
    const role = session?.user?.role;
    const isLoading = status === "loading";

    // Debug: Monitor session state
    if (session?.user) {
        console.log("Sidebar: Session Loaded", { role, businessType, status });
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

        // Personas
        {
            label: t.employees,
            icon: Users,
            href: "/dashboard/employees",
            moduleColor: "var(--module-employees)",
            group: "Personas",
            allowedTypes: ["RETAIL", "RESTAURANT", "SCHOOL", "SERVICE"],
            allowedRoles: ["OWNER", "ADMIN", "HR"]
        },
        {
            label: t.students,
            icon: GraduationCap,
            href: "/dashboard/students",
            moduleColor: "var(--module-students)",
            group: "Personas",
            allowedTypes: ["SCHOOL"],
            allowedRoles: ["OWNER", "ADMIN", "TEACHER", "RECEPTIONIST"]
        },
        {
            label: "Padres",
            icon: Users,
            href: "/dashboard/parents",
            moduleColor: "var(--module-students)",
            group: "Personas",
            allowedTypes: ["SCHOOL"],
            allowedRoles: ["OWNER", "ADMIN", "RECEPTIONIST"]
        },

        // Escuela
        {
            label: t.courses,
            icon: BookOpen,
            href: "/dashboard/courses",
            moduleColor: "var(--module-courses)",
            group: "Escuela",
            allowedTypes: ["SCHOOL"],
            allowedRoles: ["OWNER", "ADMIN", "TEACHER"]
        },
        {
            label: "Calificaciones",
            icon: FileText,
            href: "/dashboard/grades",
            moduleColor: "var(--module-courses)",
            group: "Escuela",
            allowedTypes: ["SCHOOL"],
            allowedRoles: ["OWNER", "ADMIN", "TEACHER"]
        },
        {
            label: "Asistencia",
            icon: FileText,
            href: "/dashboard/attendance",
            moduleColor: "var(--module-attendance)",
            group: "Escuela",
            allowedTypes: ["SCHOOL"],
            allowedRoles: ["OWNER", "ADMIN", "TEACHER"]
        },
        {
            label: "Comunicación",
            icon: Megaphone,
            href: "/dashboard/communication",
            moduleColor: "var(--module-communication)",
            group: "Escuela",
            allowedTypes: ["SCHOOL"],
            allowedRoles: ["OWNER", "ADMIN", "TEACHER"]
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
            allowedTypes: ["RETAIL", "RESTAURANT", "SCHOOL", "SERVICE"],
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
            label: "Restaurante",
            icon: Utensils,
            href: "/dashboard/restaurant",
            moduleColor: "var(--module-restaurant)",
            group: "Restaurante",
            allowedTypes: ["RESTAURANT"],
            allowedRoles: ["OWNER", "ADMIN", "WAITER", "MANAGER"]
        },
    ];

    // Normalizar role y type para comparaciones seguras
    const currentRole = role?.toUpperCase().trim();
    const currentType = businessType?.toUpperCase().trim();

    // Filtrar rutas por tipo de negocio y rol con bypass para OWNER
    const routes = allRoutes.filter(route => {
        // En estado de carga, mostramos todo por petición del usuario (menú azul)
        if (isLoading) return true;

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

    // Agrupar rutas
    const groupedRoutes = routes.reduce((acc, route) => {
        const group = route.group || "Otros";
        if (!acc[group]) acc[group] = [];
        acc[group].push(route);
        return acc;
    }, {} as Record<string, typeof routes>);

    const groupOrder = ["Dashboard", "Personas", "Escuela", "Finanzas", "Inventario", "Restaurante", "Administración"];

    const { logoUrl, logoOrientation, sidebarColor, logoHeight } = useBranding();

    // Debug logo
    if (logoUrl) {
        console.log("Sidebar: Rendering logo", { logoUrl, logoOrientation, logoHeight });
    }

    return (
        <div className="sidebar flex flex-col h-full" style={{ backgroundColor: sidebarColor }}>
            <div className="flex-none">
                <Link href={`/${locale}/dashboard`} className={cn("sidebar-brand block", logoUrl && "px-4 py-4 h-auto")}>
                    {logoUrl ? (
                        <div
                            className={cn(
                                "relative flex items-center justify-center w-full",
                                // Default classes as fallback
                                logoOrientation === "HORIZONTAL" ? "h-16" :
                                    logoOrientation === "VERTICAL" ? "h-24" : "h-16"
                            )}
                            style={{
                                height: logoHeight ? `${logoHeight}px` : (logoOrientation === "VERTICAL" ? "96px" : "64px")
                            }}
                        >
                            <Image
                                src={logoUrl}
                                alt="Logo"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-contain"
                                priority
                                unoptimized={logoUrl.endsWith('.svg')}
                            />
                        </div>
                    ) : (
                        "Adminegocios"
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
