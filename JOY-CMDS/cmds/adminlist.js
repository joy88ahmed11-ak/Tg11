module.exports = {
    config: {
        name: "adminlist",
        aliases: ["admins", "listadmin"],
        version: "1.0.1",
        role: 0, // Everyone can see
        author: "Joy Ahmed",
        cooldown: 3,
        description: "View all Bot Owner and Admins",
        usePrefix: true
    },

    onStart: async function ({ bot, chatId, msg, config }) {
        const ownerId = config.owner_id || "Not Set";
        const ownerName = config.owner_name || "Joy Ahmed";
        const adminIds = config.admin_ids || [];

        let adminListText = 
`👑 <b><u>𝙱𝙾𝚃  𝙾𝚆𝙽𝙴𝚁</u></b>
👤 <b>𝙽𝚊𝚖𝚎:</b> <b>${ownerName}</b>
📌 <b>𝙸𝙳:</b> <code>${ownerId}</code>

`;

        if (adminIds.length === 0) {
            adminListText += `🛡️ <b><u>𝙱𝙾𝚃  𝙰𝙳𝙼𝙸𝙽𝚂</u></b>\n└ <i>কোনো অতিরিক্ত অ্যাডমিন যুক্ত করা নেই।</i>`;
        } else {
            adminListText += `🛡️ <b><u>𝙱𝙾𝚃  𝙰𝙳𝙼𝙸𝙽𝚂 (${adminIds.length})</u></b>\n`;
            adminIds.forEach((id, index) => {
                const isLast = index === adminIds.length - 1;
                const prefixIcon = isLast ? "╰" : "├";
                adminListText += `${prefixIcon} ${index + 1}. <code>${id}</code>\n`;
            });
        }

        try {
            return await bot.sendMessage(chatId, adminListText, {
                parse_mode: 'HTML',
                reply_to_message_id: msg.message_id
            });
        } catch (err) {
            console.error('AdminList Error:', err.message);
            return bot.sendMessage(chatId, `❌ <i>অ্যাডমিন লিস্ট দেখাতে সমস্যা হয়েছে!</i>`, {
                reply_to_message_id: msg.message_id
            });
        }
    }
};
