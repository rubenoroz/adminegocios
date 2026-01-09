import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Replace all student links for a customer
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const { studentIds } = await req.json();

        // Verify customer belongs to this business
        const customer = await prisma.customer.findFirst({
            where: { id, businessId: session.user.businessId }
        });

        if (!customer) {
            return new NextResponse("Customer not found", { status: 404 });
        }

        // Verify all students belong to this business
        const students = await prisma.student.findMany({
            where: {
                id: { in: studentIds },
                businessId: session.user.businessId
            },
            select: { id: true }
        });

        const validStudentIds = students.map(s => s.id);

        // Update customer with new student links (replace all)
        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                students: {
                    set: validStudentIds.map(sid => ({ id: sid }))
                }
            },
            include: {
                students: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        matricula: true
                    }
                }
            }
        });

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        console.error("[CUSTOMER_STUDENTS_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// GET - Get students linked to a customer
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const customer = await prisma.customer.findFirst({
            where: { id, businessId: session.user.businessId },
            include: {
                students: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        matricula: true
                    }
                }
            }
        });

        if (!customer) {
            return new NextResponse("Customer not found", { status: 404 });
        }

        return NextResponse.json(customer.students);
    } catch (error) {
        console.error("[CUSTOMER_STUDENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
