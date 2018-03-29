import {readFileSync} from 'fs';
import {MqttService} from '../mqtt-service';
import Axios from 'axios';

export class SOSFeed {
	sosUrl = 'http://sos:8080/observations/service';
	mqttService = new MqttService();
	// sensorML as a string, as it is in XML format
	sensorML: string;
	resultTemplates: any = {};

	constructor(baseTopic = 'backup/casa-fabio/') {
		this.sensorML = readFileSync(__dirname + '/SOSRequests/SensorMLHome.xml', 'utf8');
		this.resultTemplates.temperature = JSON.parse(readFileSync(__dirname + '/SOSRequests/insertResult_home_temp.json', 'utf8'));
		this.resultTemplates.humidity = JSON.parse(readFileSync(__dirname + '/SOSRequests/insertResult_home_hum.json', 'utf8'));
		this.mqttService.subscribe(baseTopic + '#', (topic, message) => {
			console.log('received', message);
			const shortTopic = topic.substring(baseTopic.length);
			console.log('short topic', shortTopic);
			try {
				const payload = JSON.parse(message);

				let temp;
				switch (shortTopic) {
					case 'temperature':
						temp = this.resultTemplates.temperature;
						temp.resultValues = '' + payload.timestamp + ',' + payload.value + '#';

						Axios.post(this.sosUrl, temp)
							.then( res => {
								console.log('insert results', res.data);
							})
							.catch( err => {
								console.log('insert error', err);
							})
						break;
					case 'humidity':
						temp = this.resultTemplates.humidity;
						temp.resultValues = '' + payload.timestamp + ',' + payload.value + '#';
						Axios.post(this.sosUrl, temp)
							.then( res => {
								console.log('insert results', res.data);
							})
							.catch( err => {
								console.log('insert error', err);
							})
						break;
				}

				console.log('inserting', temp);
			} catch (e) {
				console.log('caught', e);
			}
		});

	}

}

const sosFeed = new SOSFeed();

