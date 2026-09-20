const axios = require('axios');

module.exports = {
    config: {
        name: "bd",
        version: "5.0.0",
        role: 0,
        author: "Joy Ahmed",
        cooldown: 5,
        description: "Fetch BD video, screenshot, and dynamic Mini App Webview",
        usePrefix: true
    },

    onStart: async function ({ bot, chatId, msg }) {
        const apiUrl = "http://nayan-primehub.vercel.app/bd";

        const loadingMsg = await bot.sendMessage(chatId, "⏳ <i>ভিডিও প্রসেস করা হচ্ছে, অপেক্ষা করুন...</i>", {
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id
        });

        try {
            // API Scraping / Fetching
            const response = await axios.get(apiUrl, { timeout: 10000 });
            const data = response.data || {};

            // Extract Video Details
            const videoUrl = data.url || data.video || data.link || data.cp;
            const videoTitle = data.title || data.name || "Bangladeshi Video";
            const thumbnailUrl = data.cp || data.cover || data.image || data.thumbnail || data.ss;

            if (!videoUrl) {
                return bot.editMessageText("❌ <i>API থেকে কোনো ভিডিও লিঙ্ক পাওয়া যায়নি!</i>", {
                    chat_id: chatId,
                    message_id: loadingMsg.message_id,
                    parse_mode: 'HTML'
                });
            }

            // HTML Web App Player Builder (To avoid ETELEGRAM 400 Bad Request)
            const htmlContent = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>body{margin:0;background:#000;display:flex;justify-content:center;align-items:center;height:100vh;}video{width:100%;max-height:100vh;}</style></head><body><video controls autoplay loop src="${videoUrl}"></video></body></html>`;
            
            // Convert HTML code to HTTPS Data URI Web App Link
            const webAppUrl = `https://htmlpreview.github.io/?data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

            const replyMarkup = {
                inline_keyboard: [
                    [
                        {
                            text: "🚀 Open Mini App Player",
                            web_app: { url: webAppUrl }
                        }
                    ],
                    [
                        {
                            text: "🌐 Direct Video Link",
                            url: videoUrl
                        }
                    ]
                ]
            };

            const captionText = 
`🇧🇩 <b><u>𝙱𝙰𝙽𝙶𝙻𝙰𝙳𝙴𝚂𝙷𝙸  𝚅𝙸𝙳𝙴𝙾</u></b>

📝 <b>𝚃𝚒𝚝𝚕𝚎:</b> <i>${videoTitle}</i>
🔗 <b>𝙻𝚒𝚗𝚔:</b> <code>${videoUrl}</code>
👑 <b>𝙾𝚯𝚗𝚎𝚛:</b>  <b><u>𝙹𝚘𝚢 𝙰𝚑𝚖𝚎𝚍</u></b>`;

            // ১. স্ক্রিনশট / থাম্বনেইল সাপোর্ট
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
                    console.error('Photo Send Failed:', photoErr.message);
                }
            }

            // ২. ডাইরেক্ট ভিডিও সেন্ড (ভিডিও প্লেয়ার বাটন সহ)
            await bot.sendVideo(chatId, videoUrl, {
                caption: captionText,
                parse_mode: 'HTML',
                reply_markup: replyMarkup,
                reply_to_message_id: msg.message_id
            });

            await bot.deleteMessage(chatId, loadingMsg.message_id);

        } catch (err) {
            console.error('BD Command Error:', err.message);

            return bot.editMessageText("❌ <i>ভিডিও লোড করতে সমস্যা হয়েছে! সার্ভার ডাউন অথবা নেটওয়ার্ক সমস্যা।</i>", {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'HTML'
            });
        }
    }
};
