import {readFileSync} from 'fs';
import {MqttService} from '../mqtt-service';

export class SOSFeed {
	sosUrl = 'http://sos:8080/observations/service';
	mqttService = new MqttService();
	// sensorML as a string, as it is in XML format
	sensorML: string;
	resultTemplates: any = {};

	constructor(baseTopic = 'backup/casa-fabio/') {
		this.sensorML = readFileSync(__dirname + '/../SOSRequests/SensorMLHome.xml', 'utf8');
		this.resultTemplates.temperature = JSON.parse(readFileSync(__dirname + '/../SOSRequests/InsertResult_home_temp.json', 'utf8'));
		this.resultTemplates.humidity = JSON.parse(readFileSync(__dirname + '/../SOSRequests/InsertResult_home_hum.json', 'utf8'));
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
						temp.value = '' + payload.timestamp + ',' + payload.value + '#';
						break;
					case 'humidity':
						temp = this.resultTemplates.humidity;
						temp.value = '' + payload.timestamp + ',' + payload.value + '#';
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

