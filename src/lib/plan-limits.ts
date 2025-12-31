import { prisma } from "./prisma";

export type ResourceType = "courses" | "teachers" | "students" | "branches" | "inventory";

export interface LimitCheckResult {
    allowed: boolean;
    limit?: number;
    current: number;
    planName: string;
    message?: string;
}

/**
 * Verifica si un negocio puede crear un nuevo recurso basado en su plan
 */
export async function checkLimit(
    businessId: string,
    resource: ResourceType
): Promise<LimitCheckResult> {
    // Obtener negocio con su plan
    const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { plan: true }
    });

    if (!business) {
        throw new Error("Business not found");
    }

    // Si no tiene plan, usar Free por defecto
    const plan = business.plan || await prisma.plan.findUnique({ where: { id: "free" } });

    if (!plan) {
        throw new Error("No plan found");
    }

    // Mapear recurso a campo de límite y contador
    const limits: Record<ResourceType, { max: keyof typeof plan; count: keyof typeof business }> = {
        courses: { max: "maxCourses", count: "coursesCount" },
        teachers: { max: "maxTeachers", count: "teachersCount" },
        students: { max: "maxStudents", count: "studentsCount" },
        branches: { max: "maxBranches", count: "coursesCount" }, // Usamos coursesCount temporalmente
        inventory: { max: "maxInventoryItems", count: "inventoryCount" }
    };

    const { max, count } = limits[resource];
    const limit = plan[max] as number | null;
    const current = business[count] as number;

    // Si el límite es null, es ilimitado
    if (limit === null) {
        return {
            allowed: true,
            limit: undefined,
            current,
            planName: plan.name,
            message: "Plan ilimitado"
        };
    }

    // Verificar si puede crear más
    const allowed = current < limit;

    return {
        allowed,
        limit,
        current,
        planName: plan.name,
        message: allowed
            ? `Puedes crear ${limit - current} más`
            : `Has alcanzado el límite de ${limit} ${resource}. Actualiza tu plan.`
    };
}

/**
 * Incrementa el contador de un recurso
 */
export async function incrementResourceCount(
    businessId: string,
    resource: ResourceType
) {
    const counters: Record<ResourceType, string> = {
        courses: "coursesCount",
        teachers: "teachersCount",
        students: "studentsCount",
        branches: "coursesCount", // temporal
        inventory: "inventoryCount"
    };

    const field = counters[resource] as "coursesCount" | "teachersCount" | "studentsCount" | "inventoryCount";

    await prisma.business.update({
        where: { id: businessId },
        data: {
            [field]: {
                increment: 1
            }
        }
    });
}

/**
 * Decrementa el contador de un recurso
 */
export async function decrementResourceCount(
    businessId: string,
    resource: ResourceType
) {
    const counters: Record<ResourceType, string> = {
        courses: "coursesCount",
        teachers: "teachersCount",
        students: "studentsCount",
        branches: "coursesCount", // temporal
        inventory: "inventoryCount"
    };

    const field = counters[resource] as "coursesCount" | "teachersCount" | "studentsCount" | "inventoryCount";

    await prisma.business.update({
        where: { id: businessId },
        data: {
            [field]: {
                decrement: 1
            }
        }
    });
}

/**
 * Recalcula los contadores de un negocio basado en los datos reales
 */
export async function recalculateBusinessCounters(businessId: string) {
    const [coursesCount, studentsCount] = await Promise.all([
        prisma.course.count({ where: { businessId } }),
        prisma.student.count({ where: { businessId } }),
    ]);

    // Contar maestros (empleados con rol TEACHER que tienen cursos asignados)
    const teachersCount = await prisma.employee.count({
        where: {
            businessId,
            role: "TEACHER"
        }
    });

    const inventoryCount = await prisma.product.count({ where: { businessId } });

    await prisma.business.update({
        where: { id: businessId },
        data: {
            coursesCount,
            teachersCount,
            studentsCount,
            inventoryCount
        }
    });

    return { coursesCount, teachersCount, studentsCount, inventoryCount };
}
