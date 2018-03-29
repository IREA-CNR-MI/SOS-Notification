"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var mqtt_service_1 = require("../mqtt-service");
var SOSFeed = /** @class */ (function () {
    function SOSFeed(baseTopic) {
        if (baseTopic === void 0) { baseTopic = 'backup/casa-fabio/'; }
        var _this = this;
        this.sosUrl = 'http://sos:8080/observations/service';
        this.mqttService = new mqtt_service_1.MqttService();
        this.resultTemplates = {};
        this.sensorML = fs_1.readFileSync(__dirname + '/../SOSRequests/SensorMLHome.xml', 'utf8');
        this.resultTemplates.temperature = JSON.parse(fs_1.readFileSync(__dirname + '/../SOSRequests/InsertResult_home_temp.json', 'utf8'));
        this.resultTemplates.humidity = JSON.parse(fs_1.readFileSync(__dirname + '/../SOSRequests/InsertResult_home_hum.json', 'utf8'));
        this.mqttService.subscribe(baseTopic + '#', function (topic, message) {
            console.log('received', message);
            var shortTopic = topic.substring(baseTopic.length);
            console.log('short topic', shortTopic);
            try {
                var payload = JSON.parse(message);
                var temp = void 0;
                switch (shortTopic) {
                    case 'temperature':
                        temp = _this.resultTemplates.temperature;
                        temp.value = '' + payload.timestamp + ',' + payload.value + '#';
                        break;
                    case 'humidity':
                        temp = _this.resultTemplates.humidity;
                        temp.value = '' + payload.timestamp + ',' + payload.value + '#';
                        break;
                }
                console.log('inserting', temp);
            }
            catch (e) {
                console.log('caught', e);
            }
        });
    }
    return SOSFeed;
}());
exports.SOSFeed = SOSFeed;
var sosFeed = new SOSFeed();
