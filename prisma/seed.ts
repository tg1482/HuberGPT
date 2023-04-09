import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Seed users
    const defaultUser = await prisma.userDimension.create({
        data: {
            id: -99,
            email: 'default@example.com',
            password: 'default_password',
            createdAt: new Date(),
        },
    });


    const user1 = await prisma.userDimension.create({
        data: {
            email: 'user1@example.com',
            password: 'password123',
            queries: {
                create: [
                    {
                        content: 'Sample query 1',
                    },
                ],
            },
        },
    });

    const user2 = await prisma.userDimension.create({
        data: {
            email: 'user2@example.com',
            password: 'password456',
            queries: {
                create: [
                    {
                        content: 'Sample query 2',
                    },
                ],
            },
        },
    });

    const user3 = await prisma.userDimension.create({
        data: {
            email: 'tanmaygupta@gmail.com',
            password: 'password',
        },
    });

    // Seed subscriptions
    const freeSubscription = await prisma.subscriptionFact.create({
        data: {
            planId: 1,
            plan: 'Free',
            active: true,
            price: 0,
            queriesAllowed: 10,
            queriesMade: 0,
            user: {
                connect: {
                    id: user1.id,
                },
            },
        },
    });

    const premiumSubscription = await prisma.subscriptionFact.create({
        data: {
            planId: 2,
            plan: 'Premium',
            active: true,
            price: 5,
            queriesAllowed: 50,
            queriesMade: 0,
            user: {
                connect: {
                    id: user2.id,
                },
            },
        },
    });

    // Connect subscriptions to users
    await prisma.userDimension.update({
        where: { id: user1.id },
        data: { subscriptions: { connect: { id: freeSubscription.id } } },
    });

    await prisma.userDimension.update({
        where: { id: user2.id },
        data: { subscriptions: { connect: { id: premiumSubscription.id } } },
    });

    await prisma.userDimension.update({
        where: { id: user3.id },
        data: { subscriptions: { connect: { id: freeSubscription.id } } },
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
