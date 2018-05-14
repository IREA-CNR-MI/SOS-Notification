"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Subject_1 = require("rxjs/Subject");
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
exports.DBURL = 'mongodb://mongo:27017';
var StateManager = /** @class */ (function () {
    function StateManager() {
        var _this = this;
        this.states = [];
        this.getStates()
            .subscribe(function (res) {
            console.log('found states', res);
            _this.states = res;
        });
    }
    StateManager.prototype.updateState = function (source, property, value) {
        var state = this.find(source);
        if (!state) {
            state = { _id: source };
            this.states.push(state);
        }
        state.lastUpdated = new Date();
        state[property] = value;
        this.saveStates();
        console.log('state is now', this.states);
    };
    StateManager.prototype.find = function (id) {
        for (var _i = 0, _a = this.states; _i < _a.length; _i++) {
            var s = _a[_i];
            if (s._id === id) {
                return s;
            }
        }
    };
    StateManager.prototype.getStates = function () {
        var results = new Subject_1.Subject();
        MongoClient.connect(exports.DBURL, function (err, client) {
            if (err) {
                console.log('error connecting to mongo', err);
            }
            else {
                var db = client.db('sos-notification');
                db.collection('states').find({}).toArray(function (err, res) {
                    if (err) {
                        results.error(err);
                    }
                    else {
                        results.next(res);
                    }
                    client.close();
                });
            }
        });
        return results;
    };
    StateManager.prototype.saveStates = function () {
        var _this = this;
        console.log('saving state');
        MongoClient.connect(exports.DBURL, function (err, client) {
            if (err) {
                console.log('error connecting to mongo', err);
            }
            else {
                var db_1 = client.db('sos-notification');
                db_1.collection('states').deleteMany({})
                    .then(function (res) {
                    db_1.collection('states').insertMany(_this.states)
                        .then(function (res) {
                        client.close();
                    })
                        .catch(function (err) {
                        client.close();
                    });
                });
            }
        });
    };
    return StateManager;
}());
exports.StateManager = StateManager;
//# sourceMappingURL=state-manager.js.map