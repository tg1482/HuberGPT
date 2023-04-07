import { pool } from "@/lib/db";

export default async function handler(req,res) {
    if (req.method === "POST") {
        try {
            const { email,password } = req.body;

            // Check if the user already exists
            const [rows] = await pool.query("SELECT * FROM users WHERE email = ?",[email]);
            if (rows.length > 0) {
                return res.status(400).json({ error: "Email already in use" });
            }

            // Save the new user
            const [result] = await pool.query("INSERT INTO users (email, password) VALUES (?, ?)",[email,password]);
            const userId = result.insertId;

            return res.status(201).json({ userId });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    } else {
        return res.status(405).json({ error: "Method Not Allowed" });
    }
}
