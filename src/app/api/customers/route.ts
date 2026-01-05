import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const customerSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    taxId: z.string().optional(),
    legalName: z.string().optional(),
    taxRegime: z.string().optional(),
    taxZipCode: z.string().optional(),
    cfdiUse: z.string().optional(),
    taxEmail: z.string().email().optional().or(z.literal(""))
});

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");

        const where: any = {
            businessId: session.user.businessId
        };

        if (query) {
            where.OR = [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { taxId: { contains: query, mode: "insensitive" } },
                { legalName: { contains: query, mode: "insensitive" } }
            ];
        }

        const customers = await prisma.customer.findMany({
            where,
            orderBy: { name: 'asc' },
            take: 20
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.error("[CUSTOMERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const validation = customerSchema.safeParse(body);

        if (!validation.success) {
            return new NextResponse(validation.error.message, { status: 400 });
        }

        const { name, email, phone, taxId, legalName, taxRegime, taxZipCode, cfdiUse, taxEmail } = validation.data;

        // Validar RFC duplicado si se proporciona? 
        // Por ahora permitimos duplicados en diferentes clientes (ej. sucursales de un mismo cliente)
        // O mejor restringimos si ya existe un cliente con ese RFC en el mismo negocio.
        if (taxId) {
            const existing = await prisma.customer.findFirst({
                where: {
                    businessId: session.user.businessId,
                    taxId: taxId
                }
            });
            // No bloqueamos, porque puede ser intencional.
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                taxId: taxId || null,
                legalName: legalName || null,
                taxRegime: taxRegime || null,
                taxZipCode: taxZipCode || null,
                cfdiUse: cfdiUse || null,
                taxEmail: taxEmail || null,
                businessId: session.user.businessId
            }
        });

        return NextResponse.json(customer);
    } catch (error) {
        console.error("[CUSTOMERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
