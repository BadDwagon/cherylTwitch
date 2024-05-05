const tmi = require('tmi.js');
const fs = require('fs');
const WebSocketClient = require('websocket').client;
const client = new WebSocketClient();

const config = require('./config/main.json');

// Login
const loginSetting = {
    identity: {
        username: config.login.username,
        password: config.login.password,
    },
    channels: [
        config.channels.main,
    ]
};

const bot = new tmi.client(loginSetting);
const date = new Date();

// Cooldown
let isGlobalCooldown = false;

function globalCooldown() {
    isGlobalCooldown = true;

    setTimeout(() => {
        isGlobalCooldown = false;
    }, 3000)
};

/*function userCooldown() {
    isUserCooldown = true;

    setTimeout(() => {
        isUserCooldown = false;
    }, 10000)
};*/

bot.on('message', (channel, user, message, self) => {
    if (self) return;

    // Log Messages
    const log = `[${date.toLocaleString()}] ${user['display-name']} : ${message}\n`;
    const path = `./logs/log-${date.toLocaleDateString()}.txt`;
    console.log(log)

    fs.writeFile(path, log, { flag: 'a+' }, error => { });

    const prefix = '!';

    // Commands
    if (message[0] === prefix) {
        let command = message.replace(prefix, '')

        if (isGlobalCooldown === true) return;

        switch (command) {
            case ('discord'):
                bot.say(
                    channel, "Here you go adorable bean! The discord server: discord.gg/Hj6g8wSs2q"
                );

                globalCooldown();
                break;
            case ('twitter'):
                bot.say(
                    channel,
                    "You wanted to see my twitter for some cute pics? Here you go: twitter.com/realBadDwagon"
                );

                globalCooldown();
                break;
            case ('vrchat'):
                bot.say(
                    channel,
                    "You can always add me on VRChat, but I might not be able to join everyone every day: https://vrchat.com/home/user/usr_90a6ed90-364a-4f36-82fd-1d67874792fe"
                );

                globalCooldown();
                break;
        };
    };
});

bot.on('redeem', (channel, user, reward, tags) => {

    console.log(user + " | " + reward)
});

bot.on('connected', (addr, port) => {
    console.log(`* Connected to ${addr}:${port}`);
});

// Connect to Twitch
bot.connect();

client.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
    connection.sendUTF('CAP REQ :twitch.tv/tags twitch.tv/commands');
    connection.sendUTF('PASS ' + config.login.password);
    connection.sendUTF('NICK ' + config.login.username);

    console.log('* WebSocket client connected');
});

// Connect to websocket
client.connect('ws://irc-ws.chat.twitch.tv:80');