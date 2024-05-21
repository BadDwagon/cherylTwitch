let tmi = require('tmi.js');
let fs = require('fs');

let config = require('./config/main.json');
let oauth = require('./config/oauth.json');

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
                'content': 'A wild Dwagon is streaming right now! Come say hi!\n\nhttps://www.twitch.tv/dabaddwagon\n'
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Stream Online')
    };

    async function webhookNotSent() {
        setTimeout(() => {
            lookUpStream()
        }, 30000);

        console.log('Steam Offline')
    };

    async function lookUpStream() {
        if (response.includes('isLiveBroadcast')) {
            webhookSent();
        } else {
            webhookNotSent()
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

    // Log chat messages in a log file
    const log = `[${date.toLocaleString()}] ${user['display-name']} : ${message}\n`;
    console.log(log)

    const path = `./logs/log-${date.toLocaleDateString()}.txt`;
    fs.writeFile(path, log, { flag: 'a+' }, error => { });

    // Prefix of the command
    const prefix = config.settings.prefix;

    // Commands
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
