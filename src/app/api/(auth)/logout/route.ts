import prisma from "@/app/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
    const store = await cookies()
    const sessionToken = store.get("session")?.value;
    console.log("sessionToken", sessionToken)
    if (sessionToken){
        await prisma.session.deleteMany({where: {id: sessionToken}})
    }

    store.set("session", "", {
        maxAge: 0,
        path: "/"
    })

    return NextResponse.json({ message: "Logged out" });
}
