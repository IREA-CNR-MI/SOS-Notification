import {MqttService} from './mqtt-service';
import {TelegramBot} from './telegram-bot';

const mqttService = new MqttService();
const telegramBot = new TelegramBot();

export interface ISubscriptioin {
    observedProperty: string,
    filter: {
        operator: '>' | '>=' | '<' | '<=',
        value: number
    }
}
mqttService.subscribe('systems/+/component/obsProp/#', (topic, message) => {
    console.log('index received', topic, message);
    if (topic.indexOf('temperature') >= 0) {
        const obsProp = 'Temperature';
        const value = parseInt(message);
        const subscribed: any = telegramBot.getSubscribedTo('temperature');
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
                        telegramBot.sendTo(c.id, `${obsProp} ${s.filter.operator} ${s.filter.value}`);
                        s.filter.triggered = true;
                    }
                } else {
                    s.filter.triggered = false;
                }
            }
            telegramBot.updateConversation(c);
        }

        if (parseInt(message) >= 38) {
            telegramBot.send('temperature is now ' + message + ' - topic (' + topic + ')');
        }
    } else if (topic.indexOf('humidity') >= 0) {
        if (parseInt(message) <= 4) {
            telegramBot.send('battery is now ' + message + ' - topic (' + topic + ')');
        }
    }
})