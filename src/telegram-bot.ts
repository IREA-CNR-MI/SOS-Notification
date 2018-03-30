import * as TelegramBotApi from 'node-telegram-bot-api';
import * as fs from 'fs';

const token = '517522188:AAHqkW_VebuqgG_aWBIGyBianTfDyaQoFDs';
const json = require('format-json');

export class TelegramBot {
    bot = new TelegramBotApi(token, {polling: true});
    conversations = [];
    availableProperties = [
    	'temperature',
	    'humidity'
    ];
    state = {
    	humidity: -1,
	    temperature: -1
    }

    constructor() {
        this.conversations = JSON.parse(fs.readFileSync('conversations.json').toString());
        console.log('TelegramBot', this.conversations);
        this.bot.onText(/\/start/, (msg) => {
            console.log('subscribe', msg);
            this.bot.sendMessage(msg.chat.id, "Welcome to " + msg.chat.id);
            const temp = (<any>Object).assign({}, msg.chat);
            temp.subscribedTo = [];
            this.conversations.push(msg.chat);
            fs.writeFileSync('conversations.json', JSON.stringify(this.conversations), 'utf8');
        });

        this.bot.onText(/\/notify ([a-z]+) ([<>=]+) ([0-9]+)/, (msg, match) => {
            console.log('received filter', msg, match);
            const obsProp = match[1];
            const operator = match[2];
            const value = match[3];
            const convo = this.getConversation(msg.chat.id);
            if ( convo ) {
	            convo.subscribedTo.push({
		            observedProperty: obsProp,
		            filter: {
			            operator: operator,
			            value: value,
			            triggered: false
		            }
	            });
	            console.log('convo', convo);
	            this.saveConversations();
	            console.log('filtering on', msg.chat.id, obsProp, operator, value);
                this.sendTo(msg.chat.id, 'Alright, mate, I\'ll notify you when ' + obsProp + ' ' + operator + ' ' + value)
            }
        });

        this.bot.onText(/\/state/, (msg, match) => {
            console.log('status request');
	        this.sendTo(msg.chat.id, '*Current state:*' + json.plain(this.state));
        });

        this.bot.onText(/\/properties/, (msg, match) => {
            console.log('properties');
	        this.sendTo(msg.chat.id, '*Available properties:*' + json.plain(this.availableProperties));

            // client.publish('casa/soggiorno/luci', 'manual');
        });
        this.bot.onText(/\/criteria/, (msg, match) => {
            console.log('criteria');

	        this.sendTo(msg.chat.id, '*Your notification criteria are:* ' + json.plain(this.getConversation(msg.chat.id).subscribedTo));
        });
/*
        this.bot.onText(/\/clear/, (msg, match) => {
            console.log('clear all criteria');
	        const convo = this.getConversation(msg.chat.id);
	        if ( convo ) {
	        	convo.subscribedTo = [];
	        	this.saveConversations();
	        	this.sendTo(msg.chat.id, 'Alright, mate, no more notifications');
	        }
        });
*/
        this.bot.onText(/\/clear (.*)/, (msg, match) => {
	        const obsProp = match[1];
            console.log('clear criteria about', obsProp);
	        const convo = this.getConversation(msg.chat.id);
	        if ( convo ) {
	        	for ( let i = convo.subscribedTo.length - 1; i >= 0; i-- ) {
	        		const subscription = convo.subscribedTo[i];
	        		if ( subscription && (obsProp === 'all' || subscription.observedProperty === obsProp) ) {
	        			console.log('removing', subscription);
	        			convo.subscribedTo.splice(i, 1);
			        }
		        }
	        	this.saveConversations();
		        console.log('cleared criteria about', obsProp);
		        this.sendTo(msg.chat.id, 'Alright, mate, you\'ve got these notifications left: ' + json.plain(convo.subscribedTo));
	        } else {
	        	console.log('chat', msg.chat.id, 'not found');
	        }
        });

	    this.bot.on('polling_error', (error) => {
		    console.log('polling error', error);  // => 'EFATAL'
	    });

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
    	console.log('saving conversations');
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
            this.bot.sendMessage(c.id, message, {parse_mode : "markdown"});
        }
    }

    sendTo(chat, message) {
        this.bot.sendMessage(chat, message, {parse_mode : "markdown"});
    }
}
