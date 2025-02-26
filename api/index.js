const TelegramBot = require("node-telegram-bot-api");

const token = '8073391955:AAHSGZDJjLP8pztdLfmMC8AVskBfOStwR6Q'
const bot = new TelegramBot(token, { webHook: true });

const ADMIN_CHAT_ID = 5663095517;
let userEmojiUsage = {};
const userMessageMap = new Map();

// 🔍 Emojilarni ajratib olish
const extractEmojis = (text) => {
    return [...text].filter(char => char.match(/\p{Emoji}/u));
};

// ⏳ Haftalik limitni tiklash
const resetEmojiLimit = () => {
    userEmojiUsage = {};
    console.log("✅ Emoji limiti yangilandi!");
};
setInterval(resetEmojiLimit, 7 * 24 * 60 * 60 * 1000);

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
        chatId,
        `👋 Assalomu alaykum! \n\n📌 *Foydalanish qoidalari:* \n✅ Haftasiga *5 xil emoji* yuborishingiz mumkin. \n✅ Matnli xabarlarni cheklovsiz yuborishingiz mumkin. \n\n🔥 Xabaringizni yuboring! `,
        { parse_mode: "Markdown" }
    );
});

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || "";
    const username = msg.from.username ? `@${msg.from.username}` : "Username mavjud emas";
    const firstName = msg.from.first_name || "Noma'lum";
    const userId = msg.from.id;

    if (text.startsWith("/start")) return;

    const emojis = extractEmojis(text);

    if (emojis.length > 0) {
        if (!userEmojiUsage[chatId]) {
            userEmojiUsage[chatId] = new Set();
        }
        emojis.forEach((emoji) => userEmojiUsage[chatId].add(emoji));

        if (userEmojiUsage[chatId].size > 5) {
            return bot.sendMessage(chatId, `🚫 Siz haftasiga faqat *5 xil emoji* yuborishingiz mumkin!\n\n✅ Hozir yuborganlaringiz: ${[...userEmojiUsage[chatId]].join(" ")}`, { parse_mode: "Markdown" });
        }

        bot.sendMessage(chatId, `✅ Emoji qabul qilindi! (${userEmojiUsage[chatId].size}/5)\n\n📌 Siz yuborgan emojilar: ${[...userEmojiUsage[chatId]].join(" ")}`);
    }

    if (text || emojis.length > 0) {
        const messageText = `📩 *Yangi xabar!* \n\n👤 *Foydalanuvchi:* ${firstName} \n🆔 *ID:* ${userId} \n🔹 *Username:* ${username} \n💬 *Xabar:* ${text} ${emojis.join("")}`;
        
        bot.sendMessage(ADMIN_CHAT_ID, messageText, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[{ text: "✍️ Javob yozish", callback_data: `reply_${userId}` }]]
            }
        });

        userMessageMap.set(userId, chatId);

        bot.sendMessage(chatId, "✅ Xabaringiz adminlarga yetkazildi.");
    }
});

// 🔄 Admindan javob olish
bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith("reply_")) {
        const userId = data.split("_")[1];

        bot.sendMessage(chatId, `✍️ Foydalanuvchiga javob yozing:`, {
            reply_markup: {
                force_reply: true
            }
        }).then(sentMessage => {
            bot.onReplyToMessage(sentMessage.chat.id, sentMessage.message_id, (replyMsg) => {
                if (userMessageMap.has(Number(userId))) {
                    const userChatId = userMessageMap.get(Number(userId));
                    bot.sendMessage(userChatId, `📩 *Admin javobi:* \n\n${replyMsg.text}`, { parse_mode: "Markdown" });
                    bot.sendMessage(chatId, "✅ Xabar yuborildi.");
                } else {
                    bot.sendMessage(chatId, "❌ Foydalanuvchi topilmadi.");
                }
            });
        });
    }
});

let newEmojis = new Set(); // Yangi yuborilgan emojilar saqlanadigan joy

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || "";
    const emojis = extractEmojis(text);

    if (text.startsWith("/start")) return;

    if (emojis.length > 0) {
        emojis.forEach((emoji) => {
            newEmojis.add(emoji); // Admin uchun emoji ro'yxatga qo'shish
        });

        if (!userEmojiUsage[chatId]) {
            userEmojiUsage[chatId] = new Set();
        }
        emojis.forEach((emoji) => userEmojiUsage[chatId].add(emoji));

        if (userEmojiUsage[chatId].size > 5) {
            return bot.sendMessage(chatId, `🚫 Siz haftasiga faqat *5 xil emoji* yuborishingiz mumkin!\n\n✅ Hozir yuborganlaringiz: ${[...userEmojiUsage[chatId]].join(" ")}`, { parse_mode: "Markdown" });
        }

        bot.sendMessage(chatId, `✅ Emoji qabul qilindi! (${userEmojiUsage[chatId].size}/5)\n\n📌 Siz yuborgan emojilar: ${[...userEmojiUsage[chatId]].join(" ")}`);
    }
});

// 🛠 Admin yangi yuborilgan emojilarni ko'rish uchun
bot.onText(/\/emojilar/, (msg) => {
    if (msg.chat.id !== ADMIN_CHAT_ID) {
        return bot.sendMessage(msg.chat.id, "❌ Ushbu buyruq faqat admin uchun mavjud.");
    }

    if (newEmojis.size === 0) {
        return bot.sendMessage(ADMIN_CHAT_ID, "ℹ️ Yangi yuborilgan emojilar yo'q.");
    }

    const emojiList = [...newEmojis].join(" ");
    bot.sendMessage(ADMIN_CHAT_ID, `🆕 *Yangi yuborilgan emojilar:* \n\n${emojiList}`, { parse_mode: "Markdown" });

    newEmojis.clear(); // Ko'rib bo'lingan emojilarni tozalash
});


module.exports = async (req, res) => {
    if (req.method === "POST") {
        bot.processUpdate(req.body);
        res.status(200).send("✅ Webhook qabul qilindi");
    } else {
        res.status(200).send("🚀 Telegram bot webhook ishlayapti");
    }
};
