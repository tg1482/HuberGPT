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

                console.log("user", user);

                if (user && (await bcrypt.compare(credentials.password, user.password))) {
                    // query the subscriptionFacts table to see if the user has a subscription
                    const subscription = await prisma.subscriptionFact.findFirst({
                        where: {
                            userId: user.id,
                            active: true, // replace with the name of the boolean column that represents subscription status
                        },
                        orderBy: {
                            updatedAt: 'desc', // replace with the name of the column that holds the update time
                        },
                        take: 1,
                    });

                    // if the user has a subscription, 
                    const queriesAllowed = subscription.queriesAllowed ? subscription.queriesAllowed : 0;
                    const queriesMade = subscription.queriesMade ? subscription.queriesMade : 0;

                    return {
                        id: user.id,
                        email: user.email,
                        queriesAllowed: queriesAllowed,
                        queriesMade: queriesMade,
                    };
                } else {
                    return null;
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
                token.queriesAllowed = user.queriesAllowed;
                token.queriesMade = user.queriesMade;
            }
            return token;
        },

        async session({ session, token, user }) {
            if (token) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.queriesAllowed = token.queriesAllowed;
                session.user.queriesMade = token.queriesMade;
            }
            return session;
        }
    },

    pages: {
        signIn: null,
        error: null,
    },
});
