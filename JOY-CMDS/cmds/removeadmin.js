const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "removeadmin",
        aliases: ["deladmin", "unadmin"],
        version: "2.0.0",
        role: 2, // 2 = Bot Owner Only
        author: "Joy Ahmed",
        cooldown: 3,
        description: "Remove bot admin using Reply, Mention, or UID",
        usePrefix: true
    },

    onStart: async function ({ bot, chatId, args, msg, config }) {
        const prefix = config.prefix || '/';
        const configFile = path.join(__dirname, '../../config.json');

        let targetUserId = null;
        let targetUserName = "";

        // ১. Reply দিয়ে চেক
        if (msg.reply_to_message) {
            targetUserId = msg.reply_to_message.from.id;
            targetUserName = msg.reply_to_message.from.first_name || "User";
        } 
        // ২. Mention (@username) দিয়ে চেক
        else if (msg.entities) {
            const mentionEntity = msg.entities.find(e => e.type === 'mention' || e.type === 'text_mention');
            if (mentionEntity) {
                if (mentionEntity.type === 'text_mention' && mentionEntity.user) {
                    targetUserId = mentionEntity.user.id;
                    targetUserName = mentionEntity.user.first_name || "User";
                } else if (mentionEntity.type === 'mention' && args[0]) {
                    try {
                        const chatMember = await bot.getChatMember(chatId, args[0]);
                        targetUserId = chatMember.user.id;
                        targetUserName = chatMember.user.first_name || "User";
                    } catch (e) {}
                }
            }
        }

        // ৩. Direct UID দিয়ে চেক
        if (!targetUserId && args[0] && !isNaN(args[0])) {
            targetUserId = parseInt(args[0]);
            targetUserName = `User (${targetUserId})`;
        }

        if (!targetUserId) {
            const usageText = 
`⚠️ <b><u>𝚁𝙴𝙼𝙾𝚅𝙴  𝙰𝙳𝙼𝙸𝙽  𝚄𝚂𝙰𝙶𝙴</u></b>

👉 <b>অ্যাডমিন রিমুভ করুন:</b>
• <b>Reply:</b> রিপ্লাই দিয়ে <code>${prefix}removeadmin</code>
• <b>Mention:</b> <code>${prefix}removeadmin @username</code>
• <b>UID:</b> <code>${prefix}removeadmin 123456789</code>`;

            return bot.sendMessage(chatId, usageText, {
                parse_mode: 'HTML',
                reply_to_message_id: msg.message_id
            });
        }

        try {
            if (!Array.isArray(config.admin_ids) || config.admin_ids.length === 0) {
                return bot.sendMessage(chatId, `⚠️ <i>অ্যাডমিন লিস্টে কোনো আইডি নেই!</i>`, {
                    parse_mode: 'HTML',
                    reply_to_message_id: msg.message_id
                });
            }

            const targetIdStr = targetUserId.toString();

            if (!config.admin_ids.includes(targetIdStr)) {
                return bot.sendMessage(chatId, `⚠️ <b>${targetUserName}</b> <i>অ্যাডমিন লিস্টে নেই!</i>`, {
                    parse_mode: 'HTML',
                    reply_to_message_id: msg.message_id
                });
            }

            config.admin_ids = config.admin_ids.filter(id => id !== targetIdStr);
            fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');

            const successText = 
`🚫 ═════════════════ 🚫
  ❌  <b><u>𝙰𝙳𝙼𝙸𝙽  𝚁𝙴𝙼𝙾𝚅𝙴𝙳</u></b>
🚫 ═════════════════ 🚫

👤 <b>𝙽𝚊𝚖𝚎:</b> <b>${targetUserName}</b>
📌 <b>𝚄𝚜𝚎𝚛 𝙸𝙳:</b> <code>${targetUserId}</code>
❇️ <b>𝚂𝚝𝚊𝚝𝚞𝚜:</b> <i>Successfully removed from Bot Admins!</i>`;

            return bot.sendMessage(chatId, successText, {
                parse_mode: 'HTML',
                reply_to_message_id: msg.message_id
            });

        } catch (err) {
            console.error('Remove Admin Error:', err.message);
            return bot.sendMessage(chatId, `❌ <i>অ্যাডমিন সরাতে সমস্যা হয়েছে!</i>`, {
                parse_mode: 'HTML',
                reply_to_message_id: msg.message_id
            });
        }
    }
};
