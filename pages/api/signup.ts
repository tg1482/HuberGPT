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
            const { email,password } = req.body;

            // Check if the user already exists
            const [rows] = await pool.query<RowDataPacket[]>(
                'SELECT * FROM UserDimension WHERE email = ?',
                [email]
            );
            if (rows.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password,saltRounds);

            // Save the new user
            const [result] = await pool.query(
                'INSERT INTO UserDimension (email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
                [email,hashedPassword,new Date(),new Date()]
            );
            const userId = (result as any).insertId;

            return res.status(201).json({ userId });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
}
