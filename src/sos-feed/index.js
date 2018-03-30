"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var mqtt_service_1 = require("../mqtt-service");
var axios_1 = require("axios");
var Subject_1 = require("rxjs/Subject");
var SOSFeed = /** @class */ (function () {
    function SOSFeed(baseTopic) {
        if (baseTopic === void 0) { baseTopic = 'backup/casa-fabio/'; }
        this.sosUrl = process.env.SOS_URL || 'http://adminsos:password@sos52:8080/observations/service';
        this.testUrl = process.env.SOS_URL || 'http://adminsos:password@sos52:8080/observations/service';
        this.mqttService = new mqtt_service_1.MqttService();
        this.resultTemplates = {};
        this.procedure = 'http://www.get-it.it/sensors/www.get-it.it/procedure/noManufacturerDeclared/noModelDeclared/noSerialNumberDeclared/20180328052658273_28432';
        this.temperatureURI = 'http://vocabs.lter-europe.net/EnvThes/USLterCV_22';
        this.humidityURI = 'http://vocabs.lter-europe.net/EnvThes/EnvEu_114';
        this.sensorML = fs_1.readFileSync(__dirname + '/SOSRequests/SensorMLHome.xml', 'utf8');
        this.baseTopic = baseTopic;
        /*
                this.testInterval = setInterval( () => {
                    this.test();
                }, 1000);
        */
        this.init();
    }
    SOSFeed.prototype.test = function () {
        var _this = this;
        axios_1.default.get(this.testUrl)
            .then(function (res) {
            console.log('SOS attivo');
            clearInterval(_this.testInterval);
            _this.testInterval = null;
            _this.init();
        })
            .catch(function (err) {
            console.log('SOS error', err);
        });
    };
    SOSFeed.prototype.init = function () {
        var _this = this;
        console.log('Initialising');
        this.getCapabilities()
            .subscribe(function (capabilities) {
            _this.capabilities = capabilities;
            for (var _i = 0, _a = capabilities.contents; _i < _a.length; _i++) {
                var c = _a[_i];
                console.log('cap', c);
                for (var _b = 0, _c = c.procedure; _b < _c.length; _b++) {
                    var p = _c[_b];
                    if (p === _this.procedure) {
                        _this.offering = c.identifier;
                    }
                }
            }
            if (_this.offering) {
                _this.insertResultTemplates()
                    .subscribe(function (res) {
                    console.log('templates created', res.data);
                    _this.listen();
                }, function (err) {
                    console.log('error creating templates', err);
                });
            }
            else {
                _this.insertSensor();
            }
        }, function (err) {
            console.log('getCapabilities error', err);
        });
    };
    SOSFeed.prototype.listen = function () {
        var _this = this;
        this.resultTemplates.temperature = JSON.parse(fs_1.readFileSync(__dirname + '/SOSRequests/insertResult_home_temp.json', 'utf8'));
        this.resultTemplates.humidity = JSON.parse(fs_1.readFileSync(__dirname + '/SOSRequests/insertResult_home_hum.json', 'utf8'));
        this.mqttService.subscribe(this.baseTopic + '#', function (topic, message) {
            console.log('received', message);
            var shortTopic = topic.substring(_this.baseTopic.length);
            console.log('short topic', shortTopic);
            try {
                var payload = JSON.parse(message);
                console.log('payload', payload);
                var temp = void 0;
                switch (shortTopic) {
                    case 'temperature':
                        temp = _this.resultTemplates.temperature;
                        temp.resultValues = '' + payload.timestamp + ',' + payload.value + '#';
                        axios_1.default.post(_this.sosUrl, temp)
                            .then(function (res) {
                            console.log('insert results', res.data);
                        })
                            .catch(function (err) {
                            console.log('insert error', err);
                        });
                        break;
                    case 'humidity':
                        temp = _this.resultTemplates.humidity;
                        temp.resultValues = '' + payload.timestamp + ',' + payload.value + '#';
                        axios_1.default.post(_this.sosUrl, temp)
                            .then(function (res) {
                            console.log('insert results', res.data);
                        })
                            .catch(function (err) {
                            console.log('insert error', err);
                        });
                        break;
                }
                console.log('inserting', temp);
            }
            catch (e) {
                console.log('caught', e);
            }
        });
    };
    SOSFeed.prototype.getCapabilities = function () {
        var results = new Subject_1.Subject();
        var temp = {
            "request": "GetCapabilities",
            "service": "SOS",
            "sections": [
                /*
                                "ServiceIdentification",
                                "ServiceProvider",
                                "OperationsMetadata",
                                "FilterCapabilities",
                */
                "Contents"
            ]
        };
        axios_1.default.post(this.sosUrl, temp)
            .then(function (res) {
            // console.log('getCapabilities results', res.data);
            results.next(res.data);
        })
            .catch(function (err) {
            console.log('getCapabilities error', err);
            results.error(err);
        });
        return results;
    };
    SOSFeed.prototype.insertSensor = function () {
        var results = new Subject_1.Subject();
        var temp = this.sensorML;
        axios_1.default({
            url: this.sosUrl,
            method: 'post',
            headers: {
                'Content-Type': 'application/xml',
                'Accept': 'application/xml'
            },
            data: temp
        })
            .then(function (res) {
            console.log('insert sensor results', res.data);
            results.next(res.data);
        })
            .catch(function (err) {
            console.log('insert sensor error', err);
            results.error(err);
        });
        return results;
    };
    SOSFeed.prototype.insertResultTemplates = function () {
        var _this = this;
        var results = new Subject_1.Subject();
        axios_1.default.post(this.sosUrl, {
            "request": "GetResultTemplate",
            "service": "SOS",
            "version": "2.0.0",
            "offering": "offering:B5D7975C5DE8DAAE2972DA1E10B2D6D617F49740/observations",
            "observedProperty": "http://vocabs.lter-europe.net/EnvThes/USLterCV_22"
        })
            .then(function (res) {
            console.log('templates are already there');
            results.next(res);
        })
            .catch(function (err) {
            console.log('error with GetResultTemplate', err);
            _this.resultTemplates.temperature = JSON.parse(fs_1.readFileSync(__dirname + '/SOSRequests/insertResultTemplate_home_temp.json', 'utf8'));
            _this.resultTemplates.humidity = JSON.parse(fs_1.readFileSync(__dirname + '/SOSRequests/insertResultTemplate_home_hum.json', 'utf8'));
            console.log('temperature template', _this.resultTemplates.temperature);
            _this.resultTemplates.temperature.offering = _this.offering;
            _this.resultTemplates.temperature.observationTemplate.procedure = _this.procedure;
            _this.resultTemplates.temperature.observationTemplate.observedProperty = _this.temperatureURI;
            _this.resultTemplates.humidity.offering = _this.offering;
            _this.resultTemplates.humidity.observationTemplate.procedure = _this.procedure;
            _this.resultTemplates.humidity.observationTemplate.observedProperty = _this.humidityURI;
            axios_1.default.post(_this.sosUrl, _this.resultTemplates.temperature)
                .then(function (res1) {
                axios_1.default.post(_this.sosUrl, _this.resultTemplates.humidity)
                    .then(function (res2) {
                    results.next(res2);
                })
                    .catch(function (err) {
                    results.error(err);
                });
            })
                .catch(function (err) {
                results.error(err);
            });
        });
        return results;
    };
    return SOSFeed;
}());
exports.SOSFeed = SOSFeed;
var sosFeed = new SOSFeed();
//# sourceMappingURL=index.js.map