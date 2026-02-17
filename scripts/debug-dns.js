const dns = require("dns");
const { URL } = require("url");
require("dotenv").config();

async function main() {
    const dbUrl = process.env.DATABASE_URL;
    const url = new URL(dbUrl);
    const hostname = url.hostname;

    console.log(`Resolving ${hostname}...`);
    try {
        dns.setServers(["8.8.8.8"]);
        const addresses = await dns.promises.resolve4(hostname);
        console.log("Addresses:", addresses);

        const ip = addresses[0];
        console.log(`Testing TCP connection to ${ip}:5432...`);

        const net = require("net");
        const socket = new net.Socket();

        socket.setTimeout(5000);
        socket.on("connect", () => {
            console.log("TCP Connection successful!");
            socket.destroy();
        });
        socket.on("timeout", () => {
            console.log("TCP Connection timed out!");
            socket.destroy();
        });
        socket.on("error", (err) => {
            console.log("TCP Connection error:", err.message);
        });

        socket.connect(5432, ip);
    } catch (e) {
        console.error("Resolution failed:", e);
    }
}

main();
