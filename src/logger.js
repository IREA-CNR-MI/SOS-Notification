"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mqtt_service_1 = require("./mqtt-service");
var isNumeric_1 = require("rxjs/util/isNumeric");
var mqttService = new mqtt_service_1.MqttService();
mqttService.subscribe('#', function (topic, message) {
    console.log('logger received', topic, message);
    if (topic.substring(0, 'backup'.length) !== 'backup') {
        var splitTopic = topic.split('/');
        var system = splitTopic[1];
        var parameter = splitTopic[splitTopic.length - 1];
        var value = isNumeric_1.isNumeric(message.toString()) ? parseFloat(message.toString()) : message.toString();
        mqttService.publish('backup/' + system + '/' + parameter, JSON.stringify({
            timestamp: new Date(),
            system: system,
            parameter: parameter,
            value: value,
            receivedOn: {
                topic: topic,
                message: message
            }
        }), {
            qos: 1,
            retain: true
        });
    }
});
