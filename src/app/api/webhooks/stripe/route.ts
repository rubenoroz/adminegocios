import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        if (!webhookSecret) {
            // For basic local testing with no secret set, we might skip signature verification
            // BUT it is unsafe. Better to require it or guide user to set it.
            // Let's assume user will set it via CLI `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
            throw new Error("Missing STRIPE_WEBHOOK_SECRET");
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
        console.error(`Webhook Error: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract metadata
        const planId = session.metadata?.planId;
        const userId = session.metadata?.userId;

        if (planId && userId) {
            try {
                // Find the user to get their businessId
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    include: { business: true } // verify business exists
                });

                if (user && user.businessId) {
                    // Update the business with the new plan
                    await prisma.business.update({
                        where: { id: user.businessId },
                        data: {
                            planId: planId
                        }
                    });
                    console.log(`[STRIPE WEBHOOK] Plan updated for Business: ${user.businessId} -> Plan: ${planId}`);
                } else {
                    console.error(`[STRIPE WEBHOOK] User or Business not found for userId: ${userId}`);
                }

            } catch (error) {
                console.error("[STRIPE WEBHOOK] Database update failed:", error);
                return new NextResponse("Database Error", { status: 500 });
            }
        }
    }

    return new NextResponse(null, { status: 200 });
}
