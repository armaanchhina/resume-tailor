import prisma from "@/app/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const store = await cookies()
    const sessionToken = store.get("session")?.value
    if (!sessionToken) {
        return NextResponse.json({user: null})
    }

    const session = await prisma.session.findUnique({
        where: { id: sessionToken},
        include: { user: true }
    })

    if ( !session || session.expiresAt < new Date()) {
        return NextResponse.json({user: null})
    }

    const { passwordHash, ...safeUser } = session.user;

    return NextResponse.json({ user: safeUser });

}