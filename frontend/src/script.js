const wsUrl = 'wss://status.sipc-api.top';
let websocket = null;

function connectWebSocket() {
    websocket = new WebSocket(wsUrl);

    websocket.onopen = function () {
        console.log("Connected to WebSocket");
        requestServerStatus();
    };

    websocket.onclose = function () {
        console.log("WebSocket connection closed. Retrying...");
        setTimeout(connectWebSocket, 3000); // Retry every 3 seconds
    };

    websocket.onmessage = function (event) {
        displayServerStatus(JSON.parse(event.data));
    };
}

function requestServerStatus() {
    const servers = document.querySelectorAll('#server-list li');
    servers.forEach(server => {
        const host = server.dataset.host;
        const port = Number(server.dataset.port);
        const message = JSON.stringify({ host, port });
        if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(message);
        } else {
            console.log("WebSocket is not connected.");
        }
    });
}

function displayServerStatus(data) {
    const server = document.querySelector(`#server-list li[data-host="${data.host}"][data-port="${data.port}"]`);
    if (server) {
        if (data.online) {
            server.querySelector('.status').textContent = `${data.players.online}/${data.players.max}`;
            server.querySelector('.card-detail').innerHTML = `<div class="motd-container">${data.motd.html.replace(/\\/g, '')}</div>`;
        } else {
            server.querySelector('.status').textContent = `Disconnected`;
        }
    }
}

function addServer() {
    const nameInput = document.getElementById('server-name');
    const hostInput = document.getElementById('server-host');
    const portInput = document.getElementById('server-port');

    const name = nameInput.value.trim();
    const host = hostInput.value.trim();
    const port = portInput.value.trim();

    if (name && host && port) {
        const newServerItem = document.createElement('li');
        newServerItem.setAttribute('data-host', host);
        newServerItem.setAttribute('data-port', port);
        newServerItem.innerHTML = `
<div class="card">
    <div class="card-main">${name}<span class="status">Checking...</span></div>
    <div class="card-detail"></div>
</div>
`;
        document.getElementById('server-list').insertBefore(newServerItem, document.getElementById('add-server'));
        nameInput.value = '';
        hostInput.value = '';
        portInput.value = '';
        saveServerList();
        requestServerStatus();
    }
}

function saveServerList() {
    const serverListItems = document.querySelectorAll('#server-list li:not(#add-server)');
    const serverList = Array.from(serverListItems).map(server => {
        const cardMainClone = server.querySelector('.card-main').cloneNode(true);
        cardMainClone.querySelector('.status').remove();
        const name = cardMainClone.textContent.trim();
        const host = server.dataset.host;
        const port = server.dataset.port;
        return { name, host, port };
    });
    localStorage.setItem('serverList', JSON.stringify(serverList));
}

function loadServerList() {
    const savedServerList = localStorage.getItem('serverList');
    if (savedServerList) {
        const serverList = JSON.parse(savedServerList);

        serverList.forEach(server => {
            const newServerItem = document.createElement('li');
            newServerItem.setAttribute('data-host', server.host);
            newServerItem.setAttribute('data-port', server.port);
            newServerItem.innerHTML = `
    <div class="card">
        <div class="card-main">${server.name}<span class="status">Checking...</span></div>
        <div class="card-detail"></div>
    </div>
`;

            document.getElementById('server-list').insertBefore(newServerItem, document.getElementById('add-server'));
        });
    }
}

document.getElementById('server-list').addEventListener('click', function (event) {
    const targetCard = event.target.closest('.card');
    const isInput = event.target.tagName.toLowerCase() === 'input';

    if (targetCard && !isInput) {
        const details = targetCard.querySelector('.card-detail');
        if (details.style.height && details.style.height !== '0px') {
            details.style.height = '0px';
        } else {
            details.style.height = details.scrollHeight + 'px';
        }
    }
});


document.getElementById('server-list').addEventListener('contextmenu', function (event) {
    event.preventDefault();
    const targetCard = event.target.closest('li');
    if (targetCard && targetCard.id !== 'add-server') {
        const confirmation = confirm('你确定要删除这个服务器吗？');
        if (confirmation) {
            const host = targetCard.dataset.host;
            const port = targetCard.dataset.port;
            const updatedServerList = JSON.parse(localStorage.getItem('serverList')).filter(server => server.host !== host || server.port !== port);
            localStorage.setItem('serverList', JSON.stringify(updatedServerList));
            targetCard.remove();
        }
    }
});

function updateTheme() {
    const theme = window.parent.localStorage.getItem('THEME_KEY') || 'dark';
    if (theme === 'dark') {
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.add('light-mode');
    }
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    updateTheme();
}


document.getElementById('add-server-button').addEventListener('click', addServer);
setInterval(requestServerStatus, 30000);
console.log(window.parent.localStorage.getItem('THEME_KEY'));
loadServerList();
connectWebSocket();
toggleTheme();
window.addServer=addServer