import * as TelegramBotApi from 'node-telegram-bot-api';
import * as fs from 'fs';
import {Subject} from 'rxjs/Subject';

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

export const DBURL = 'mongodb://mongo:27017';

const token = '517522188:AAHqkW_VebuqgG_aWBIGyBianTfDyaQoFDs';
const json = require('format-json');
const options = {
	reply_markup: {
		inline_keyboard: [
			[
				{ text: 'Criteria', callback_data: 'criteria' },
				{ text: 'State', callback_data: 'state' },
			],
			[
				{ text: 'Clear temperature', callback_data: 'clear_temp' },
				{ text: 'Clear humidity', callback_data: 'clear_hum' },
				{ text: 'Clear all', callback_data: 'clearall' },
			]
/*
		],
		keyboard: [
			[
				'Criteria', '/criteria'
			],
			[
				'State', '/state'
			]
*/
		]
	}
};

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
    	this.getConversations()
		    .subscribe( (res: any) => {
		    	if ( res ) {
		    		this.conversations = res;
			    } else {
				    this.conversations = JSON.parse(fs.readFileSync('conversations.json').toString());
				    this.saveConversations();
			    }
			    console.log('TelegramBot', this.conversations);
		    })

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
			            triggered: false,
			            movingAverage: false
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
	        	this.clearParameter(convo, obsProp);
		        this.sendTo(msg.chat.id, 'Alright, mate, you\'ve got these notifications left: ' + json.plain(convo.subscribedTo));
	        } else {
	        	console.log('chat', msg.chat.id, 'not found');
	        }
        });

        this.bot.onText(/\/buttons/, (msg, match) => {
	        this.bot.sendMessage(msg.from.id, 'Press button or enter command', options);
        });

	    this.bot.on('callback_query', (callbackQuery) => {
		    const action = callbackQuery.data;
		    const msg = callbackQuery.message;
		    const opts = {
			    chat_id: msg.chat.id,
			    message_id: msg.message_id,
		    };
		    let text = 'Ok';

		    switch (action) {
			    case 'state':
				    this.sendTo(msg.chat.id, '*Current state:*' + json.plain(this.state));
					break;
			    case 'criteria':
				    this.sendTo(msg.chat.id, '*Your notification criteria are:* ' + json.plain(this.getConversation(msg.chat.id).subscribedTo));
					break;
			    case 'clear_temp':
			    	this.clearParameter(this.getConversation(msg.chat.id), 'temperature');
				    this.sendTo(msg.chat.id, '*Your notification criteria are:* ' + json.plain(this.getConversation(msg.chat.id).subscribedTo));
					break;
			    case 'clear_hum':
				    this.clearParameter(this.getConversation(msg.chat.id), 'humidity');
				    this.sendTo(msg.chat.id, '*Your notification criteria are:* `' + json.plain(this.getConversation(msg.chat.id).subscribedTo) + '`');
					break;
			    case 'clearall':
				    this.clearParameter(this.getConversation(msg.chat.id), 'all');
				    this.sendTo(msg.chat.id, '*Your notification criteria are:* ' + json.plain(this.getConversation(msg.chat.id).subscribedTo));
					break;

				    // text = 'Edited Text';
		    }

		    this.bot.editMessageText(text, opts);
		    this.bot.sendMessage(msg.chat.id, 'Press button or enter command', options);

	    });

	    this.bot.on('polling_error', (error) => {
		    console.log('polling error', error);  // => 'EFATAL'
	    });

    }

    clearParameter(convo, obsProp) {
	    for ( let i = convo.subscribedTo.length - 1; i >= 0; i-- ) {
		    const subscription = convo.subscribedTo[i];
		    if ( subscription && (obsProp === 'all' || subscription.observedProperty === obsProp) ) {
			    console.log('removing', subscription);
			    convo.subscribedTo.splice(i, 1);
		    }
	    }
	    this.saveConversations();
	    console.log('cleared criteria about', obsProp);
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

    getConversations() {
    	const results = new Subject();
	    MongoClient.connect(DBURL, (err, client) => {
		    if ( err ) {
			    console.log('error connecting to mongo', err);
		    } else {
			    const db = client.db('sos-notification');
			    db.collection('convos').find({
			    }, {}, res => {
				    	results.next(res);
					    client.close();
				    }, err => {
				    	results.error(err);
					    client.close();
				    })
		    }
	    });
	    return results;
    }
    saveConversations() {
    	console.log('saving conversations');
        // fs.writeFileSync('conversations.json', JSON.stringify(this.conversations), 'utf8');
	    for ( let c of this.conversations ) {
	    	c._id = c.id;
	    }
	    MongoClient.connect(DBURL, (err, client) => {
		    if ( err ) {
			    console.log('error connecting to mongo', err);
		    } else {
			    const db = client.db('sos-notification');
			    db.collection('convos').deleteMany({})
				    .then( res => {
					    db.collection('convos').insertMany(this.conversations)
						    .then( res => {
							    client.close();
						    })
						    .catch( err => {
							    client.close();
						    })
				    })
		    }
	    });
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
	    this.bot.sendMessage(chat, 'Press button or enter command', options);
    }
}
