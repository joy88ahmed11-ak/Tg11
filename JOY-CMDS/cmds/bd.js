const axios = require('axios');

module.exports = {
    config: {
        name: "bd",
        version: "6.0.0",
        role: 0,
        author: "Joy Ahmed",
        cooldown: 5,
        description: "Fetch BD video with Server Down Safe Fallback",
        usePrefix: true
    },

    onStart: async function ({ bot, chatId, msg }) {
        const primaryApi = "http://nayan-primehub.vercel.app/bd";

        const loadingMsg = await bot.sendMessage(chatId, "⏳ <i>ভিডিও সার্ভিস লোড হচ্ছে...</i>", {
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id
        });

        let videoUrl = "";
        let videoTitle = "Bangladeshi Video";

        try {
            // ১. প্রাইমারি API কল করার চেষ্টা
            const response = await axios.get(primaryApi, { timeout: 5000 });
            const data = response.data || {};
            videoUrl = data.url || data.video || data.link || data.cp || "";
            if (data.title) videoTitle = data.title;
        } catch (err) {
            console.log("Primary API Down, switching to fallback server...");
        }

        // ২. যদি প্রাইমারি API কাজ না করে, ব্যাকআপ সোর্স ব্যবহার করা
        if (!videoUrl) {
            videoUrl = "https://raw.githubusercontent.com/JUBAED-AHMED-JOY/Joy/main/sample_bd.mp4"; // তোমার যেকোনো ডাইরেক্ট ভিডিও লিঙ্ক
        }

        // HTTPS নিশ্চিত করা (টেলিগ্রাম বাটনের জন্য)
        const safeVideoUrl = videoUrl.replace(/^http:\/\//i, 'https://');

        // Inline Keyboard Setup
        const replyMarkup = {
            inline_keyboard: [
                [
                    {
                        text: "🚀 Open Video Player",
                        web_app: { url: "https://www.w3schools.com/html/mov_bbb.mp4" } // টেলিগ্রাম এলাউড টেস্ট মিনি অ্যাপ প্লেয়ার
                    }
                ],
                [
                    {
                        text: "🌐 Direct Video Link",
                        url: safeVideoUrl
                    }
                ]
            ]
        };

        const captionText = 
`🇧🇩 <b><u>𝙱𝙰𝙽𝙶𝙻𝙰𝙳𝙴𝚂𝙷𝙸  𝚅𝙸𝙳𝙴𝙾</u></b>

📝 <b>𝚃𝚒𝚝𝚕𝚎:</b> <i>${videoTitle}</i>
🔗 <b>𝙻𝚒𝚗𝚔:</b> <code>${safeVideoUrl}</code>
👑 <b>𝙾𝚯𝚗𝚎𝚛:</b>  <b><u>𝙹𝚘𝚢 𝙰𝚑𝚖𝚎𝚍</u></b>`;

        try {
            // সরাসরি ভিডিও সেন্ড
            await bot.sendVideo(chatId, safeVideoUrl, {
                caption: captionText,
                parse_mode: 'HTML',
                reply_markup: replyMarkup,
                reply_to_message_id: msg.message_id
            });

            await bot.deleteMessage(chatId, loadingMsg.message_id);

        } catch (sendErr) {
            console.error('Send Video Error:', sendErr.message);

            // ভিডিও পাঠাতে সমস্যা হলে লিংক সহ বাটন পাঠাবে
            const fallbackMarkup = {
                inline_keyboard: [
                    [{ text: "🌐 Open Video In Browser", url: safeVideoUrl }]
                ]
            };

            await bot.editMessageText(`🇧🇩 <b><u>𝙱𝙰𝙽𝙶𝙻𝙰𝙳𝙴𝚂𝙷𝙸  𝚅𝙸𝙳𝙴𝙾</u></b>\n\n🔗 <b>Video Link:</b> ${safeVideoUrl}\n\n👑 <b>Owner:</b> <b><u>Joy Ahmed</u></b>`, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'HTML',
                reply_markup: fallbackMarkup
            });
        }
    }
};
