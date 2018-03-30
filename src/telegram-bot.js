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
            _this.conversations.push(msg.chat);
            fs.writeFileSync('conversations.json', JSON.stringify(_this.conversations), 'utf8');
        });
        this.bot.onText(/\/unsubscribe/, function (msg) {
            console.log('unsubscribe', msg);
            _this.bot.sendMessage(msg.chat.id, "Goodbye " + msg.chat.id);
            _this.unsubscribe(msg.chat.id);
            fs.writeFileSync('conversations.json', JSON.stringify(_this.conversations), 'utf8');
        });
        this.bot.onText(/\/luci_(.+)/, function (msg, match) {
            console.log('received luci', msg, match);
            var resp = match[1];
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
    return TelegramBot;
}());
exports.TelegramBot = TelegramBot;
//# sourceMappingURL=telegram-bot.js.map