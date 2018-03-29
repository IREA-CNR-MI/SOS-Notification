"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mqtt_service_1 = require("./mqtt-service");
var isNumeric_1 = require("rxjs/util/isNumeric");
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
exports.DBURL = 'mongodb://mongo:27017';
var mqttService = new mqtt_service_1.MqttService();
mqttService.subscribe('#', function (topic, message) {
    console.log('logger received', topic, message);
    if (topic.substring(0, 'backup'.length) !== 'backup') {
        var splitTopic = topic.split('/');
        var system_1 = splitTopic[1];
        var parameter_1 = splitTopic[splitTopic.length - 1];
        var value_1 = isNumeric_1.isNumeric(message.toString()) ? parseFloat(message.toString()) : message.toString();
        MongoClient.connect(exports.DBURL, function (err, client) {
            if (err) {
                console.log('error connecting to mongo', err);
            }
            else {
                var db = client.db('sos-notification');
                db.collection('observations').insertOne({
                    timestamp: new Date(),
                    system: system_1,
                    parameter: parameter_1,
                    value: value_1,
                    receivedOn: {
                        topic: topic,
                        message: message
                    },
                    sentToSOS: false
                })
                    .then(function (res) {
                    client.close();
                })
                    .catch(function (err) {
                    client.close();
                });
            }
        });
        mqttService.publish('backup/' + system_1 + '/' + parameter_1, JSON.stringify({
            timestamp: new Date(),
            system: system_1,
            parameter: parameter_1,
            value: value_1,
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
//# sourceMappingURL=logger.js.map