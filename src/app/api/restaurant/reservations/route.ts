"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET - Obtener reservaciones
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date"); // YYYY-MM-DD
        const status = searchParams.get("status");
        const tableId = searchParams.get("tableId");

        // Construir filtros
        const where: any = {
            businessId: session.user.businessId,
        };

        // Filtrar por fecha (día completo)
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            where.date = {
                gte: startDate,
                lte: endDate,
            };
        }

        if (status) {
            where.status = status;
        }

        if (tableId) {
            where.tableId = tableId;
        }

        const reservations = await prisma.reservation.findMany({
            where,
            include: {
                table: {
                    select: {
                        id: true,
                        name: true,
                        capacity: true,
                    },
                },
            },
            orderBy: {
                date: "asc",
            },
        });

        return NextResponse.json(reservations);
    } catch (error) {
        console.error("Error fetching reservations:", error);
        return NextResponse.json(
            { error: "Error al obtener reservaciones" },
            { status: 500 }
        );
    }
}

// POST - Crear nueva reservación
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { customerName, phone, email, partySize, date, duration, tableId, notes } = body;

        // Validaciones
        if (!customerName || !partySize || !date) {
            return NextResponse.json(
                { error: "Nombre del cliente, número de personas y fecha son requeridos" },
                { status: 400 }
            );
        }

        // Verificar disponibilidad de la mesa si se especificó
        if (tableId) {
            const reservationDate = new Date(date);
            const endTime = new Date(reservationDate.getTime() + (duration || 90) * 60000);

            // Buscar conflictos
            const conflicts = await prisma.reservation.findMany({
                where: {
                    tableId,
                    status: { in: ["PENDING", "CONFIRMED"] },
                    OR: [
                        {
                            date: { lte: reservationDate },
                            AND: {
                                date: {
                                    gte: new Date(reservationDate.getTime() - (duration || 90) * 60000)
                                }
                            }
                        }
                    ]
                }
            });

            if (conflicts.length > 0) {
                return NextResponse.json(
                    { error: "La mesa ya tiene una reservación en ese horario" },
                    { status: 409 }
                );
            }
        }

        const reservation = await prisma.reservation.create({
            data: {
                customerName,
                phone: phone || null,
                email: email || null,
                partySize: parseInt(partySize),
                date: new Date(date),
                duration: duration || 90,
                tableId: tableId || null,
                notes: notes || null,
                businessId: session.user.businessId,
                branchId: null, // branchId se puede añadir cuando el tipo User lo soporte
                status: "PENDING",
            },
            include: {
                table: {
                    select: {
                        id: true,
                        name: true,
                        capacity: true,
                    },
                },
            },
        });

        return NextResponse.json(reservation, { status: 201 });
    } catch (error) {
        console.error("Error creating reservation:", error);
        return NextResponse.json(
            { error: "Error al crear reservación" },
            { status: 500 }
        );
    }
}

// PUT - Actualizar reservación
export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { id, status, customerName, phone, email, partySize, date, duration, tableId, notes } = body;

        if (!id) {
            return NextResponse.json(
                { error: "ID de reservación requerido" },
                { status: 400 }
            );
        }

        // Verificar que la reservación pertenece al negocio
        const existing = await prisma.reservation.findFirst({
            where: {
                id,
                businessId: session.user.businessId,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Reservación no encontrada" },
                { status: 404 }
            );
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (customerName) updateData.customerName = customerName;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (partySize) updateData.partySize = parseInt(partySize);
        if (date) updateData.date = new Date(date);
        if (duration) updateData.duration = duration;
        if (tableId !== undefined) updateData.tableId = tableId || null;
        if (notes !== undefined) updateData.notes = notes;

        const reservation = await prisma.reservation.update({
            where: { id },
            data: updateData,
            include: {
                table: {
                    select: {
                        id: true,
                        name: true,
                        capacity: true,
                    },
                },
            },
        });

        return NextResponse.json(reservation);
    } catch (error) {
        console.error("Error updating reservation:", error);
        return NextResponse.json(
            { error: "Error al actualizar reservación" },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar reservación
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "ID de reservación requerido" },
                { status: 400 }
            );
        }

        // Verificar que la reservación pertenece al negocio
        const existing = await prisma.reservation.findFirst({
            where: {
                id,
                businessId: session.user.businessId,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Reservación no encontrada" },
                { status: 404 }
            );
        }

        await prisma.reservation.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting reservation:", error);
        return NextResponse.json(
            { error: "Error al eliminar reservación" },
            { status: 500 }
        );
    }
}
