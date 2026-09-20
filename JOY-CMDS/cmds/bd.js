const axios = require('axios');

module.exports = {
    config: {
        name: "bd",
        version: "2.0.0",
        role: 0,
        author: "Joy Ahmed",
        cooldown: 5,
        description: "Send BD video with SS and Mini App Webview Button",
        usePrefix: true
    },

    onStart: async function ({ bot, chatId, msg }) {
        const apiUrl = "http://nayan-primehub.vercel.app/bd";

        const loadingMsg = await bot.sendMessage(chatId, "⏳ <i>ডাটা লোড হচ্ছে, অপেক্ষা করুন...</i>", {
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id
        });

        try {
            const response = await axios.get(apiUrl);
            
            // API Response Data Validation
            const videoUrl = response.data.url || response.data.video || response.data.link;
            const thumbnailUrl = response.data.cover || response.data.image || response.data.thumbnail || response.data.ss;

            if (!videoUrl) {
                return bot.editMessageText("❌ <i>ভিডিও লিংক পাওয়া যায়নি!</i>", {
                    chat_id: chatId,
                    message_id: loadingMsg.message_id,
                    parse_mode: 'HTML'
                });
            }

            // Mini App Web App Button Definition
            const replyMarkup = {
                inline_keyboard: [
                    [
                        {
                            text: "🚀 Open Mini App",
                            web_app: { url: videoUrl } // Mini app style open
                        }
                    ],
                    [
                        {
                            text: "🌐 Direct Link",
                            url: videoUrl // Fallback direct URL button
                        }
                    ]
                ]
            };

            const captionText = 
`🇧🇩 <b><u>𝙱𝙰𝙽𝙶𝙻𝙰𝙳𝙴𝚂𝙷𝙸  𝚅𝙸𝙳𝙴𝙾</u></b>

🔗 <b>𝙻𝚒𝚗𝚔:</b> <code>${videoUrl}</code>
👑 <b>𝙾𝚯𝚗𝚎𝚛:</b>  <b><u>𝙹𝚘𝚢 𝙰𝚑𝚖𝚎𝚍</u></b>`;

            // যদি API থেকে স্ক্রিনশট/থম্বনেইল ইমেজ পাওয়া যায়, তাহলে ছবিসহ বাটন সেন্ড করবে
            if (thumbnailUrl) {
                await bot.sendPhoto(chatId, thumbnailUrl, {
                    caption: captionText,
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup,
                    reply_to_message_id: msg.message_id
                });
            } else {
                // ইমেজ না থাকলে সরাসরি ভিডিও দিয়ে সেন্ড করবে
                await bot.sendVideo(chatId, videoUrl, {
                    caption: captionText,
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup,
                    reply_to_message_id: msg.message_id
                });
            }

            // লোডিং মেসেজ ডিলিট
            await bot.deleteMessage(chatId, loadingMsg.message_id);

        } catch (err) {
            console.error('BD Command Error:', err.message);
            return bot.editMessageText("❌ <i>ভিডিও বা স্ক্রিনশট লোড করতে ব্যর্থ হয়েছে!</i>", {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'HTML'
            });
        }
    }
};
