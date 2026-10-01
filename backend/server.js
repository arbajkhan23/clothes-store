require('dotenv').config();

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = require('./app');
const connectDB = require('./config/db');

const port = Number(process.env.PORT) || 5000;

async function startServer() {
    await connectDB();

    app.listen(port, () => {
        console.log(`Clothes Store API listening on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error('Server startup failed:', error.message);
    process.exit(1);
});