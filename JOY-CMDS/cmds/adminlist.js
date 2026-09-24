module.exports = {
    config: {
        name: "adminlist",
        aliases: ["admins", "listadmin"],
        version: "1.0.0",
        role: 0, // Everyone can see
        author: "Joy Ahmed",
        cooldown: 3,
        description: "View all Bot Owner and Admins",
        usePrefix: true
    },

    onStart: async function ({ bot, chatId, msg, config }) {
        const ownerId = config.owner_id || "Not Set";
        const adminIds = config.admin_ids || [];

        let adminListText = `👑 <b><u>𝙱𝙾𝚃  𝙾𝚆𝙽𝙴𝚁  👑 <b>𝙾𝚯𝚗𝚎𝚛:</b> <code>${ownerId}</code>\n\n`;

        if (adminIds.length === 0) {
            adminListText += `🛡️ <b><u>𝙱𝙾𝚃  𝙰𝙳𝙼𝙸𝙽𝚂</u></b>\n└ <i>কোনো কাস্টম অ্যাডমিন যুক্ত করা নেই।</i>`;
        } else {
            adminListText += `🛡️ <b><u>𝙱𝙾𝚃  𝙰𝙳𝙼𝙸𝙽𝚂 (${adminIds.length})</u></b>\n`;
            adminIds.forEach((id, index) => {
                adminListText += `├ ${index + 1}. <code>${id}</code>\n`;
            });
        }

        return bot.sendMessage(chatId, adminListText, {
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id
        });
    }
};
