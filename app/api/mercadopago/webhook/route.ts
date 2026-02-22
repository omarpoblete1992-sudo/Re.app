import { NextResponse } from "next/server"
import { PreApproval } from "mercadopago"
import client from "@/lib/mercadopago"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// MercadoPago sends IPN (Instant Payment Notifications) here
// when a subscription status changes (authorized, paused, cancelled, etc.)
export async function POST(req: Request) {
    try {
        const { type, data } = await req.json()

        // We only care about preapproval (subscription) events
        if (type !== "preapproval") {
            return NextResponse.json({ received: true })
        }

        const preApprovalId = data?.id
        if (!preApprovalId) {
            return new NextResponse("Missing preapproval id", { status: 400 })
        }

        // Fetch the full preapproval object from MercadoPago
        const preApproval = new PreApproval(client)
        const subscription = await preApproval.get({ id: preApprovalId })

        const userId = subscription.external_reference
        const status = subscription.status // "authorized" | "paused" | "cancelled" | "pending"

        if (!userId) {
            return new NextResponse("Missing external_reference (userId)", { status: 400 })
        }

        // Update the user's subscription status in Firestore
        const userRef = doc(db, "users", userId)
        await updateDoc(userRef, {
            subscriptionStatus: status,
            subscriptionId: preApprovalId,
            subscriptionUpdatedAt: new Date().toISOString(),
        })

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("[MERCADOPAGO_WEBHOOK_ERROR]", error)
        return new NextResponse("Webhook Error", { status: 500 })
    }
}
