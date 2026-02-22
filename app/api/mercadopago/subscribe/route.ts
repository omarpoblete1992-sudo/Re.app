import { NextResponse } from "next/server"
import client from "@/lib/mercadopago"
import { PreApproval } from "mercadopago"

export async function POST(req: Request) {
    try {
        const { userId, userEmail } = await req.json()

        const preApproval = new PreApproval(client)

        const result = await preApproval.create({
            body: {
                preapproval_plan_id: process.env.MP_PLAN_ID!,
                payer_email: userEmail,
                external_reference: userId,
                back_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
                status: "pending",
            },
        })

        return NextResponse.json({ init_point: result.init_point })
    } catch (error) {
        console.error("[MERCADOPAGO_ERROR]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
