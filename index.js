const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram bot tokeni
const token = process.env.TELEGRAM_BOT_TOKEN || "8073391955:AAHSGZDJjLP8pztdLfmMC8AVskBfOStwR6Q";
const ADMIN_ID = process.env.ADMIN_ID || "5663095517"; // Admin ID

// Botni webhook rejimida ishga tushiramiz
const bot = new TelegramBot(token, { webHook: true });
bot.setWebHook(`https://iphone-emoji.onrender.com/${token}`);

app.use(bodyParser.json());

// Telegram webhook endpoint
app.post(`/${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Foydalanuvchilar uchun /start komandasi
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "👋 Salom! Savollaringizni yozing, admin javob beradi.");
});

// Admin panel uchun /admin komandasi
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

// Foydalanuvchilar yozgan har qanday xabar adminga yuboriladi
bot.on('message', (msg) => {
    if (msg.chat.id != ADMIN_ID && msg.text !== "/start" && msg.text !== "/admin") {
        bot.sendMessage(ADMIN_ID, `📩 Yangi xabar:\n\n👤 Foydalanuvchi: ${msg.chat.first_name}\n🆔 ID: ${msg.chat.id}\n\n✉️ Xabar: ${msg.text}`);
    }
});

// Serverni ishga tushirish
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
