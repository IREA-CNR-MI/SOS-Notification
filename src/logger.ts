import {MqttService} from './mqtt-service';
import {TelegramBot} from './telegram-bot';
import {isNumeric} from 'rxjs/util/isNumeric';

const mqttService = new MqttService();

mqttService.subscribe('#', (topic, message) => {
	console.log('logger received', topic, message);
	if ( topic.substring(0, 'backup'.length) !== 'backup' ) {
		const splitTopic = topic.split('/');
		const system = splitTopic[1];
		const parameter = splitTopic[splitTopic.length - 1];
		const value = isNumeric(message.toString()) ? parseFloat(message.toString()) : message.toString();

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