"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mqtt_service_1 = require("./mqtt-service");
var telegram_bot_1 = require("./telegram-bot");
var state_manager_1 = require("./state-manager");
var mqttService = new mqtt_service_1.MqttService();
exports.stateManager = new state_manager_1.StateManager();
var telegramBot = new telegram_bot_1.TelegramBot();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
exports.DBURL = 'mongodb://mongo:27017';
function addProperty(source, property) {
    console.log('saving property', source, property);
    // fs.writeFileSync('conversations.json', JSON.stringify(this.conversations), 'utf8');
    MongoClient.connect(exports.DBURL, function (err, client) {
        if (err) {
            console.log('error connecting to mongo', err);
        }
        else {
            var db = client.db('sos-notification');
            db.collection('properties').insertMany([{
                    _id: source + '_' + property,
                    source: source,
                    property: property
                }])
                .then(function (res) {
                client.close();
            })
                .catch(function (err) {
                //
                // console.log('error inserting property', err)
                client.close();
            });
        }
    });
}
var sources = [
    {
        label: 'ISMAR Venezia',
        regex: /^systems\/ismar-ve/
    },
];
mqttService.subscribe('#', function (topic, message) {
    var obsProp = null;
    var source = null;
    for (var _i = 0, sources_1 = sources; _i < sources_1.length; _i++) {
        var s = sources_1[_i];
        if (topic.match(s.regex)) {
            var parts = topic.split('/');
            source = s.label;
            if (parts && parts.length > 0) {
                obsProp = parts[parts.length - 1];
                console.log(s.label, obsProp);
                addProperty(s.label, obsProp);
            }
        }
    }
    /*
            console.log('index received', topic, message);
            if (topic.indexOf('temperature') >= 0) {
                obsProp = 'temperature';
            } else if (topic.indexOf('humidity') >= 0) {
                obsProp = 'humidity'
            }
    */
    if (obsProp) {
        var value = parseFloat(message);
        exports.stateManager.updateState(source, obsProp, value);
        telegramBot.state[obsProp] = value;
        console.log('setting', obsProp, value);
        var subscribed = telegramBot.getSubscribedTo(obsProp);
        for (var _a = 0, subscribed_1 = subscribed; _a < subscribed_1.length; _a++) {
            var c = subscribed_1[_a];
            for (var _b = 0, _c = c.subscribedTo; _b < _c.length; _b++) {
                var s = _c[_b];
                console.log('subscribed', c.subscribedTo);
                var condition = void 0;
                switch (s.filter.operator) {
                    case '>':
                        condition = value > s.filter.value;
                        break;
                    case '>=':
                        condition = value >= s.filter.value;
                        break;
                    case '<':
                        condition = value < s.filter.value;
                        break;
                    case '<=':
                        condition = value <= s.filter.value;
                        break;
                }
                if (condition) {
                    if (!s.filter.triggered) {
                        telegramBot.sendTo(c.id, obsProp + " " + s.filter.operator + " " + s.filter.value + " (current value: " + value + ")");
                        s.filter.triggered = true;
                    }
                }
                else {
                    s.filter.triggered = false;
                }
            }
            telegramBot.updateConversation(c);
        }
    }
});
//# sourceMappingURL=index.js.map