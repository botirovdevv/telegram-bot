const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram bot tokeni
const token = process.env.TELEGRAM_BOT_TOKEN || "7504720237:AAG_tbSLqZpfH9CSg3vEuF4CzerQKlld5F0";
const ADMIN_ID = process.env.ADMIN_ID || "5663095517"; // Admin ID

// Yangi xabarlar saqlanadigan obyekt
const userMessages = {};

// Botni webhook rejimida ishga tushiramiz
const bot = new TelegramBot(token, { webHook: true });
bot.setWebHook(`https://iphone-emoji.onrender.com/${token}`);

app.use(bodyParser.json());

// Telegram webhook endpoint
app.post(`/${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// 🔹 **Foydalanuvchi /start bosganda**
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "👋 Salom! Savollaringizni yozing, admin javob beradi.");
});

// 🔹 **Admin uchun /admin komandasi**
bot.onText(/\/admin/, (msg) => {
    if (msg.chat.id == ADMIN_ID) {
        bot.sendMessage(msg.chat.id, "👑 Admin panelga xush kelibsiz!", {
            reply_markup: {
                keyboard: [
                    [{ text: "📥 Yangi savollar" }],
                    [{ text: "🔙 Chiqish" }]
                ],
                resize_keyboard: true
            }
        });
    } else {
        bot.sendMessage(msg.chat.id, "🚫 Siz admin emassiz!");
    }
});

// 🔹 **Admin "📥 Yangi savollar" tugmasini bossachi**
bot.on("message", (msg) => {
    const chatId = msg.chat.id;

    if (chatId == ADMIN_ID && msg.text === "📥 Yangi savollar") {
        if (Object.keys(userMessages).length === 0) {
            bot.sendMessage(ADMIN_ID, "📭 Hozircha yangi xabarlar yo‘q.");
        } else {
            let messageList = "📩 **Yangi xabarlar:**\n\n";
            Object.keys(userMessages).forEach((userId) => {
                messageList += `👤 ${userMessages[userId].name} (ID: ${userId})\n✉️ ${userMessages[userId].message}\n\n`;
            });
            bot.sendMessage(ADMIN_ID, messageList, { parse_mode: "Markdown" });
        }
    }

    // 🔹 **Admin "🔙 Chiqish" tugmasini bossachi**
    if (chatId == ADMIN_ID && msg.text === "🔙 Chiqish") {
        bot.sendMessage(ADMIN_ID, "🏠 Asosiy menyuga qaytdingiz.", {
            reply_markup: { remove_keyboard: true }
        });
    }

    // 🔹 **Admin foydalanuvchiga javob yozsa**
    if (chatId == ADMIN_ID && msg.reply_to_message) {
        const replyText = msg.text;
        const originalMsg = msg.reply_to_message.text;
        const userIdMatch = originalMsg.match(/ID: (\d+)/);

        if (userIdMatch) {
            const userId = userIdMatch[1];
            bot.sendMessage(userId, `📩 **Admin javobi:**\n\n✉️ ${replyText}`, { parse_mode: "Markdown" });
            bot.sendMessage(ADMIN_ID, "✅ Javob yuborildi!");
            delete userMessages[userId]; // Xabar ro‘yxatdan o‘chiriladi
        }
    }
});

// 🔹 **Foydalanuvchilar yozgan har qanday xabar adminga yuboriladi**
bot.on("message", (msg) => {
    const chatId = msg.chat.id;

    if (chatId != ADMIN_ID && msg.text !== "/start" && msg.text !== "/admin") {
        userMessages[chatId] = {
            name: msg.chat.first_name,
            message: msg.text
        };
        bot.sendMessage(ADMIN_ID, `📩 **Yangi xabar:**\n\n👤 Foydalanuvchi: ${msg.chat.first_name}\n🆔 ID: ${chatId}\n\n✉️ Xabar: ${msg.text}`);
    }
});

// 🔹 **Serverni ishga tushirish**
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
