import {MqttService} from './mqtt-service';
import {TelegramBot} from './telegram-bot';
import {isNumeric} from 'rxjs/util/isNumeric';
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

export const DBURL = 'mongodb://mongo:27017';

const mqttService = new MqttService();

mqttService.subscribe('#', (topic, message) => {
	console.log('logger received', topic, message);
	if ( topic.substring(0, 'backup'.length) !== 'backup' ) {
		const splitTopic = topic.split('/');
		const system = splitTopic[1];
		const parameter = splitTopic[splitTopic.length - 1];
		const value = isNumeric(message.toString()) ? parseFloat(message.toString()) : message.toString();

		MongoClient.connect(DBURL, (err, client) => {
			if ( err ) {
				console.log('error connecting to mongo', err);
			} else {
				const db = client.db('sos-notification');
				db.collection('observations').insertOne({
					timestamp: new Date(),
					system: system,
					parameter: parameter,
					value: value,
					receivedOn: {
						topic: topic,
						message: message
					},
					sentToSOS: false
				})
			}
		});

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
		})
	}
} )