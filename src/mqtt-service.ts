import * as mqtt from 'mqtt';

export interface IConfig {
	server: string,
	port: number,
	mqttOptions: {
		username?: string,
		password?: string
	}
}

export interface IMqttMessage {
	topic: string;
	message: any;
}

export const MOSCA_CONFIG: IConfig = {
	server: 'mqtt.get-it.it',
	port: 1883,
	mqttOptions: {
	}
}

export const RPi_CONFIG: IConfig = {
	server: '10.0.1.254',
	port: 1883,
	mqttOptions: {
	}
}

export const ACTIVE_MQTT_CONFIGS = [
	MOSCA_CONFIG,
	RPi_CONFIG
];

const config = MOSCA_CONFIG;

export class MqttService {
	client;
	config;

	constructor(config = MOSCA_CONFIG) {
		this.config = config;
		this.client = mqtt.connect(`mqtt://${config.server}:${config.port}`, config.mqttOptions)
		this.client.on('connect', () => {
			console.log('connected to MQTT on', config.server, config.port);
			this.client.publish('presence', 'test');
		});
//		this.client.subscribe('#');
		this.client.on('message', (topic, message) => {
			console.log('message received', topic, message.toString());
			// listener(topic, message.toString());
		});
	}

	subscribe(topic: string, listener: (topic, message) => void) {
		const client = mqtt.connect(`mqtt://${this.config.server}:${this.config.port}`, this.config.mqttOptions);
		client.subscribe(topic);
		client.on('message', (topic, message) => {
			// console.log('message received', topic, message.toString());
			listener(topic, message.toString());
		});
	}

	publish(topic: string, message: string, options = {}) {
		this.client.publish(topic, message, options);
	}
}