import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "month";
        const branchId = searchParams.get("branchId");
        const forceModules = searchParams.get("modules"); // For superadmin to force specific modules

        const isSuperAdmin = session.user.role === "SUPERADMIN";
        const businessId = session.user.businessId;

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case "week":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "year":
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case "month":
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        // For superadmin, allow viewing all modules or specific ones via query param
        let enabledModules: string[] = [];

        if (forceModules) {
            // Superadmin forcing specific modules via query string
            enabledModules = forceModules.split(",");
        } else if (isSuperAdmin && !businessId) {
            // Superadmin without business - show all modules
            enabledModules = ["SCHOOL", "RETAIL", "RESTAURANT", "SERVICE"];
        } else if (businessId) {
            // Normal user with business - detect from business config
            const business = await prisma.business.findUnique({
                where: { id: businessId },
                select: { enabledModules: true, type: true }
            });

            try {
                enabledModules = business?.enabledModules ? JSON.parse(business.enabledModules) : [];
            } catch {
                enabledModules = business?.type ? [business.type] : [];
            }
            if (enabledModules.length === 0 && business?.type) {
                enabledModules = [business.type];
            }
        } else {
            // User without business - show demo with all modules
            enabledModules = ["SCHOOL", "RETAIL", "RESTAURANT", "SERVICE"];
        }

        // Initialize response
        const response: any = {
            period,
            enabledModules,
            school: null,
            retail: null,
            restaurant: null,
            services: null
        };

        // SCHOOL REPORTS
        if (enabledModules.includes("SCHOOL")) {
            const studentFilter = branchId
                ? { branches: { some: { id: branchId } }, status: "ACTIVE" }
                : { businessId, status: "ACTIVE" };

            const employeeFilter = branchId
                ? { branches: { some: { id: branchId } }, role: "TEACHER", status: "ACTIVE" }
                : { businessId, role: "TEACHER", status: "ACTIVE" } as any;

            const [students, payments, employees] = await Promise.all([
                prisma.student.count({
                    where: studentFilter
                }),
                prisma.studentPayment.findMany({
                    where: {
                        date: { gte: startDate },
                        studentFee: {
                            student: branchId
                                ? { branches: { some: { id: branchId } } }
                                : { businessId }
                        }
                    },
                    select: { amount: true, teacherCommission: true }
                }),
                prisma.employee.count({
                    where: employeeFilter
                })
            ]);

            const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
            const totalCommissions = payments.reduce((sum, p) => sum + (p.teacherCommission || 0), 0);

            response.school = {
                students,
                teachers: employees,
                revenue: totalRevenue,
                commissions: totalCommissions,
                netRevenue: totalRevenue - totalCommissions
            };
        }

        // RETAIL REPORTS
        if (enabledModules.includes("RETAIL")) {
            const saleFilter = branchId
                ? { branchId, createdAt: { gte: startDate } }
                : { branch: { businessId }, createdAt: { gte: startDate } };

            const [sales, products] = await Promise.all([
                prisma.sale.findMany({
                    where: saleFilter,
                    select: { total: true }
                }),
                prisma.product.count({
                    where: { businessId }
                })
            ]);

            const totalSales = sales.reduce((sum, s) => sum + s.total, 0);

            response.retail = {
                salesCount: sales.length,
                totalSales,
                avgTicket: sales.length > 0 ? totalSales / sales.length : 0,
                products
            };
        }

        // RESTAURANT REPORTS
        if (enabledModules.includes("RESTAURANT")) {
            const orderFilter = branchId
                ? { branchId, createdAt: { gte: startDate } }
                : { businessId, createdAt: { gte: startDate } };

            const tableFilter = branchId
                ? { branchId }
                : { businessId };

            const [orders, tables] = await Promise.all([
                prisma.order.findMany({
                    where: orderFilter,
                    select: { total: true, status: true }
                }),
                prisma.table.count({
                    where: tableFilter
                })
            ]);

            const completedOrders = orders.filter(o => o.status === "COMPLETED" || o.status === "PAID");
            const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

            response.restaurant = {
                ordersCount: orders.length,
                completedOrders: completedOrders.length,
                totalRevenue,
                avgTicket: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
                tables
            };
        }

        // SERVICES REPORTS
        if (enabledModules.includes("SERVICE")) {
            const appointmentFilter = branchId
                ? { branchId, startTime: { gte: startDate } }
                : { branch: { businessId }, startTime: { gte: startDate } };

            const appointments = await prisma.appointment.findMany({
                where: appointmentFilter,
                select: {
                    status: true,
                    service: { select: { price: true } }
                }
            });

            const completed = appointments.filter(a => a.status === "COMPLETED");
            const cancelled = appointments.filter(a => a.status === "CANCELLED");
            const totalRevenue = completed.reduce((sum, a) => sum + (a.service?.price || 0), 0);

            response.services = {
                totalAppointments: appointments.length,
                completed: completed.length,
                cancelled: cancelled.length,
                completionRate: appointments.length > 0 ? (completed.length / appointments.length) * 100 : 0,
                totalRevenue
            };
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching report summary:", error);
        return NextResponse.json({ error: "Error al obtener reportes" }, { status: 500 });
    }
}
