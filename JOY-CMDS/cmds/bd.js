const axios = require('axios');

module.exports = {
    config: {
        name: "bd",
        version: "2.1.0",
        role: 0,
        author: "Joy Ahmed",
        cooldown: 5,
        description: "Send BD video link with Mini App player and SS",
        usePrefix: true
    },

    onStart: async function ({ bot, chatId, msg }) {
        const apiUrl = "http://nayan-primehub.vercel.app/bd";

        const loadingMsg = await bot.sendMessage(chatId, "⏳ <i>ডাটা লোড হচ্ছে, অপেক্ষা করুন...</i>", {
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id
        });

        try {
            const response = await axios.get(apiUrl, { timeout: 10000 });
            const data = response.data;

            // API থেকে লিংক বের করা
            const videoUrl = data.url || data.video || data.link || data.data;
            const thumbnailUrl = data.cover || data.image || data.thumbnail || data.ss;

            if (!videoUrl) {
                return bot.editMessageText("❌ <i>API থেকে কোনো ভিডিও লিংক পাওয়া যায়নি!</i>", {
                    chat_id: chatId,
                    message_id: loadingMsg.message_id,
                    parse_mode: 'HTML'
                });
            }

            // Mini App Webview Button Setup
            const replyMarkup = {
                inline_keyboard: [
                    [
                        {
                            text: "🚀 Open Mini App",
                            web_app: { url: videoUrl }
                        }
                    ],
                    [
                        {
                            text: "🌐 Direct Link",
                            url: videoUrl
                        }
                    ]
                ]
            };

            const captionText = 
`🇧🇩 <b><u>𝙱𝙰𝙽𝙶𝙻𝙰𝙳𝙴𝚂𝙷𝙸  𝚅𝙸𝙳𝙴𝙾</u></b>

🔗 <b>𝙻𝚒𝚗𝚔:</b> <code>${videoUrl}</code>
👑 <b>𝙾𝚯𝚗𝚎𝚛:</b>  <b><u>𝙹𝚘𝚢 𝙰𝚑𝚖𝚎𝚍</u></b>`;

            // ১. যদি থাম্বনেইল/স্ক্রিনশট ছবি পাওয়া যায়
            if (thumbnailUrl && typeof thumbnailUrl === 'string' && thumbnailUrl.startsWith('http')) {
                try {
                    await bot.sendPhoto(chatId, thumbnailUrl, {
                        caption: captionText,
                        parse_mode: 'HTML',
                        reply_markup: replyMarkup,
                        reply_to_message_id: msg.message_id
                    });
                    return await bot.deleteMessage(chatId, loadingMsg.message_id);
                } catch (photoErr) {
                    console.error('Photo send failed, falling back to video:', photoErr.message);
                }
            }

            // ২. স্ক্রিনশট না থাকলে বা ফটো পাঠাতে ব্যর্থ হলে সরাসরি ভিডিও পাঠানো
            await bot.sendVideo(chatId, videoUrl, {
                caption: captionText,
                parse_mode: 'HTML',
                reply_markup: replyMarkup,
                reply_to_message_id: msg.message_id
            });

            await bot.deleteMessage(chatId, loadingMsg.message_id);

        } catch (err) {
            console.error('BD Command Error:', err.message);
            
            // এরর হলে শুধু লিঙ্ক সহ মেসেজ সেন্ড করার সেফ অপশন
            return bot.editMessageText("❌ <i>ভিডিও মিডিয়া লোড হতে সমস্যা হয়েছে। সরাসরি API সার্ভার সাড়া দিচ্ছে না।</i>", {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'HTML'
            });
        }
    }
};
