#!/bin/bash

# load environment variables
source ./.env.local

# MySQL query to fetch data
QUERY="SELECT count(*) FROM UserDimension;"

# execute query using pool object
DATA=$(node -e "const { pool } = require('./lib/db.js'); const { RowDataPacket } = require('mysql2'); async function fetchData() { const rows = await pool.query<RowDataPacket>('${QUERY}'); return rows; }; fetchData().then(console.log).catch(console.error);")

# print data
echo "${DATA}"
