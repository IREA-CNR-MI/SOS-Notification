import {MqttService} from './mqtt-service';
import {TelegramBot} from './telegram-bot';

const telegramBot = new TelegramBot();
const mqttService = new MqttService();

export interface ISubscriptioin {
    observedProperty: string,
    filter: {
        operator: '>' | '>=' | '<' | '<=',
        value: number
    }
}
mqttService.subscribe('systems/+/component/obsProp/#', (topic, message) => {
    console.log('index received', topic, message);
    let obsProp = null;
    if (topic.indexOf('temperature') >= 0) {
        obsProp = 'temperature';
    } else if (topic.indexOf('humidity') >= 0) {
    	obsProp = 'humidity'
    }
    if ( obsProp ) {
	    const value = parseInt(message);
	    telegramBot.state[obsProp] = value;
	    console.log('setting', obsProp, value);
	    const subscribed: any = telegramBot.getSubscribedTo(obsProp);
	    for ( let c of subscribed ) {
		    for ( let s of c.subscribedTo ) {
			    console.log('subscribed', c.subscribedTo);
			    let condition;
			    switch ( s.filter.operator ) {
				    case '>':
					    condition = value > s.filter.value;
					    break;
				    case '>=':
					    condition = value >= s.filter.value;
					    break;
				    case '<':
					    condition = value < s.filter.value;
					    break;
				    case '<=':
					    condition = value <= s.filter.value;
					    break;
			    }
			    if ( condition ) {
				    if ( !s.filter.triggered ) {
					    telegramBot.sendTo(c.id, `${obsProp} ${s.filter.operator} ${s.filter.value} (current value: ${value})`);
					    s.filter.triggered = true;
				    }
			    } else {
				    s.filter.triggered = false;
			    }
		    }
		    telegramBot.updateConversation(c);
	    }
    }
})