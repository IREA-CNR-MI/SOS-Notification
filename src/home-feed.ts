import {ACTIVE_MQTT_CONFIGS, MqttService, RPi_CONFIG} from './mqtt-service';
import {TelegramBot} from './telegram-bot';

const mqttService = new MqttService(RPi_CONFIG);
const mqttIREAService = new MqttService();

mqttService.subscribe('domotica/60:01:94:5D:55:9A/sensors/#', (topic, message) => {
	console.log('home feed received', 'systems/casa-fabio/component/obsProp/' + topic.substring('domotica/60:01:94:5D:55:9A/sensors/'.length), message);
	mqttIREAService.publish('systems/casa-fabio/component/obsProp/' + topic.substring('domotica/60:01:94:5D:55:9A/sensors/'.length), message, {
		qos: 1,
		retain: true
	})
/*
	if ( topic.substring(0, 'backup'.length) !== 'backup' ) {
		mqttService.publish('backup/' + topic, message, {
			qos: 1,
			retain: true
		})
	}
*/
} )