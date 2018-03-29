"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mqtt_service_1 = require("./mqtt-service");
var mqttService = new mqtt_service_1.MqttService(mqtt_service_1.RPi_CONFIG);
var mqttIREAService = new mqtt_service_1.MqttService();
mqttService.subscribe('domotica/60:01:94:5D:55:9A/sensors/#', function (topic, message) {
    console.log('home feed received', 'systems/casa-fabio/component/obsProp/' + topic.substring('domotica/60:01:94:5D:55:9A/sensors/'.length), message);
    mqttIREAService.publish('systems/casa-fabio/component/obsProp/' + topic.substring('domotica/60:01:94:5D:55:9A/sensors/'.length), message, {
        qos: 1,
        retain: true
    });
    /*
        if ( topic.substring(0, 'backup'.length) !== 'backup' ) {
            mqttService.publish('backup/' + topic, message, {
                qos: 1,
                retain: true
            })
        }
    */
});
