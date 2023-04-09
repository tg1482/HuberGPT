import { PrismaClient } from '@prisma/client';
import type { NextApiRequest,NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            const { userId } = req.query;

            // Retrieve the user's subscription
            const subscription = await prisma.subscriptionFact.findFirst({
                where: {
                    userId: parseInt(userId as string),
                },
            });

            if (!subscription) {
                return res.status(404).json({ error: 'Subscription not found' });
            }

            // Return the user's query counts
            const queryCounts = {
                queriesMade: subscription.queriesMade,
                queriesAllowed: subscription.queriesAllowed,
            };

            return res.status(200).json(queryCounts);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
}
