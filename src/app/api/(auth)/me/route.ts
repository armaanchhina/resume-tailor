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
        where: { id: sessionToken },
        select: {
          expiresAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
      

    if ( !session || session.expiresAt < new Date()) {
        return NextResponse.json({user: null})
    }


    return NextResponse.json({ user: session.user });

}