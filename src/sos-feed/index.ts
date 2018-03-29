import {readFileSync} from 'fs';
import {MqttService} from '../mqtt-service';
import Axios from 'axios';
import {Subject} from 'rxjs/Subject';

export class SOSFeed {
	sosUrl = 'http://sos:8080/observations/service';
	mqttService = new MqttService();
	baseTopic;
	// sensorML as a string, as it is in XML format
	sensorML: string;
	resultTemplates: any = {};
	capabilities;
	procedure = 'http://www.get-it.it/sensors/www.get-it.it/procedure/noManufacturerDeclared/noModelDeclared/noSerialNumberDeclared/20180328052658273_28432';
	offering;
	temperatureURI = 'http://vocabs.lter-europe.net/EnvThes/USLterCV_22';
	humidityURI = 'http://vocabs.lter-europe.net/EnvThes/EnvEu_114';

	constructor(baseTopic = 'backup/casa-fabio/') {
		this.sensorML = readFileSync(__dirname + '/SOSRequests/SensorMLHome.xml', 'utf8');
		this.baseTopic = baseTopic;

		this.getCapabilities()
			.subscribe( (capabilities: any) => {
				this.capabilities = capabilities;

				for ( let c of capabilities.contents ) {
					console.log('cap', c);
					for ( let p of c.procedure ) {
						if ( p === this.procedure ) {
							this.offering = c.identifier;
						}
					}
				}

				if ( this.offering ) {
					this.insertResultTemplates()
						.subscribe( (res: any) => {
							console.log('templates created', res.data);
							this.listen();
						},
							err => {
							console.log('error creating templates', err);
							})
				}
		})
/*
		this.insertSensor()
			.subscribe( res => {
				console.log('insertSensor results', res);
				this.getCapabilities()
					.subscribe( (capabilities: any) => {
						console.log('offering', capabilities.contents[0]);
					})
			})
*/


	}

	listen() {
		this.resultTemplates.temperature = JSON.parse(readFileSync(__dirname + '/SOSRequests/insertResult_home_temp.json', 'utf8'));
		this.resultTemplates.humidity = JSON.parse(readFileSync(__dirname + '/SOSRequests/insertResult_home_hum.json', 'utf8'));

		this.mqttService.subscribe(this.baseTopic + '#', (topic, message) => {
			console.log('received', message);
			const shortTopic = topic.substring(this.baseTopic.length);
			console.log('short topic', shortTopic);
			try {
				const payload = JSON.parse(message);
				console.log('payload', payload);

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
	getCapabilities() {
		const results = new Subject();
		const temp = {
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

		Axios.post(this.sosUrl, temp)
			.then( res => {
				// console.log('getCapabilities results', res.data);
				results.next(res.data);
			})
			.catch( err => {
				console.log('getCapabilities error', err);
				results.error(err);
			})
		return results;
	}

	insertSensor() {
		const results = new Subject();
		const temp = this.sensorML;
		Axios({
			url: this.sosUrl,
			method: 'post',
			headers: {
				'Content-Type': 'application/xml',
				'Accept': 'application/xml'
			},
			data: temp
		})
			.then( res => {
				console.log('insert sensor results', res.data);
				results.next(res.data);
			})
			.catch( err => {
				console.log('insert sensor error', err);
				results.error(err);
			})
		return results;
	}

	insertResultTemplates() {
		const results = new Subject();

		Axios.post(this.sosUrl, {
			"request": "GetResultTemplate",
			"service": "SOS",
			"version": "2.0.0",
			"offering": "offering:B5D7975C5DE8DAAE2972DA1E10B2D6D617F49740/observations",
			"observedProperty": "http://vocabs.lter-europe.net/EnvThes/USLterCV_22"
		})
			.then( res => {
				console.log('templates are already there');
				results.next(res);
			})
			.catch( err => {
				console.log('error with GetResultTemplate', err);

				this.resultTemplates.temperature = JSON.parse(readFileSync(__dirname + '/SOSRequests/InsertResultTemplate_home_temp.json', 'utf8'));
				this.resultTemplates.humidity = JSON.parse(readFileSync(__dirname + '/SOSRequests/InsertResultTemplate_home_hum.json', 'utf8'));

				console.log('temperature template', this.resultTemplates.temperature);
				this.resultTemplates.temperature.offering = this.offering;
				this.resultTemplates.temperature.observationTemplate.procedure = this.procedure;
				this.resultTemplates.temperature.observationTemplate.observedProperty = this.temperatureURI;

				this.resultTemplates.humidity.offering = this.offering;
				this.resultTemplates.humidity.observationTemplate.procedure = this.procedure;
				this.resultTemplates.humidity.observationTemplate.observedProperty = this.humidityURI;

				Axios.post(this.sosUrl, this.resultTemplates.temperature)
					.then( res1 => {
						Axios.post(this.sosUrl, this.resultTemplates.humidity)
							.then( res2 => {
								results.next(res2)
							})
							.catch( err => {
								results.error(err);
							})
					})
					.catch( err => {
						results.error(err);
					})
			})

		return results;
	}
}

const sosFeed = new SOSFeed();

