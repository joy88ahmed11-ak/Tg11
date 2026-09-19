const axios = require('axios');

module.exports = {
    config: {
        name: "bd",
        version: "1.0.0",
        role: 0,
        author: "Joy Ahmed",
        cooldown: 5,
        description: "Send random BD video from API",
        usePrefix: true
    },

    onStart: async function ({ bot, chatId, msg, config }) {
        const apiUrl = "http://nayan-primehub.vercel.app/bd";

        // ভিডিও লোডিং মেসেজ পাঠানো
        const loadingMsg = await bot.sendMessage(chatId, "⏳ <i>ভিডিও ডাউনলোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</i>", {
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id
        });

        try {
            // API থেকে ডাটা ফেচ করা
            const response = await axios.get(apiUrl);
            const videoUrl = response.data.url || response.data.video || response.data.link;

            if (!videoUrl) {
                return bot.editMessageText("❌ <i>ভিডিও লিংক পাওয়া যায়নি!</i>", {
                    chat_id: chatId,
                    message_id: loadingMsg.message_id,
                    parse_mode: 'HTML'
                });
            }

            // ভিডিও চ্যাটে সেন্ড করা
            await bot.sendVideo(chatId, videoUrl, {
                caption: `🇧🇩 <b><u>𝙱𝙰𝙽𝙶𝙻𝙰𝙳𝙴𝚂𝙷𝙸 𝚅𝙸𝙳𝙴𝙾</u></b>\n\n👑 <b>𝙾𝚯𝚗𝚎𝚛:</b>  <b><u>𝙹𝚘𝚢 𝙰𝚑𝚖𝚎𝚍</u></b>`,
                parse_mode: 'HTML',
                reply_to_message_id: msg.message_id
            });

            // লোডিং মেসেজটি মুছে ফেলা
            await bot.deleteMessage(chatId, loadingMsg.message_id);

        } catch (err) {
            console.error('BD Command Error:', err.message);
            return bot.editMessageText("❌ <i>ভিডিও পাঠাতে সমস্যা হয়েছে! সার্ভার ডাউন থাকতে পারে।</i>", {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'HTML'
            });
        }
    }
};
