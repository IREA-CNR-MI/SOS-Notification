import * as TelegramBotApi from 'node-telegram-bot-api';
import * as fs from 'fs';

const token = '517522188:AAHqkW_VebuqgG_aWBIGyBianTfDyaQoFDs';

export class TelegramBot {
    bot = new TelegramBotApi(token, {polling: true});
    conversations = [];

    constructor() {
        this.conversations = JSON.parse(fs.readFileSync('conversations.json').toString());
        console.log('TelegramBot', this.conversations);
        this.bot.onText(/\/subscribe/, (msg) => {
            console.log('subscribe', msg);
            this.bot.sendMessage(msg.chat.id, "Welcome to " + msg.chat.id);
            this.conversations.push(msg.chat);
            fs.writeFileSync('conversations.json', JSON.stringify(this.conversations), 'utf8');
        });
        this.bot.onText(/\/unsubscribe/, (msg) => {
            console.log('unsubscribe', msg);
            this.bot.sendMessage(msg.chat.id, "Goodbye " + msg.chat.id);
            this.unsubscribe(msg.chat.id);
            fs.writeFileSync('conversations.json', JSON.stringify(this.conversations), 'utf8');
        });

        this.bot.onText(/\/luci_(.+)/, (msg, match) => {
            console.log('received luci', msg, match);
            const resp = match[1];
        });

        this.bot.onText(/\/status/, (msg, match) => {
            console.log('status request');
            // client.publish('casa/soggiorno', 'status');
        });

        this.bot.onText(/\/manual/, (msg, match) => {
            console.log('status request');
            // client.publish('casa/soggiorno/luci', 'manual');
        });
        this.bot.onText(/\/auto/, (msg, match) => {
            console.log('status request');
            // client.publish('casa/soggiorno/luci', 'auto');
        });
        this.bot.onText(/\/training_on/, (msg, match) => {
            console.log('status request');
            // client.publish('casa', 'training');
        });
        this.bot.onText(/\/training_off/, (msg, match) => {
            console.log('status request');
            // client.publish('casa', 'training stop');
        });

        /*
                this.bot.on('message', (msg) => {
                    const chatId = msg.chat.id;

                    // send a message to the chat acknowledging receipt of their message
                    this.send('Received a message from ' + msg.chat.first_name + ' ' + msg.chat.last_name + ': \'' + msg + '\'');
                });
        */
    }

    private unsubscribe(id) {
        for ( let i = 0; i < this.conversations.length; i++ ) {
            let c = this.conversations[i];
            if ( c.id === id ) {
                this.conversations.splice(i, 1);
            }
        }
    }

    send(message: any) {
        for ( let c of this.conversations ) {
            // console.log('send', c);
            this.bot.sendMessage(c.id, message, {parse_mode : "HTML"});
        }
    }
}
