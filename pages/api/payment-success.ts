// pages/api/payment-success.ts
import type { NextApiRequest,NextApiResponse } from 'next';
import { createSubscription } from '@/lib/subscription';
import { pool } from '@/lib/db';


export default async function handler(req: NextApiRequest,res: NextApiResponse) {
    if (req.method === 'GET') {
        const { userId } = req.query;

        // Create the subscription using the existing createSubscription function
        try {
            const planId = 2; // Use the correct plan ID for the paid plan
            // const subscriptionId = await createSubscription(planId,Number(userId));
            // Declare variables
            let plan,price,queriesAllowed,queriesMade;

            // if planId is 1, then plan = Free, price = 0, queriesAllowed = 10
            // if planId is 2, then plan = Premium, price = 5, queriesAllowed = 50

            plan = 'Premium';
            price = 5;
            queriesAllowed = 50;
            queriesMade = 0;

            // Save the new subscription
            const [result] = await pool.query(
                'INSERT INTO SubscriptionFact (createdAt, updatedAt, planId, plan, userId, active, price, queriesAllowed, queriesMade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [new Date(),new Date(),planId,plan,userId,1,price,queriesAllowed,queriesMade]
            );
            // const subscriptionId = (result as any).insertId;

            // return res.status(201).json({ subscriptionId });

            // Sign the user in (you will need to implement this)

            // Redirect the user to the home page
            res.writeHead(302,{ Location: '/' });
            res.end();
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
