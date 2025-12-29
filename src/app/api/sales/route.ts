import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { items, total, paymentMethod } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "No items in sale" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId || !user?.branchId) {
            // Fallback to finding the first branch if not set on user (for MVP)
            if (user?.businessId && !user?.branchId) {
                const branch = await prisma.branch.findFirst({ where: { businessId: user.businessId } });
                if (branch) user.branchId = branch.id;
            }

            if (!user?.branchId) {
                return NextResponse.json({ error: "Branch not found for user" }, { status: 400 });
            }
        }

        // Transaction to ensure data integrity
        const sale = await prisma.$transaction(async (tx) => {
            // 1. Create Sale Record
            const newSale = await tx.sale.create({
                data: {
                    total,
                    status: "COMPLETED",
                    paymentMethod,
                    branchId: user.branchId!,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            });

            // 2. Update Inventory
            for (const item of items) {
                await tx.inventoryItem.updateMany({
                    where: {
                        productId: item.productId,
                        branchId: user.branchId!
                    },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            return newSale;
        });

        return NextResponse.json(sale);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
