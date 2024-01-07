const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const util = require('minecraft-server-util');
const e = require('express');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const defaultPort = 3000;

const options = {
    timeout: 1000 * 2,
    enableSRV: true
};

wss.on('connection', ws => {
    ws.on('message', async message => {
        const { host, port } = JSON.parse(message);
        try {
            if (!host || isNaN(port)) {
                ws.send(JSON.stringify({ 'message': 'Missing or invalid parameters' }));
                return
            }
            if (port > 65535) {
                ws.send(JSON.stringify({ 'message': 'The port must be less than or equal to 65535' }));
                return
            }

            const status = await util.status(host, port, options);
            if (status.players) {
                if (status.players.sample && status.players.sample.length > 0) {
                    status.players.sample = status.players.sample.filter(player => player.id !== "00000000-0000-0000-0000-000000000000");
                } else {
                    status.players.sample = [];
                }
            }
            ws.send(JSON.stringify({
                online: true,
                host,
                port,
                version: status.version.name,
                players: status.players,
                motd: status.motd,
                icon: status.favicon
            }));

        } catch (error) {
            ws.send(JSON.stringify({ 'online': false, host, port }));
        }
    });
});

app.get('/', async (req, res) => {
    let host = req.query.host;
    let port = parseInt(req.query.port, 10);

    // 检查参数
    if (!host || isNaN(port)) {
        return res.status(400).json({ 'message': 'Missing or invalid parameters' });
    }
    if (port > 65535) {
        return res.status(400).json({ 'message': 'The port must be less than or equal to 65535' });
    }

    try {
        const status = await util.status(host, port, options);
        if (status.players) {
            if (status.players.sample && status.players.sample.length > 0) {
                status.players.sample = status.players.sample.filter(player => player.id !== "00000000-0000-0000-0000-000000000000");
            } else {
                status.players.sample = [];
            }
        }
        const version = status.version.name;
        const players = status.players;
        const motd = status.motd;
        const icon = status.favicon;
        res.json({ online: true, host, port, version, players, motd, icon });
    } catch (error) {
        console.log(error);
        res.json({ 'online': false, host, port });
    }
});

const listenPort = process.env.PORT || defaultPort; // 允许从环境变量设置端口
server.listen(listenPort, () => {
    console.log(`Server listening on port ${listenPort}...`);
});
