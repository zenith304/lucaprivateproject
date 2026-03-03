require('dotenv').config();
const { query } = require('./lib/db');

async function test() {
    try {
        await query('SELECT 1');
        console.log("Success");
    } catch (e) {
        console.error("DB Error:", e);
    }
}
test();
