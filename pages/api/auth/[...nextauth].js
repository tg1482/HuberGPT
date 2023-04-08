import NextAuth, { setSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export default NextAuth({
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req, res) {
                const user = await prisma.userDimension.findUnique({
                    where: { email: credentials.email },
                });

                if (user && (await bcrypt.compare(credentials.password, user.password))) {
                    return {
                        id: user.id,
                        email: user.email,
                    };
                } else {
                    return {
                        error: "Invalid email or password",
                    };
                }
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        jwt: true,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
            }
            return token;
        },

        async session({ session, token, user }) {
            console.log("session", session);
            console.log("token", token);
            console.log("user", user);
            if (token) {
                session.user.id = token.id;
                session.user.email = token.email;
            }
            return session;
        }
    },

    pages: {
        signIn: null,
        error: null,
    },
});
