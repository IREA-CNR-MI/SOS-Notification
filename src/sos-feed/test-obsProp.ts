import Axios from 'axios';
import {ObservableProperty} from './ObservableProperty';
import {SOSCapabilities} from './SOSCapabilities';


export class TestObsProp {
	capabilities: any;
	obsProperties = [];

	constructor() {
		this.capabilities = new SOSCapabilities('http://mqtt.get-it.it/52n-sos-webapp/service');

		/*
				this.obsProp = new ObservableProperty('http://www.opengis.net/def/property/OGC/0/PhenomenonTime');
				this.obsProp
					.retrieveLabel()
					.subscribe(res => {
						console.log('observable property', this.obsProp);
					})
		*/

		this.capabilities.getCapabilities()
			.subscribe(res => {
					this.obsProperties = [];
					const offerings = res.contents;
					for (let offering of offerings) {
						for (let o of offering.observableProperty) {
							let obsProp = new ObservableProperty(o);
							obsProp
								.retrieveLabel()
								.subscribe(res => {
									// console.log('observable property', this.obsProp);
									this.obsProperties.push(obsProp);
								})
						}
					}
				},
				err => {
					console.log('error', err);
				})
		setTimeout( () => {
			console.log('obsProperties', JSON.stringify(this.obsProperties, null, 4));
		}, 1000 * 3);
	}
}

const test = new TestObsProp();