// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default NextAuth({
    providers: [
        CredentialsProvider({
            name: "Email and Password",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (user && (await bcrypt.compare(credentials.password, user.password))) {
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                    };
                } else {
                    return null;
                }
            },
        }),
    ],
    session: {
        jwt: true,
    },
    callbacks: {
        async jwt(token, user) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session(session, token) {
            session.user.id = token.id;
            return session;
        },
    },
});
