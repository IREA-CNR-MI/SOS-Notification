"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mqtt_service_1 = require("./mqtt-service");
var telegram_bot_1 = require("./telegram-bot");
var mqttService = new mqtt_service_1.MqttService();
var telegramBot = new telegram_bot_1.TelegramBot();
mqttService.subscribe('systems/+/component/obsProp/#', function (topic, message) {
    console.log('index received', topic, message);
    if (topic.indexOf('temperature') >= 0) {
        if (parseInt(message) >= 38) {
            telegramBot.send('temperature is now ' + message + ' - topic (' + topic + ')');
        }
    }
    else if (topic.indexOf('battery') >= 0) {
        if (parseInt(message) <= 4) {
            telegramBot.send('battery is now ' + message + ' - topic (' + topic + ')');
        }
    }
});
//# sourceMappingURL=index.js.map