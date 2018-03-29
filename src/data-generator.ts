import {MqttService} from './mqtt-service';

const parameters = [
	{
		name: 'temperature',
		min: -10,
		max: 40
	},
	{
		name: 'batteryVoltage',
		min: 0,
		max: 12
	}
];

export class DataGenerator {
	mqttService = new MqttService();

	getRandomValueBetween(min: number, max: number) {
		return Math.random() * (max - min) + min;
	}
	constructor() {
		setInterval( () => {
			for ( let p of parameters ) {
				this.mqttService.publish('systems/PID01/components/sensors/' + p.name, '' + this.getRandomValueBetween(p.min, p.max));
			}
		}, 1000 /* * 60 * 60 * 12 */);
	}
}

const g = new DataGenerator();