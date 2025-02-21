const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// Bot tokeningizni yozing
const token = "8073391955:AAHSGZDJjLP8pztdLfmMC8AVskBfOStwR6Q";
const bot = new TelegramBot(token, { polling: true });

// Admin ID
const ADMIN_ID = 5663095517; // O'zingizning Telegram ID'ingizni yozing

const SERVER_URL = "https://iphone-emoji.onrender.com/"; 

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Foydalanuvchi haqida ma'lumot olish
    const firstName = msg.from.first_name || "Ism kiritilmagan";
    const lastName = msg.from.last_name || "";
    const username = msg.from.username ? `@${msg.from.username}` : "Username yo'q";
    const fullName = `${firstName} ${lastName}`.trim(); // Ism + familiya birlashtiriladi

    // Agar foydalanuvchi /start yozsa
    if (text === "/start") {
        return bot.sendMessage(chatId, "👋 Salom! Menga savolingizni yozing. Admin javob beradi.");
    }

    // Agar foydalanuvchi xabar yuborsa, uni Render serverga jo'natamiz
    if (chatId !== ADMIN_ID) {
        try {
            await axios.post(SERVER_URL, {
                userId: chatId,
                fullName,
                username,
                text
            });

            bot.sendMessage(chatId, "✅ Savolingiz adminga yuborildi! Tez orada javob olasiz.");
            bot.sendMessage(ADMIN_ID, `📩 *Yangi savol keldi!*\n👤 *Foydalanuvchi:* ${fullName}\n🔹 *Username:* ${username}\n🆔 *ID:* ${chatId}\n✉️ *Savol:* ${text}`, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Javob yozish", callback_data: `reply_${chatId}` }]
                    ]
                }
            });
        } catch (error) {
            console.error("Serverga yuborishda xatolik:", error);
            bot.sendMessage(chatId, "❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko‘ring.");
        }
    }
});

// Admin javob qaytarishi
bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const userId = query.data.split("_")[1]; // Foydalanuvchi ID sini olish

    bot.sendMessage(chatId, `💬 *Foydalanuvchiga javob yozing:*`, {
        parse_mode: "Markdown",
        reply_markup: {
            force_reply: true
        }
    }).then((sentMessage) => {
        bot.onReplyToMessage(sentMessage.chat.id, sentMessage.message_id, async (msg) => {
            try {
                await axios.post(`${SERVER_URL}/reply`, {
                    userId,
                    reply: msg.text
                });

                bot.sendMessage(userId, `👤 *Admin javobi:* ${msg.text}`, { parse_mode: "Markdown" });
                bot.sendMessage(chatId, "✅ Javob yuborildi.");
            } catch (error) {
                console.error("Javob yuborishda xatolik:", error);
                bot.sendMessage(chatId, "❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko‘ring.");
            }
        });
    });
});
