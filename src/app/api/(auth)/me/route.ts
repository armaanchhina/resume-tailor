import prisma from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ user: null })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return NextResponse.json({ user });
}
