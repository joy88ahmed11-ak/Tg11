const axios = require('axios');

module.exports = {
    config: {
        name: "bd",
        version: "2.2.0",
        role: 0,
        author: "Joy Ahmed",
        cooldown: 5,
        description: "Send BD video link with Mini App player",
        usePrefix: true
    },

    onStart: async function ({ bot, chatId, msg }) {
        const apiUrl = "http://nayan-primehub.vercel.app/bd";

        const loadingMsg = await bot.sendMessage(chatId, "⏳ <i>ভিডিও লিংক প্রসেস করা হচ্ছে...</i>", {
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id
        });

        try {
            // API Call with 8 Second Timeout
            const response = await axios.get(apiUrl, { timeout: 8000 });
            const data = response.data || {};

            const videoUrl = data.url || data.video || data.link || data.data;
            const thumbnailUrl = data.cover || data.image || data.thumbnail || data.ss;

            if (videoUrl) {
                const replyMarkup = {
                    inline_keyboard: [
                        [{ text: "🚀 Open Mini App", web_app: { url: videoUrl } }],
                        [{ text: "🌐 Direct Link", url: videoUrl }]
                    ]
                };

                const captionText = 
`🇧🇩 <b><u>𝙱𝙰𝙽𝙶𝙻𝙰𝙳𝙴𝚂𝙷𝙸  𝚅𝙸𝙳𝙴𝙾</u></b>

🔗 <b>𝙻𝚒𝚗𝚔:</b> <code>${videoUrl}</code>
👑 <b>𝙾𝚯𝚗𝚎𝚛:</b>  <b><u>𝙹𝚘𝚢 𝙰𝚑𝚖𝚎𝚍</u></b>`;

                if (thumbnailUrl && typeof thumbnailUrl === 'string' && thumbnailUrl.startsWith('http')) {
                    try {
                        await bot.sendPhoto(chatId, thumbnailUrl, {
                            caption: captionText,
                            parse_mode: 'HTML',
                            reply_markup: replyMarkup,
                            reply_to_message_id: msg.message_id
                        });
                        return await bot.deleteMessage(chatId, loadingMsg.message_id);
                    } catch (e) {}
                }

                await bot.sendVideo(chatId, videoUrl, {
                    caption: captionText,
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup,
                    reply_to_message_id: msg.message_id
                });

                return await bot.deleteMessage(chatId, loadingMsg.message_id);
            }
            
            throw new Error("Invalid Video URL");

        } catch (err) {
            console.error('BD Command Error:', err.message);

            // API সার্ভার ডাউন থাকলেও যাতে মেসেজ ও প্লেয়ার বাটন সেন্ড করে (Safe Emergency Fallback)
            const fallbackUrl = "http://nayan-primehub.vercel.app/bd";
            
            const emergencyMarkup = {
                inline_keyboard: [
                    [{ text: "🚀 Try Open Mini App", web_app: { url: fallbackUrl } }],
                    [{ text: "🌐 Open In Browser", url: fallbackUrl }]
                ]
            };

            const emergencyText = 
`⚠️ <b><u>𝚂𝙴𝚁𝚅𝙴𝚁 𝙽𝙾𝚃𝙸𝙲𝙴</u></b>

❌ <i>API সার্ভার স্লো বা সাড়া দিচ্ছে না!</i>
👉 তবে আপনি নিচের বাটনে ক্লিক করে সরাসরি ওয়েবে ট্রাই করতে পারেন।

👑 <b>𝙾𝚯𝚗𝚎𝚛:</b>  <b><u>𝙹𝚘𝚢 𝙰𝚑𝚖𝚎𝚍</u></b>`;

            return bot.editMessageText(emergencyText, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'HTML',
                reply_markup: emergencyMarkup
            });
        }
    }
};
