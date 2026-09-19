const axios = require('axios');

module.exports = {
    config: {
        name: "4k",
        version: "1.0.0",
        role: 0,
        author: "Joy Ahmed",
        cooldown: 10,
        usePrefix: true
    },

    onStart: async function ({ bot, chatId, msg, args, config }) {
        const prefix = config.prefix || '/';

        // রিপ্লাই মেসেজে কোনো ছবি আছে কি না চেক
        let photoObj = null;
        if (msg.reply_to_message && msg.reply_to_message.photo) {
            photoObj = msg.reply_to_message.photo[msg.reply_to_message.photo.length - 1];
        } else if (msg.photo) {
            photoObj = msg.photo[msg.photo.length - 1];
        }

        if (!photoObj) {
            return bot.sendMessage(chatId, `✨ <b><u>𝟺𝙺 𝙴𝙽𝙷𝙰𝙽𝙲𝙴𝚁</u></b> ✨\n\n❌ <i>পিকচার রিপ্লাই করে কমান্ডটি লিখুন!</i>\n👉 <code>${prefix}4k</code>`, {
                parse_mode: 'HTML',
                reply_to_message_id: msg.message_id
            });
        }

        const waitMsg = await bot.sendMessage(chatId, "⏳ <i>অপেক্ষা করুন, আপনার ছবিটি 4K কোয়ালিটিতে কনভার্ট করা হচ্ছে...</i>", {
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id
        });

        try {
            // Telegram Server থেকে ছবির Direct Link নেওয়া
            const fileDetails = await bot.getFile(photoObj.file_id);
            const telegramFileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN || config.token}/${fileDetails.file_path}`;

            // Upscale API call
            const upscaleApiUrl = `https://api.vyturex.com/upscale?url=${encodeURIComponent(telegramFileUrl)}`;
            
            const response = await axios.get(upscaleApiUrl, { responseType: 'arraybuffer', timeout: 30000 });
            const imageBuffer = Buffer.from(response.data, 'binary');

            // প্রসেসিং মেসেজ মুছে দিয়ে 4K ছবি পাঠানো
            await bot.deleteMessage(chatId, waitMsg.message_id);

            const captionText = 
`✨ ═════════════════ ✨
  📸  <b><u>𝟺𝙺 𝙴𝙽𝙷𝙰𝙽𝙲𝙴𝙳 𝙿𝙷𝙾𝚃𝙾</u></b>
✨ ═════════════════ ✨

👑 <b>𝙱𝚘𝚝 𝙾𝚠𝚗𝚎𝚛:</b>  <b><u>𝙹𝚘𝚢 𝙰𝚑𝚖𝚎𝚍</u></b>
✅ <b>𝚂𝚝𝚊𝚝𝚞𝚜:</b>  <i>Successfully Enhanced to 4K Quality!</i>`;

            await bot.sendPhoto(chatId, imageBuffer, {
                caption: captionText,
                parse_mode: 'HTML',
                reply_to_message_id: msg.message_id
            });

        } catch (err) {
            console.error('4K Enhancer Error:', err.message);
            await bot.deleteMessage(chatId, waitMsg.message_id);
            await bot.sendMessage(chatId, "❌ <i>ছবিটি 4K কোয়ালিটিতে পরিবর্তন করতে ব্যর্থ হয়েছে। পরবর্তীতে আবার চেষ্টা করুন।</i>", {
                parse_mode: 'HTML',
                reply_to_message_id: msg.message_id
            });
        }
    }
};
