import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ productId: string }> };

export async function DELETE(req: Request, { params }: RouteParams) {
    const { productId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Delete inventory first, then product
        await prisma.inventoryItem.deleteMany({
            where: { productId }
        });

        await prisma.product.delete({
            where: { id: productId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: RouteParams) {
    const { productId } = await params;
    console.log("==== PATCH START ====");
    console.log("Product ID:", productId);

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        console.log("Unauthorized");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        console.log("Body received:", JSON.stringify(body, null, 2));

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });
        console.log("User found:", user?.id);

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Simple update - just name and price first
        const updateData: Record<string, any> = {};

        if (body.name) updateData.name = String(body.name);
        if (body.price !== undefined) updateData.price = Number(body.price);
        if (body.sku !== undefined) updateData.sku = body.sku ? String(body.sku) : null;
        if (body.category !== undefined) updateData.category = body.category ? String(body.category) : null;

        console.log("Update data:", JSON.stringify(updateData, null, 2));

        // Update product
        const product = await prisma.product.update({
            where: { id: productId },
            data: updateData
        });
        console.log("Product updated:", product.id);

        // Update inventory if quantity provided
        if (body.quantity !== undefined) {
            console.log("Updating quantity:", body.quantity);
            const branchId = user.branchId || (await prisma.branch.findFirst({
                where: { businessId: user.businessId }
            }))?.id;

            console.log("Branch ID:", branchId);

            if (branchId) {
                await prisma.inventoryItem.upsert({
                    where: {
                        productId_branchId: {
                            productId: productId,
                            branchId: branchId
                        }
                    },
                    update: { quantity: Number(body.quantity) },
                    create: {
                        productId: productId,
                        branchId: branchId,
                        quantity: Number(body.quantity)
                    }
                });
                console.log("Inventory updated");
            }
        }

        console.log("==== PATCH SUCCESS ====");
        return NextResponse.json(product);
    } catch (error: any) {
        console.error("==== PATCH ERROR ====");
        console.error("Error name:", error?.name);
        console.error("Error message:", error?.message);
        console.error("Error stack:", error?.stack);
        return NextResponse.json({
            error: "Internal Error",
            details: error?.message,
            name: error?.name
        }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: RouteParams) {
    const { productId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { inventory: true }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
