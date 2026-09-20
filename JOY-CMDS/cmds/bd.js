const axios = require('axios');

module.exports = {
    config: {
        name: "bd",
        version: "3.0.0",
        role: 0,
        author: "Joy Ahmed",
        cooldown: 5,
        description: "Send BD Video with HTTPS Mini App Player",
        usePrefix: true
    },

    onStart: async function ({ bot, chatId, msg }) {
        const apiUrl = "https://nayan-primehub.vercel.app/bd"; // HTTPS লিঙ্ক

        const loadingMsg = await bot.sendMessage(chatId, "⏳ <i>ডাটা প্রসেস করা হচ্ছে...</i>", {
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id
        });

        try {
            const response = await axios.get(apiUrl, { timeout: 10000 });
            let rawUrl = response.data.url || response.data.video || response.data.link || response.data.data;
            let rawThumb = response.data.cover || response.data.image || response.data.thumbnail || response.data.ss;

            if (!rawUrl) {
                return bot.editMessageText("❌ <i>ভিডিও লিংক পাওয়া যায়নি!</i>", {
                    chat_id: chatId,
                    message_id: loadingMsg.message_id,
                    parse_mode: 'HTML'
                });
            }

            // HTTP কে HTTPS এ কনভার্ট করা (টেলিগ্রাম Mini App সিকিউরিটির জন্য)
            const videoUrl = rawUrl.replace(/^http:\/\//i, 'https://');
            const thumbnailUrl = rawThumb ? rawThumb.replace(/^http:\/\//i, 'https://') : null;

            // HTML Video Player URL (ভিডিও দেখার জন্য ডাইরেক্ট HTML লিঙ্ক)
            const htmlPlayerUrl = videoUrl; 

            const replyMarkup = {
                inline_keyboard: [
                    [
                        {
                            text: "🚀 Open Mini App Player",
                            web_app: { url: htmlPlayerUrl } // HTTPS নিশ্চিত করা হয়েছে
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

🔗 <b>𝚅𝚒𝚍𝚎𝚘 𝙻𝚒𝚗𝚔:</b> <code>${videoUrl}</code>
👑 <b>𝙾𝚯𝚗𝚎𝚛:</b>  <b><u>𝙹𝚘𝚢 𝙰𝚑𝚖𝚎𝚍</u></b>`;

            // যদি স্ক্রিনশট/থার্ম্বনেইল থাকে
            if (thumbnailUrl && thumbnailUrl.startsWith('https')) {
                try {
                    await bot.sendPhoto(chatId, thumbnailUrl, {
                        caption: captionText,
                        parse_mode: 'HTML',
                        reply_markup: replyMarkup,
                        reply_to_message_id: msg.message_id
                    });
                    return await bot.deleteMessage(chatId, loadingMsg.message_id);
                } catch (e) {
                    console.error('Photo Error, sending video instead:', e.message);
                }
            }

            // স্ক্রিনশট না থাকলে ভিডিও সেন্ড করবে
            await bot.sendVideo(chatId, videoUrl, {
                caption: captionText,
                parse_mode: 'HTML',
                reply_markup: replyMarkup,
                reply_to_message_id: msg.message_id
            });

            await bot.deleteMessage(chatId, loadingMsg.message_id);

        } catch (err) {
            console.error('BD Command Error:', err.message);

            return bot.editMessageText("❌ <i>ভিডিও লোড করতে সমস্যা হয়েছে। লিঙ্কটি HTTPS না হওয়ায় বা সার্ভার সাড়া না দেওয়ায় এমন হতে পারে।</i>", {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'HTML'
            });
        }
    }
};
