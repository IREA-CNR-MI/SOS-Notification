import {MqttService} from './mqtt-service';
import {TelegramBot} from './telegram-bot';

const mqttService = new MqttService();
const telegramBot = new TelegramBot();

mqttService.subscribe('systems/+/component/obsProp/#', (topic, message) => {
	console.log('index received', topic, message);
	if ( topic.indexOf('temperature') >= 0 ) {
		if ( parseInt(message) >= 38 ) {
			telegramBot.send('temperature is now ' + message + ' - topic (' + topic + ')');
		}
	} else if ( topic.indexOf('battery') >= 0 ) {
		if ( parseInt(message) <= 4 ) {
			telegramBot.send('battery is now ' + message + ' - topic (' + topic + ')');
		}
	}
} )