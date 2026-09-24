const axios = require('axios');

module.exports = {
    config: {
        name: "chatgpt",
        aliases: ["ai", "gpt"],
        version: "1.0.0",
        role: 0,
        author: "Joy Ahmed",
        cooldown: 3,
        description: "Ask anything to ChatGPT AI",
        usePrefix: true
    },

    onStart: async function ({ bot, chatId, args, msg, config }) {
        const prefix = config.prefix || '/';
        const prompt = args.join(' ');

        if (!prompt) {
            return bot.sendMessage(chatId, `⚠️ <i>দয়া করে আপনার প্রশ্নটি লিখুন!</i>\n📌 <b>Usage:</b> <code>${prefix}chatgpt বলুন ঢাকা শহরের ইতিহাস</code>`, {
                parse_mode: 'HTML',
                reply_to_message_id: msg.message_id
            });
        }

        const loadingMsg = await bot.sendMessage(chatId, "🧠 <i>ChatGPT চিন্তা করছে...</i>", {
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id
        });

        try {
            // Free ChatGPT API Endpoint
            const res = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(prompt)}&owner=${encodeURIComponent(config.owner_name || 'Joy Ahmed')}&botname=${encodeURIComponent(config.bot_name || 'JOY Bot')}`);
            
            const reply = res.data.response || "দুঃখিত, কোনো উত্তর পাওয়া যায়নি।";

            const aiResponseText = 
`🤖 <b><u>𝙲𝙷𝙰𝚃𝙶𝙿𝚃  𝙰𝙸  𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴</u></b>

${reply}

👑 <b>𝙾𝚯𝚗𝚎𝚛:</b> <b><u>𝙹𝚘𝚢 𝙰𝚑𝚖𝚎𝚍</u></b>`;

            await bot.editMessageText(aiResponseText, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'HTML'
            });

        } catch (err) {
            console.error('ChatGPT Command Error:', err.message);
            return bot.editMessageText("❌ <i>ChatGPT সার্ভারে সমস্যা দেখা দিয়েছে! কিছুক্ষণ পর আবার চেষ্টা করুন।</i>", {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'HTML'
            });
        }
    }
};
