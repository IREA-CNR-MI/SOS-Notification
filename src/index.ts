import {MqttService} from './mqtt-service';
import {TelegramBot} from './telegram-bot';
import {StateManager} from './state-manager';

const mqttService = new MqttService();
export const stateManager = new StateManager();
const telegramBot = new TelegramBot();

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

export const DBURL = 'mongodb://mongo:27017';


export interface ISubscriptioin {
	observedProperty: string,
	filter: {
		operator: '>' | '>=' | '<' | '<=',
		value: number
	}
}

function addProperty(source: string, property: string) {
	console.log('saving property', source, property);
	// fs.writeFileSync('conversations.json', JSON.stringify(this.conversations), 'utf8');
	MongoClient.connect(DBURL, (err, client) => {
		if (err) {
			console.log('error connecting to mongo', err);
		} else {
			const db = client.db('sos-notification');
			db.collection('properties').insertMany([{
				_id: source + '_' + property,
				source: source,
				property: property
			}])
				.then(res => {
					client.close();
				})
				.catch(err => {
					//
					// console.log('error inserting property', err)
					client.close();
				})
		}
	});
}

const sources = [
	{
		label: 'ISMAR Venezia',
		regex: /^systems\/ismar-ve/
	},
/*
	{
		label: 'Casa Fabio',
		regex: /^systems\/casa-fabio/
	},
	{
		label: 'weewxAle',
		regex: /systems\/weewxAle/
	}
*/
]
mqttService.subscribe('#', (topic, message) => {
	let obsProp = null;
	let source = null;
	for (let s of sources) {
		if (topic.match(s.regex)) {
			const parts = topic.split('/');
			source = s.label;
			if (parts && parts.length > 0) {
				obsProp = parts[parts.length - 1];
				console.log(s.label, obsProp);
				addProperty(s.label, obsProp);
			}
		}
	}
/*
	    console.log('index received', topic, message);
		if (topic.indexOf('temperature') >= 0) {
			obsProp = 'temperature';
		} else if (topic.indexOf('humidity') >= 0) {
			obsProp = 'humidity'
		}
*/
		if ( obsProp ) {
			const value = parseFloat(message);

			stateManager.updateState(source, obsProp, value);
			telegramBot.state[obsProp] = value;
			console.log('setting', obsProp, value);
			const subscribed: any = telegramBot.getSubscribedTo(obsProp);
			for ( let c of subscribed ) {
				for ( let s of c.subscribedTo ) {
					console.log('subscribed', c.subscribedTo);
					let condition;
					switch ( s.filter.operator ) {
						case '>':
							condition = value > s.filter.value;
							break;
						case '>=':
							condition = value >= s.filter.value;
							break;
						case '<':
							condition = value < s.filter.value;
							break;
						case '<=':
							condition = value <= s.filter.value;
							break;
					}
					if ( condition ) {
						if ( !s.filter.triggered ) {
							telegramBot.sendTo(c.id, `${obsProp} ${s.filter.operator} ${s.filter.value} (current value: ${value})`);
							s.filter.triggered = true;
						}
					} else {
						s.filter.triggered = false;
					}
				}
				telegramBot.updateConversation(c);
			}
		}
})