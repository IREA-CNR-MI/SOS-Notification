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
            const temp = (<any>Object).assign({}, msg.chat);
            temp.subscribedTo = [];
            this.conversations.push(msg.chat);
            fs.writeFileSync('conversations.json', JSON.stringify(this.conversations), 'utf8');
        });
        this.bot.onText(/\/unsubscribe/, (msg) => {
            console.log('unsubscribe', msg);
            this.bot.sendMessage(msg.chat.id, "Goodbye " + msg.chat.id);
            this.unsubscribe(msg.chat.id);
            fs.writeFileSync('conversations.json', JSON.stringify(this.conversations), 'utf8');
        });

        this.bot.onText(/\/filter ([a-z]+) ([<>=]+) ([0-9]+)/, (msg, match) => {
            console.log('received filter', msg, match);
            const obsProp = match[1];
            const operator = match[2];
            const value = match[3];
            const convo = this.getConversation(msg.chat.id);
            if ( convo ) {
                console.log('filtering on', msg.chat.id, obsProp, operator, value);
            }
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

    getSubscribedTo(topic: string) {
        const temp = [];
        for ( let c of this.conversations ) {
            for ( let s of c.subscribedTo ) {
                if ( s.observedProperty === topic ) {
                    if ( temp.indexOf(c) < 0 ) {
                        temp.push(c);
                    }
                }
            }
        }
        return temp;
    }

    saveConversations() {
        fs.writeFileSync('conversations.json', JSON.stringify(this.conversations), 'utf8');
    }

    getConversation(id) {
        for ( let c of this.conversations ) {
            if ( c.id === id ) {
                return c;
            }
        }
    }

    updateConversation(conversation) {
        for ( let c of this.conversations ) {
            if ( c.id === conversation.id ) {
                c.subscribedTo = conversation.subscribedTo;
            }
        }
        this.saveConversations();
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

    sendTo(chat, message) {
        this.bot.sendMessage(chat, message, {parse_mode : "HTML"});
    }
}
