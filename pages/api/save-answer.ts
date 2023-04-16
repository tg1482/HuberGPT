import { NextApiRequest,NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { method,body } = req;

    if (method === 'POST') {
        try {
            const { answer,queryId } = body;

            console.log('queryId',queryId);

            const [rows] = await pool.query<RowDataPacket[]>(
                'UPDATE QueryFact SET answer = ? WHERE id = ?',
                [answer,queryId]
            );

            console.log('rows',rows);

            if ((rows as any).affectedRows > 0) {
                return res.status(200).json({ message: 'Answer saved successfully' });
            } else {
                return res.status(404).json({ error: 'Query not found' });
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.setHeader('Allow','POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
}
