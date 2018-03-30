"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mqtt = require("mqtt");
exports.MOSCA_CONFIG = {
    server: process.env.MQTT_SERVER || 'mqtt.get-it.it',
    port: 1883,
    mqttOptions: {}
};
exports.RPi_CONFIG = {
    server: '10.0.1.254',
    port: 1883,
    mqttOptions: {}
};
exports.ACTIVE_MQTT_CONFIGS = [
    exports.MOSCA_CONFIG,
    exports.RPi_CONFIG
];
var config = exports.MOSCA_CONFIG;
var MqttService = /** @class */ (function () {
    function MqttService(config) {
        if (config === void 0) { config = exports.MOSCA_CONFIG; }
        var _this = this;
        this.config = config;
        console.log('Attempting connection to', "mqtt://" + config.server + ":" + config.port);
        this.client = mqtt.connect("mqtt://" + config.server + ":" + config.port, config.mqttOptions);
        this.client.on('connect', function () {
            console.log('connected to MQTT on', config.server, config.port);
            _this.client.publish('presence', 'test');
        });
        //		this.client.subscribe('#');
        this.client.on('message', function (topic, message) {
            console.log('message received', topic, message.toString());
            // listener(topic, message.toString());
        });
    }
    MqttService.prototype.subscribe = function (topic, listener) {
        var client = mqtt.connect("mqtt://" + this.config.server + ":" + this.config.port, this.config.mqttOptions);
        client.subscribe(topic);
        client.on('message', function (topic, message) {
            // console.log('message received', topic, message.toString());
            listener(topic, message.toString());
        });
    };
    MqttService.prototype.publish = function (topic, message, options) {
        if (options === void 0) { options = {}; }
        this.client.publish(topic, message, options);
    };
    return MqttService;
}());
exports.MqttService = MqttService;
//# sourceMappingURL=mqtt-service.js.map