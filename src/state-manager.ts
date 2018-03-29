import {MqttService} from './mqtt-service';



export class StateManager {
	mqttService = new MqttService();

	constructor() {
		this.mqttService.subscribe('#', (topic, message) => {

		});
	}
}