import { Telegraf } from "telegraf";
import { code } from "telegraf/format";
import { message } from "telegraf/filters";
import { ogg } from "./ogg.js";
import { openAI } from "./openai.js";
import config from 'config';

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.on(message('voice'), async ctx => {
    try {
        await ctx.reply(code('Запит отримано, очікуйте на відповідь :)'));
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);

        const oggPath = await ogg.create(link, userId);
        const mp3Path = await ogg.toMp3(oggPath, userId);

        const content = await openAI.transcription(mp3Path);
        await ctx.reply(code(`Ваш запит: "${content}"`));

        const messages = [{ role: 'user', content }]
        const response = await openAI.chat(messages);

        await ctx.reply(code(response.content));
    } catch (e) {
        console.log('Voice message error', e.message);
    }
})

bot.command('start', async (ctx) => {
    await ctx.reply(code('Продиктуйте або напишіть свій запит :)'));
})

bot.on(message('text'), async ctx => {
    try {
        await ctx.reply(code('Запит отримано, очікуйте на відповідь :)'));

        await ctx.reply(code(`Ваш запит: "${ctx.message.text}"`));

        const messages = [{role: 'user', content: ctx.message.text}]
        const response = await openAI.chat(messages);

        await ctx.reply(code(response.content));
    } catch (e) {
        console.log('Text message error', e.message);
    }
})

bot.launch().then();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
