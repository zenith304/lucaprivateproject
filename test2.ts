import 'dotenv/config';
import { query } from './lib/db';

async function test() {
    try {
        await query('SELECT 1');
        console.log("Success");
    } catch (e) {
        console.error("DB Error:", e);
    }
}
test();
