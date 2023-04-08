import { PrismaClient } from '@prisma/client';
import type { NextApiRequest,NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        try {
            const { userId } = req.body;

            // Retrieve the user's subscription
            const subscription = await prisma.subscriptionFact.findFirst({
                where: {
                    userId: userId,
                },
            });

            if (!subscription) {
                return res.status(404).json({ error: 'Subscription not found' });
            }

            // Update the user's query count
            const updatedSubscription = await prisma.subscriptionFact.update({
                where: { id: subscription.id },
                data: {
                    queriesMade: {
                        increment: 1,
                    },
                },
            });

            return res.status(200).json(updatedSubscription);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

}
