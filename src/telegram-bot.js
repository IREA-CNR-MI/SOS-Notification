"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TelegramBotApi = require("node-telegram-bot-api");
var fs = require("fs");
var Subject_1 = require("rxjs/Subject");
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
exports.DBURL = 'mongodb://mongo:27017';
var token = '517522188:AAHqkW_VebuqgG_aWBIGyBianTfDyaQoFDs';
var json = require('format-json');
var options = {
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
var TelegramBot = /** @class */ (function () {
    function TelegramBot() {
        var _this = this;
        this.bot = new TelegramBotApi(token, { polling: true });
        this.conversations = [];
        this.availableProperties = [
            'temperature',
            'humidity'
        ];
        this.state = {
            humidity: -1,
            temperature: -1
        };
        this.getConversations()
            .subscribe(function (res) {
            if (res) {
                _this.conversations = res;
            }
            else {
                _this.conversations = JSON.parse(fs.readFileSync('conversations.json').toString());
                _this.saveConversations();
            }
            console.log('TelegramBot', _this.conversations);
        });
        this.bot.onText(/\/start/, function (msg) {
            console.log('subscribe', msg);
            _this.bot.sendMessage(msg.chat.id, "Welcome to " + msg.chat.id);
            var temp = Object.assign({}, msg.chat);
            temp.subscribedTo = [];
            _this.conversations.push(msg.chat);
            fs.writeFileSync('conversations.json', JSON.stringify(_this.conversations), 'utf8');
        });
        this.bot.onText(/\/notify ([a-z]+) ([<>=]+) ([0-9]+)/, function (msg, match) {
            console.log('received filter', msg, match);
            var obsProp = match[1];
            var operator = match[2];
            var value = match[3];
            var convo = _this.getConversation(msg.chat.id);
            if (convo) {
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
                _this.saveConversations();
                console.log('filtering on', msg.chat.id, obsProp, operator, value);
                _this.sendTo(msg.chat.id, 'Alright, mate, I\'ll notify you when ' + obsProp + ' ' + operator + ' ' + value);
            }
        });
        this.bot.onText(/\/state/, function (msg, match) {
            console.log('status request');
            _this.sendTo(msg.chat.id, '*Current state:*' + json.plain(_this.state));
        });
        this.bot.onText(/\/properties/, function (msg, match) {
            console.log('properties');
            _this.sendTo(msg.chat.id, '*Available properties:*' + json.plain(_this.availableProperties));
            // client.publish('casa/soggiorno/luci', 'manual');
        });
        this.bot.onText(/\/criteria/, function (msg, match) {
            console.log('criteria');
            _this.sendTo(msg.chat.id, '*Your notification criteria are:* ' + json.plain(_this.getConversation(msg.chat.id).subscribedTo));
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
        this.bot.onText(/\/clear (.*)/, function (msg, match) {
            var obsProp = match[1];
            console.log('clear criteria about', obsProp);
            var convo = _this.getConversation(msg.chat.id);
            if (convo) {
                _this.clearParameter(convo, obsProp);
                _this.sendTo(msg.chat.id, 'Alright, mate, you\'ve got these notifications left: ' + json.plain(convo.subscribedTo));
            }
            else {
                console.log('chat', msg.chat.id, 'not found');
            }
        });
        this.bot.onText(/\/buttons/, function (msg, match) {
            _this.bot.sendMessage(msg.from.id, 'Press button or enter command', options);
        });
        this.bot.on('callback_query', function (callbackQuery) {
            var action = callbackQuery.data;
            var msg = callbackQuery.message;
            var opts = {
                chat_id: msg.chat.id,
                message_id: msg.message_id,
            };
            var text = 'Ok';
            switch (action) {
                case 'state':
                    _this.sendTo(msg.chat.id, '*Current state:*' + json.plain(_this.state));
                    break;
                case 'criteria':
                    _this.sendTo(msg.chat.id, '*Your notification criteria are:* ' + json.plain(_this.getConversation(msg.chat.id).subscribedTo));
                    break;
                case 'clear_temp':
                    _this.clearParameter(_this.getConversation(msg.chat.id), 'temperature');
                    _this.sendTo(msg.chat.id, '*Your notification criteria are:* ' + json.plain(_this.getConversation(msg.chat.id).subscribedTo));
                    break;
                case 'clear_hum':
                    _this.clearParameter(_this.getConversation(msg.chat.id), 'humidity');
                    _this.sendTo(msg.chat.id, '*Your notification criteria are:* `' + json.plain(_this.getConversation(msg.chat.id).subscribedTo) + '`');
                    break;
                case 'clearall':
                    _this.clearParameter(_this.getConversation(msg.chat.id), 'all');
                    _this.sendTo(msg.chat.id, '*Your notification criteria are:* ' + json.plain(_this.getConversation(msg.chat.id).subscribedTo));
                    break;
            }
            _this.bot.editMessageText(text, opts);
            _this.bot.sendMessage(msg.chat.id, 'Press button or enter command', options);
        });
        this.bot.on('polling_error', function (error) {
            console.log('polling error', error); // => 'EFATAL'
        });
    }
    TelegramBot.prototype.clearParameter = function (convo, obsProp) {
        for (var i = convo.subscribedTo.length - 1; i >= 0; i--) {
            var subscription = convo.subscribedTo[i];
            if (subscription && (obsProp === 'all' || subscription.observedProperty === obsProp)) {
                console.log('removing', subscription);
                convo.subscribedTo.splice(i, 1);
            }
        }
        this.saveConversations();
        console.log('cleared criteria about', obsProp);
    };
    TelegramBot.prototype.getSubscribedTo = function (topic) {
        var temp = [];
        for (var _i = 0, _a = this.conversations; _i < _a.length; _i++) {
            var c = _a[_i];
            for (var _b = 0, _c = c.subscribedTo; _b < _c.length; _b++) {
                var s = _c[_b];
                if (s.observedProperty === topic) {
                    if (temp.indexOf(c) < 0) {
                        temp.push(c);
                    }
                }
            }
        }
        return temp;
    };
    TelegramBot.prototype.getConversations = function () {
        var results = new Subject_1.Subject();
        MongoClient.connect(exports.DBURL, function (err, client) {
            if (err) {
                console.log('error connecting to mongo', err);
            }
            else {
                var db = client.db('sos-notification');
                db.collection('convos').find({}, {}, function (res) {
                    results.next(res);
                    client.close();
                }, function (err) {
                    results.error(err);
                    client.close();
                });
            }
        });
        return results;
    };
    TelegramBot.prototype.saveConversations = function () {
        var _this = this;
        console.log('saving conversations');
        // fs.writeFileSync('conversations.json', JSON.stringify(this.conversations), 'utf8');
        MongoClient.connect(exports.DBURL, function (err, client) {
            if (err) {
                console.log('error connecting to mongo', err);
            }
            else {
                var db = client.db('sos-notification');
                db.collection('convos').insertMany(_this.conversations)
                    .then(function (res) {
                    client.close();
                })
                    .catch(function (err) {
                    client.close();
                });
            }
        });
    };
    TelegramBot.prototype.getConversation = function (id) {
        for (var _i = 0, _a = this.conversations; _i < _a.length; _i++) {
            var c = _a[_i];
            if (c.id === id) {
                return c;
            }
        }
    };
    TelegramBot.prototype.updateConversation = function (conversation) {
        for (var _i = 0, _a = this.conversations; _i < _a.length; _i++) {
            var c = _a[_i];
            if (c.id === conversation.id) {
                c.subscribedTo = conversation.subscribedTo;
            }
        }
        this.saveConversations();
    };
    TelegramBot.prototype.unsubscribe = function (id) {
        for (var i = 0; i < this.conversations.length; i++) {
            var c = this.conversations[i];
            if (c.id === id) {
                this.conversations.splice(i, 1);
            }
        }
    };
    TelegramBot.prototype.send = function (message) {
        for (var _i = 0, _a = this.conversations; _i < _a.length; _i++) {
            var c = _a[_i];
            // console.log('send', c);
            this.bot.sendMessage(c.id, message, { parse_mode: "markdown" });
        }
    };
    TelegramBot.prototype.sendTo = function (chat, message) {
        this.bot.sendMessage(chat, message, { parse_mode: "markdown" });
        this.bot.sendMessage(chat, 'Press button or enter command', options);
    };
    return TelegramBot;
}());
exports.TelegramBot = TelegramBot;
//# sourceMappingURL=telegram-bot.js.map