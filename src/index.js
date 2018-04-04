"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mqtt_service_1 = require("./mqtt-service");
var telegram_bot_1 = require("./telegram-bot");
var telegramBot = new telegram_bot_1.TelegramBot();
var mqttService = new mqtt_service_1.MqttService();
mqttService.subscribe('systems/+/component/obsProp/#', function (topic, message) {
    console.log('index received', topic, message);
    var obsProp = null;
    if (topic.indexOf('temperature') >= 0) {
        obsProp = 'temperature';
    }
    else if (topic.indexOf('humidity') >= 0) {
        obsProp = 'humidity';
    }
    if (obsProp) {
        var value = parseInt(message);
        telegramBot.state[obsProp] = value;
        console.log('setting', obsProp, value);
        var subscribed = telegramBot.getSubscribedTo(obsProp);
        for (var _i = 0, subscribed_1 = subscribed; _i < subscribed_1.length; _i++) {
            var c = subscribed_1[_i];
            for (var _a = 0, _b = c.subscribedTo; _a < _b.length; _a++) {
                var s = _b[_a];
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
                        telegramBot.sendTo(c.id, obsProp + " " + s.filter.operator + " " + s.filter.value);
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