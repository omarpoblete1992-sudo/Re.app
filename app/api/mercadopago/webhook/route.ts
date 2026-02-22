export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log("Webhook recibido!");
  const body = await req.json();
  console.log(body);

  // Tu lógica para actualizar la base de datos iría aquí en el futuro.

  return NextResponse.json({ status: "success" });
}


