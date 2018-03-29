"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mqtt_service_1 = require("./mqtt-service");
var parameters = [
    {
        name: 'temperature',
        min: -10,
        max: 40
    },
    {
        name: 'batteryVoltage',
        min: 0,
        max: 12
    }
];
var DataGenerator = /** @class */ (function () {
    function DataGenerator() {
        var _this = this;
        this.mqttService = new mqtt_service_1.MqttService();
        setInterval(function () {
            for (var _i = 0, parameters_1 = parameters; _i < parameters_1.length; _i++) {
                var p = parameters_1[_i];
                _this.mqttService.publish('systems/PID01/components/sensors/' + p.name, '' + _this.getRandomValueBetween(p.min, p.max));
            }
        }, 1000 /* * 60 * 60 * 12 */);
    }
    DataGenerator.prototype.getRandomValueBetween = function (min, max) {
        return Math.random() * (max - min) + min;
    };
    return DataGenerator;
}());
exports.DataGenerator = DataGenerator;
var g = new DataGenerator();
