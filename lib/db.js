const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'tanmaygupta',
    password: 'password',
    database: 'hubergpt',
    waitForConnections: true,
    connectionLimit: 10,
});

const saveQuery = async (query) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query(
            'INSERT INTO query_fact (user_id, query, answer, created_at) VALUES (?, ?, ?, ?)',
            [query.user_id, query.query, query.answer, query.created_at]
        );
        await connection.commit();
        return rows[0];
    } finally {
        connection.release();
    }
};

const getUserByEmail = async (email) => {
    const [rows] = await pool.query("SELECT * FROM user_dimension WHERE email = ?", [email]);
    return rows[0];
};

const saveUser = async (email, password) => {
    const [result] = await pool.query("INSERT INTO user_dimension (email, password) VALUES (?, ?)", [email, password]);
    return result.insertId;
};

module.exports = {
    saveQuery,
    getUserByEmail,
    saveUser,
    pool,
};
