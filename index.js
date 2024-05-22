let tmi = require('tmi.js');
let fs = require('fs');

let config = require('./config/main.json');
let oauth = require('./config/oauth.json');
let piShock = require('./config/pishock.json');

// Login to bot account
const loginTwitch = {
    identity: {
        username: config.login.twitch.username,
        password: config.login.twitch.oauth_full,
    },
    channels: [
        config.channels.main,
    ]
};
const bot = new tmi.client(loginTwitch);

async function piShockInfo() {
    const shockerInfo = await fetch("https://do.pishock.com/api/GetShockerInfo", {
        method: "POST",
        body: JSON.stringify({
            "Name": config.login.pishock.name,
            "Username": config.login.pishock.username,
            "Code": config.login.pishock.password,
            "Apikey": config.login.pishock.key
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }).catch(error => {
        console.error(error)
    }).then(response => response.json())

    fs.writeFileSync('./config/pishock.json', JSON.stringify(shockerInfo));
    return shockerInfo;
};

piShockInfo();

// Give new token for twitch api
async function updateToken() {
    const tokenFetch = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        body: "client_id=" + config.login.twitch.application.id + "&client_secret=" + config.login.twitch.application.secret + "&grant_type=client_credentials",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).catch(error => {
        console.error(error)
    }).then(response => response.json())

    tokenFetch.expires_in = Date.now() + tokenFetch.expires_in;
    fs.writeFileSync('./config/oauth.json', JSON.stringify(tokenFetch));
    return tokenFetch;
}

(async () => {
    if (oauth.expires_in < Date.now()) {
        oauth = await updateToken()
    } else {
        let s;
        const fuckyou = async () => {
            let s = updateToken()
            if (s.access_token !== oauth.access_token) {
                s = setTimeout(fuckyou, s.expires_in)
            }
        }
        s = setTimeout(fuckyou, oauth.expires_in - Date.now())
    }
})();

async function channelIsLive() {
    const channel = await fetch(`https://www.twitch.tv/${config.channels.main}`);
    const response = await channel.text();

    async function webhookSent() {
        await fetch(config.login.discord.webhook, {
            method: 'POST',
            body: JSON.stringify({
                'content': 'A wild Dwagon is streaming right now! Come say hi!\n\nhttps://www.twitch.tv/dabaddwagon\n@everyone'
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return console.log('Stream Online')
    };

    async function webhookNotSent() {
        setTimeout(() => {
            lookUpStream()
        }, 30000);

        console.log('Stream Offline')
    };

    async function lookUpStream() {
        if (response.includes('isLiveBroadcast')) {
            webhookSent();
        } else {
            webhookNotSent();
        };
    };

    lookUpStream();
};

channelIsLive();

bot.once('connected', (addr, port) => {
    console.log(`* Connected to ${addr}:${port}`);
});

// Cooldown bool default
let isGlobalCooldown = false;

// Global command cooldown to avoid being rate limited
function globalCooldown() {
    isGlobalCooldown = true;

    return setTimeout(() => {
        isGlobalCooldown = false;
    }, 3000)
};

bot.on('message', async (channel, user, message, self) => {
    if (self) return;

    const date = new Date();

    ///////////////////////////////////////
    //  Log chat messages in a log file  //
    ///////////////////////////////////////

    if (config.settings.logging === true) {
        const log = `[${date.toLocaleString()}] ${user['display-name']} : ${message}\n`;
        console.log(log)

        const path = `./logs/log-${date.toLocaleDateString()}.txt`;
        fs.writeFile(path, log, { flag: 'a+' }, error => { });
    };

    //////////////////////////////////
    //  PiShock - Bits, Subs, etc.  //
    //////////////////////////////////

    const piShock_Settings = config.settings.pîShock;

    if (piShock_Settings.enable === true) {
        if (/Cheer\d/i.test(message)) {
            if (piShock.online === false) return;

            async function shockSend() {
                await fetch("https://do.pishock.com/api/apioperate/", {
                    method: "POST",
                    body: JSON.stringify({
                        "Name": config.login.pishock.name,
                        "Username": config.login.pishock.username,
                        "Code": config.login.pishock.password,
                        "Apikey": config.login.pishock.key,
                        "Op": state_op,
                        "Duration": state_duration,
                        "Intensity": state_intensity
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).catch(error => {
                    console.error(error)
                }).then(response => response.json());
            };

            function shockMessage() {
                console.log(`Shocked for '${state_duration}' seconds with '${state_intensity}' of intensity.`)

                return shockSend();
            };

            if (piShock_Settings.shock_on_bits === true) {
                const bits = parseInt(message.match(/\d+/).toString());

                if (bits <= 100) {
                    state_op = 1;
                    state_duration = 1;
                    state_intensity = 10;
                } else if (bits <= 300) {
                    state_op = 1;
                    state_duration = 1;
                    state_intensity = 20;
                } else if (bits <= 500) {
                    state_op = 1;
                    state_duration = 1;
                    state_intensity = 30;
                } else if (bits <= 700) {
                    state_op = 1;
                    state_duration = 1;
                    state_intensity = 40;
                } else if (bits <= 900) {
                    state_op = 1;
                    state_duration = 1;
                    state_intensity = 50;
                } else if (bits <= 1100) {
                    state_op = 1;
                    state_duration = 1;
                    state_intensity = 60;
                } else if (bits <= 1300) {
                    state_op = 1;
                    state_duration = 1;
                    state_intensity = 70;
                } else if (bits <= 1500) {
                    state_op = 1;
                    state_duration = 1;
                    state_intensity = 80;
                } else if (bits <= 1700) {
                    state_op = 1;
                    state_duration = 1;
                    state_intensity = 90;
                } else if (bits >= 1900) {
                    state_op = 1;
                    state_duration = 1;
                    state_intensity = 100;
                };

                return shockMessage();
            } else if (piShock_Settings.shock_on_subs === true) {
                return console.log('Being worked on! Please disable it')
            };
        };
    };

    ///////////////
    //  Command  //
    ///////////////

    const prefix = config.settings.prefix;

    if (message[0] === prefix) {
        let disallowStringCommand = message.replace(prefix, '');

        if (isGlobalCooldown === true) return;

        function replyCommand() {
            bot.say(
                channel,
                choiceString
            );
        };

        // Command doesn't allow string after
        switch (disallowStringCommand) {
            case ('discord'):
                choiceString = "Here you go adorable bean! The discord server: discord.gg/Hj6g8wSs2q";
                replyCommand();

                return globalCooldown();
            case ('twitter'):
                choiceString = "You wanted to see my twitter for some cute pics of my avatar? Here you go: twitter.com/realBadDwagon";
                replyCommand();

                return globalCooldown();
            case ('vrchat'):
                choiceString = "You can always add me on VRChat, but I might not be able to join everyone every day: vrchat.com/home/user/usr_90a6ed90-364a-4f36-82fd-1d67874792fe";
                replyCommand();

                return globalCooldown();
            case ('steam'):
                choiceString = "You want to stalk me on Steam? Welp here you go: steamcommunity.com/id/dabaddwagon/";
                replyCommand();

                return globalCooldown();
            case ('cmd'):
                choiceString = "Here's the command available: steam, vrchat, twitter, discord, lurk";
                replyCommand();

                return globalCooldown();
        };

        let allowStringCommand = disallowStringCommand.split(' ');

        // Command allow string after
        switch (allowStringCommand[0].toString()) {
            case ('lurk'):
                choiceString = `${user['display-name']} is entering lurking mode! Have a nice day/night and hopefully we see you later in chat <3`;
                replyCommand();

                return globalCooldown();
        };
    };
});

bot.on('redeem', (channel, user, reward, tags) => {
    const date = new Date();

    const log = `[${date.toLocaleString()}] ${user} : ${reward} : ${tags.username}\n`;
    console.log(log)
});

// Connect to Twitch
bot.connect();