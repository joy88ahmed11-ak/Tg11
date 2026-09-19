const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.json');
const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');
const gradient = require('gradient-string');
const express = require('express'); // 🌐 Express Server for Render

// ================= RENDER PORT SERVER (PORT FIX) =================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('🤖 JOY Telegram Bot is Running Live!');
});

app.listen(PORT, () => {
    console.log(`🌐 Server active & listening on port: ${PORT}`);
});

// ================= JOY CORE (main files) =================
require('./JOY/utils.js');
const TelegramAdapter = require('./JOY/telegram-adapter.js');
const checkVersion = require('./JOY/update.js');
require('./JOY/concole.js');

// ================= GLOBAL SPAM/MURGI TIMERS TRACKER =================
global.activeSpamIntervals = global.activeSpamIntervals || [];

// ================= FILE PATH =================
const chatGroupsFile = path.join(__dirname, 'chatGroups.json');
const messageCountFile = path.join(__dirname, 'messageCount.json');
const userDataFile = path.join(__dirname, 'userData.json');

// ================= FILE INIT =================
if (!fs.existsSync(messageCountFile)) fs.writeFileSync(messageCountFile, JSON.stringify({}), 'utf8');
if (!fs.existsSync(chatGroupsFile)) fs.writeFileSync(chatGroupsFile, JSON.stringify([]), 'utf8');
if (!fs.existsSync(userDataFile)) fs.writeFileSync(userDataFile, JSON.stringify({}), 'utf8');

let chatGroups = JSON.parse(fs.readFileSync(chatGroupsFile, 'utf8'));
let gbanList = [];
let globalHandleButton = []; 
global.globalHandleReply = []; 

// ================= BOT TOKEN CHECK =================
const botToken = process.env.TELEGRAM_BOT_TOKEN || config.token;
if (!botToken || botToken.includes('PUT_YOUR_TELEGRAM_BOT_TOKEN_HERE')) {
    console.log(' Please set your bot token in config.json or the TELEGRAM_BOT_TOKEN env variable.');
    process.exit(1);
}

// ================= BOT INIT =================
const bot = new TelegramBot(botToken, { polling: true });

const commands = [];
const events = [];
let adminOnlyMode = config.admin_only_mode || false;
const cooldowns = new Map();

// ================= HELPER: ESCAPE REGEX PREFIX =================
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ================= LOGGER =================
function logger(message) {
    try {
        console.log(gradient.pastel(message));
    } catch {
        console.log(message);
    }
}

// ================= SHOW REMOTE BOT ART =================
async function showRemoteBotArt() {
    try {
        const res = await axios.get('https://raw.githubusercontent.com/JUBAED-AHMED-JOY/Joy/main/notification.txt', { timeout: 5000 });
        logger(res.data);
    } catch (err) {
        logger(` ${config.bot_name || 'JOY BOT'} started.`);
    }
}

// ================= GBAN FETCH =================
async function fetchGbanList() {
    try {
        const res = await axios.get('https://raw.githubusercontent.com/JUBAED-AHMED-JOY/Joy/main/gban.json', { timeout: 5000 });
        gbanList = res.data.map(u => u.ID.toString());
        logger(` Gban loaded: ${gbanList.length} users`);
    } catch (err) {}
}
fetchGbanList();
cron.schedule('*/5 * * * *', fetchGbanList);

// ================= GLOBAL RELOAD FUNCTION =================
global.reloadBot = function () {
    if (global.activeSpamIntervals && global.activeSpamIntervals.length > 0) {
        global.activeSpamIntervals.forEach(timer => clearInterval(timer));
        global.activeSpamIntervals = [];
    }

    commands.length = 0;
    events.length = 0;
    global.globalHandleReply = [];
    globalHandleButton = [];

    const cmdsDir = path.join(__dirname, 'JOY-CMDS', 'cmds');
    if (fs.existsSync(cmdsDir)) {
        fs.readdirSync(cmdsDir).forEach(file => {
            if (!file.endsWith('.js')) return;
            try {
                const filePath = path.join(cmdsDir, file);
                delete require.cache[require.resolve(filePath)]; 
                const command = require(filePath);
                if (!command.config.role) command.config.role = 0;
                if (!command.config.cooldown) command.config.cooldown = 0;

                commands.push({
                    ...command,
                    config: { ...command.config, name: command.config.name.toLowerCase() }
                });
            } catch (err) {
                console.error(` Error reloading command ${file}: ${err.message}`);
            }
        });
    }

    const eventsDir = path.join(__dirname, 'JOY-CMDS', 'events');
    if (fs.existsSync(eventsDir)) {
        fs.readdirSync(eventsDir).forEach(file => {
            if (!file.endsWith('.js')) return;
            try {
                const filePath = path.join(eventsDir, file);
                delete require.cache[require.resolve(filePath)]; 
                const eventModule = require(filePath);
                if (typeof eventModule.handleEvent === 'function') {
                    events.push(eventModule);
                }
            } catch (err) {
                console.error(` Error reloading event ${file}: ${err.message}`);
            }
        });
    }

    return commands.length;
};

// ================= INITIAL LOAD =================
global.reloadBot();

// ================= EVENT LISTENER =================
bot.on('message', async (msg) => {
    for (const eventModule of events) {
        try {
            await eventModule.handleEvent({
                event: { msg, body: msg.text || '' },
                api: new TelegramAdapter(bot),
                bot
            });
        } catch (err) {
            console.error(' Event Error:', err.message);
        }
    }
});

// ================= CALLBACK QUERY HANDLER =================
bot.on('callback_query', async (query) => {
    const handle = globalHandleButton.find(h => h.messageID === query.message.message_id);
    if (!handle) return;

    const event = {
        threadId: query.message.chat.id,
        button: query.data
    };

    try {
        if (typeof handle.handleButton === 'function') {
            await handle.handleButton({ bot, event, handleButton: handle });
        }
    } catch (err) {
        console.error(' Error in button handler:', err);
        bot.sendMessage(event.threadId, ' Failed to handle button.');
    }
});

// ================= ADMIN CHECK =================
async function isUserAdmin(bot, chatId, userId) {
    try {
        const admins = await bot.getChatAdministrators(chatId);
        return admins.some(a => a.user.id === userId);
    } catch {
        return false;
    }
}

// ================= EXEC COMMAND =================
async function executeCommand(bot, command, msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        if (gbanList.includes(userId.toString())) return bot.sendMessage(chatId, ' You are globally banned.');

        const isAdmin = await isUserAdmin(bot, chatId, userId);
        const isBotAdmin = userId.toString() === (config.owner_id || '').toString();

        if (adminOnlyMode && !isBotAdmin) return bot.sendMessage(chatId, ' Bot is in admin-only mode.');
        if (command.config.role === 2 && !isBotAdmin) return bot.sendMessage(chatId, ' Bot admin only command.');
        if (command.config.role === 1 && !isAdmin && !isBotAdmin) return bot.sendMessage(chatId, ' Group admin only command.');

        const cdKey = `${command.config.name}-${userId}`;
        const now = Date.now();
        const cd = (command.config.cooldown || 0) * 1000;

        if (cooldowns.has(cdKey)) {
            const last = cooldowns.get(cdKey);
            if (now < last + cd) {
                const wait = Math.ceil((last + cd - now) / 1000);
                return bot.sendMessage(chatId, ` Wait ${wait}s`);
            }
        }
        cooldowns.set(cdKey, now);

        const api = new TelegramAdapter(bot);
        const args = (match[1] || '').trim().split(/\s+/).filter(Boolean);

        await command.onStart({
            bot,
            chatId,
            args,
            userId,
            msg,
            api,
            config,
            commands,
            message: { reply: t => bot.sendMessage(chatId, t, { reply_to_message_id: msg.message_id }) },
            event: {
                threadID: chatId,
                messageID: msg.message_id,
                senderID: userId,
                body: msg.text || ''
            },
            globalHandleButton
        });
    } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, ` Error: ${err.message}`);
    }
}

// ================= MESSAGE COUNT + AUTO WELCOME + REPLY + COMMAND HANDLER =================
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from ? msg.from.id : null;

    if (!userId) return;

    // Message count tracking
    const data = JSON.parse(fs.readFileSync(messageCountFile));
    if (!data[chatId]) data[chatId] = {};
    if (!data[chatId][userId]) data[chatId][userId] = 0;
    data[chatId][userId]++;
    fs.writeFileSync(messageCountFile, JSON.stringify(data, null, 2));

    // Track active group chat IDs
    if (!chatGroups.includes(chatId)) {
        chatGroups.push(chatId);
        fs.writeFileSync(chatGroupsFile, JSON.stringify(chatGroups, null, 2));
    }

    // Auto welcome message
    if (!msg.from.is_bot && msg.chat.type === 'private') {
        const notifiedUsers = JSON.parse(fs.readFileSync(userDataFile));
        if (!notifiedUsers[userId]) {
            try {
                const startCommand = require(path.join(__dirname, 'JOY-CMDS', 'cmds', 'start.js'));
                if (startCommand && startCommand.onStart) {
                    startCommand.onStart({ bot, chatId, msg, config });
                }
            } catch (err) {}

            notifiedUsers[userId] = true;
            fs.writeFileSync(userDataFile, JSON.stringify(notifiedUsers, null, 2));
        }
    }

    // MESSAGE REPLY TRACKING
    if (msg.reply_to_message && global.globalHandleReply.length > 0) {
        const repliedMsgId = msg.reply_to_message.message_id;
        const replyIndex = global.globalHandleReply.findIndex(item => item.messageID === repliedMsgId);

        if (replyIndex !== -1) {
            const handleData = global.globalHandleReply[replyIndex];
            try {
                if (typeof handleData.handleReply === 'function') {
                    await handleData.handleReply({
                        bot,
                        event: {
                            threadId: chatId,
                            messageID: msg.message_id,
                            senderID: userId,
                            body: msg.text || ''
                        },
                        handleReply: handleData
                    });
                    return;
                }
            } catch (err) {
                console.error(' Error handling message reply:', err.message);
            }
        }
    }

    if (!msg.text) return;
    const text = msg.text.trim();
    const prefix = config.prefix || '/';
    const escapedPrefix = escapeRegex(prefix);

    // ONLY PREFIX HANDLER
    if (text === prefix) {
        const slashCmd = commands.find(c => c.config.name === "___only_slash___" || c.config.name === "joy" || c.config.name === "prefix");
        if (slashCmd) {
            return await slashCmd.onStart({
                bot,
                chatId,
                args: [],
                userId,
                msg,
                config,
                commands,
                globalHandleButton
            });
        }
    }

    // COMMAND CHECK & EXECUTOR
    let isCommand = false;
    let inputCmdName = '';

    for (const command of commands) {
        if (!command.config.name || command.config.name === '___only_slash___') continue;

        const usePrefix = command.config.usePrefix !== false;
        const pattern = usePrefix
            ? `^${escapedPrefix}${command.config.name}\\b(.*)$`
            : `^${command.config.name}\\b(.*)$`;

        const regex = new RegExp(pattern, 'i');
        const match = text.match(regex);

        if (match) {
            isCommand = true;
            await executeCommand(bot, command, msg, match);
            break;
        }
    }

    // STYLISH INVALID COMMAND DETECTOR
    if (!isCommand && text.startsWith(prefix) && text !== prefix) {
        const parts = text.slice(prefix.length).trim().split(/\s+/);
        inputCmdName = parts[0];

        if (inputCmdName) {
            const notFoundMsg = `❌ Invalid Command: ${prefix}${inputCmdName}\nUse ${prefix}help to see all available commands.`;
            bot.sendMessage(chatId, notFoundMsg, { reply_to_message_id: msg.message_id });
        }
    }
});

// ================= START =================
(async () => {
    await checkVersion();
    await showRemoteBotArt();
    logger(' Bot started successfully');
    logger(` Commands loaded: ${commands.length}`);
    logger(` Events loaded: ${events.length}`);
    logger(` Owner: ${config.owner_name}`);
    logger(` Prefix: ${config.prefix}`);
})();

process.on('unhandledRejection', (err) => {
    console.error(' Unhandled Rejection:', err);
});
