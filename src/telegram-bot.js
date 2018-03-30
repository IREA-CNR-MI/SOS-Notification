"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TelegramBotApi = require("node-telegram-bot-api");
var fs = require("fs");
var token = '517522188:AAHqkW_VebuqgG_aWBIGyBianTfDyaQoFDs';
var TelegramBot = (function () {
    function TelegramBot() {
        var _this = this;
        this.bot = new TelegramBotApi(token, { polling: true });
        this.conversations = [];
        this.conversations = JSON.parse(fs.readFileSync('conversations.json').toString());
        console.log('TelegramBot', this.conversations);
        this.bot.onText(/\/subscribe/, function (msg) {
            console.log('subscribe', msg);
            _this.bot.sendMessage(msg.chat.id, "Welcome to " + msg.chat.id);
            var temp = Object.assign({}, msg.chat);
            temp.subscribedTo = [];
            _this.conversations.push(msg.chat);
            fs.writeFileSync('conversations.json', JSON.stringify(_this.conversations), 'utf8');
        });
        this.bot.onText(/\/unsubscribe/, function (msg) {
            console.log('unsubscribe', msg);
            _this.bot.sendMessage(msg.chat.id, "Goodbye " + msg.chat.id);
            _this.unsubscribe(msg.chat.id);
            fs.writeFileSync('conversations.json', JSON.stringify(_this.conversations), 'utf8');
        });
        this.bot.onText(/\/filter ([a-z]+) ([<>=]+) ([0-9]+)/, function (msg, match) {
            console.log('received filter', msg, match);
            var obsProp = match[1];
            var operator = match[2];
            var value = match[3];
            var convo = _this.getConversation(msg.chat.id);
            if (convo) {
                console.log('filtering on', msg.chat.id, obsProp, operator, value);
            }
        });
        this.bot.onText(/\/status/, function (msg, match) {
            console.log('status request');
            // client.publish('casa/soggiorno', 'status');
        });
        this.bot.onText(/\/manual/, function (msg, match) {
            console.log('status request');
            // client.publish('casa/soggiorno/luci', 'manual');
        });
        this.bot.onText(/\/auto/, function (msg, match) {
            console.log('status request');
            // client.publish('casa/soggiorno/luci', 'auto');
        });
        this.bot.onText(/\/training_on/, function (msg, match) {
            console.log('status request');
            // client.publish('casa', 'training');
        });
        this.bot.onText(/\/training_off/, function (msg, match) {
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
    TelegramBot.prototype.saveConversations = function () {
        fs.writeFileSync('conversations.json', JSON.stringify(this.conversations), 'utf8');
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
            this.bot.sendMessage(c.id, message, { parse_mode: "HTML" });
        }
    };
    TelegramBot.prototype.sendTo = function (chat, message) {
        this.bot.sendMessage(chat, message, { parse_mode: "HTML" });
    };
    return TelegramBot;
}());
exports.TelegramBot = TelegramBot;
//# sourceMappingURL=telegram-bot.js.map