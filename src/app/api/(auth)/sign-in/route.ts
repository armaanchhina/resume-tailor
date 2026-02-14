import prisma from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";


export async function POST(req: Request){
    try {
        const { email, password } = await req.json();
        
        if (!email || !password){
            return NextResponse.json({error: "Missing Fields"}, {status: 400});
        }

        // check if user exists
        const user = await prisma.user.findUnique({
            where: {email}
        })

        if (!user){
            return NextResponse.json({error: "Invalid email or password"}, {status: 400})
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch){
            return NextResponse.json({error: "Invalid email or password"}, {status: 400})
        }

        const sessionToken = crypto.randomBytes(32).toString("hex")

        await prisma.session.create({
            data: {
                id: sessionToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days
            }
        })

        const store = await cookies()
        store.set("session", sessionToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/"
        })

        return NextResponse.json({
            message: "Login successful",
        })
    } catch (err) {
        console.error("Login error: ", err )
        return NextResponse.json({error:"Server Error"}, {status: 500})
    }
}