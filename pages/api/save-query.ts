import { NextApiRequest,NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        try {
            const { query,userId } = req.body;

            const [rows] = await pool.query<RowDataPacket[]>(
                'INSERT INTO QueryFact (userId, content, createdAt) VALUES (?, ?, ?)',
                [userId,query,new Date()]
            );
            return res.status(201).json({ message: 'Query saved successfully',data: rows });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
}
