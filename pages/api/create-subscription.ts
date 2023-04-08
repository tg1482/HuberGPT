import { NextApiRequest,NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        try {
            const { planId,userId } = req.body;

            // Declare variables
            let plan,price,queriesAllowed,queriesMade;

            // if planId is 1, then plan = Free, price = 0, queriesAllowed = 10
            // if planId is 2, then plan = Premium, price = 5, queriesAllowed = 50
            if (planId == 1) {
                plan = 'Free';
                price = 0;
                queriesAllowed = 10;
                queriesMade = 0;
            } else if (planId == 2) {
                plan = 'Premium';
                price = 5;
                queriesAllowed = 50;
                queriesMade = 0;
            } else {
                throw new Error('Invalid planId');
            }

            // Save the new subscription
            const [result] = await pool.query(
                'INSERT INTO SubscriptionFact (createdAt, updatedAt, planId, plan, userId, active, price, queriesAllowed, queriesMade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [new Date(),new Date(),planId,plan,userId,1,price,queriesAllowed,queriesMade]
            );
            const subscriptionId = (result as any).insertId;

            return res.status(201).json({ subscriptionId });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
}
