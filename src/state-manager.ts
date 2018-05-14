import {MqttService} from './mqtt-service';
import {Subject} from 'rxjs/Subject';

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

export const DBURL = 'mongodb://mongo:27017';

export class StateManager {
	states = [];

	constructor() {
		this.getStates()
			.subscribe( (res: any) => {
				console.log('found states', res);
				this.states = res;
			})
	}

	updateState(source: string, property: string, value: any) {
		let state = this.find(source);
		if ( !state ) {
			state = { _id: source};
			this.states.push(state);
		}
		state.lastUpdated = new Date();
		state[property] = value;
		this.saveStates();
		console.log('state is now', this.states);
	}

	find(id: string) {
		for ( let s of this.states ) {
			if ( s._id === id ) {
				return s;
			}
		}
	}

	getStates() {
		const results = new Subject();
		MongoClient.connect(DBURL, (err, client) => {
			if (err) {
				console.log('error connecting to mongo', err);
			} else {
				const db = client.db('sos-notification');
				db.collection('states').find({}).toArray((err, res) => {
					if (err) {
						results.error(err);
					} else {
						results.next(res);
					}
					client.close();
				});
			}
		});
		return results;
	}

	saveStates() {
		console.log('saving state');
		MongoClient.connect(DBURL, (err, client) => {
			if (err) {
				console.log('error connecting to mongo', err);
			} else {
				const db = client.db('sos-notification');
				db.collection('states').deleteMany({})
					.then(res => {
						db.collection('states').insertMany(this.states)
							.then(res => {
								client.close();
							})
							.catch(err => {
								client.close();
							})
					})
			}
		});

	}
}

