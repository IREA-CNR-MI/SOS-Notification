"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mqtt_service_1 = require("./mqtt-service");
var StateManager = /** @class */ (function () {
    function StateManager() {
        this.mqttService = new mqtt_service_1.MqttService();
        this.mqttService.subscribe('#', function (topic, message) {
        });
    }
    return StateManager;
}());
exports.StateManager = StateManager;
//# sourceMappingURL=state-manager.js.map