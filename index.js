const TelegramBot = require("node-telegram-bot-api");

// Bot tokenini o'zingizning tokeningiz bilan almashtiring
const token = "8073391955:AAHSGZDJjLP8pztdLfmMC8AVskBfOStwR6Q";
const bot = new TelegramBot(token, { polling: true });

// Admin ID (bu o'zingizning Telegram ID'ingiz)
const ADMIN_ID = 5663095517; // O'zingizning Telegram ID'ingizni yozing

// Admin panelga faqat admin kira olishi uchun
bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;

    if (chatId == ADMIN_ID) {
        bot.sendMessage(chatId, "👑 Admin paneliga xush kelibsiz!", {
            reply_markup: {
                keyboard: [
                    [{ text: "📥 Yangi savollar" }],
                    [{ text: "🔙 Chiqish" }]
                ],
                resize_keyboard: true
            }
        });
    } else {
        bot.sendMessage(chatId, "🚫 Siz admin emassiz!");
    }
});

let questions = [];

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const firstName = msg.from.first_name || "Ism kiritilmagan";
    const lastName = msg.from.last_name || "";
    const username = msg.from.username ? `@${msg.from.username}` : "Username yo'q";
    const fullName = `${firstName} ${lastName}`.trim(); // Ism + familiya birlashtiriladi

    if (chatId === ADMIN_ID && text === "🔙 Chiqish") {
        return bot.sendMessage(chatId, "🔒 Admin panel yopildi.", {
            reply_markup: { remove_keyboard: true }
        });
    }

    if (text === "/start") {
        return bot.sendMessage(chatId, "👋 Salom! Menga savolingizni yozing. Admin javob beradi.");
    }

    // Admin yangi savollarni ko'rishi
    if (chatId === ADMIN_ID && text && username === "📥 Yangi savollar") {
        if (questions.length === 0) {
            return bot.sendMessage(chatId, "✅ Hozircha yangi savollar yo'q.");
        }

        questions.forEach((q, index) => {
            bot.sendMessage(chatId, `📩 *Savol ${index + 1}:*\n👤 *Foydalanuvchi:* ${q.fullName}\n🔹 *Username:* ${q.username}\n🆔 *ID:* ${q.userId}\n✉️ *Savol:* ${q.text}`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Javob yozish", callback_data: `reply_${q.userId}` }]
                    ]
                }
            });
        });

        // Yangi savollarni tozalash
        questions = [];
    }

    // Agar foydalanuvchi xabar yuborsa, uni saqlaymiz va adminga xabar beramiz
    if (chatId !== ADMIN_ID) {
        questions.push({ userId: chatId, text: text });

        bot.sendMessage(ADMIN_ID, `📩 *Yangi savol keldi!*\n👤 *Foydalanuvchi:* ${fullName}\n🔹 *Username:* ${username}\n🆔 *ID:* ${chatId}\n✉️ *Savol:* ${text}`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Javob yozish", callback_data: `reply_${chatId}` }]
                ]
            }
        });

        bot.sendMessage(chatId, "✅ Savolingiz adminga yuborildi! Tez orada javob olasiz.");
    }
});

bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const userId = query.data.split("_")[1];

    bot.sendMessage(chatId, `💬 Foydalanuvchiga javob yozing:`, {
        reply_markup: {
            force_reply: true
        }
    }).then((sentMessage) => {
        bot.onReplyToMessage(sentMessage.chat.id, sentMessage.message_id, (msg) => {
            bot.sendMessage(userId, `👤 Admin javobi: ${msg.text}`);
            bot.sendMessage(chatId, "✅ Javob yuborildi.");
        });
    });
});
