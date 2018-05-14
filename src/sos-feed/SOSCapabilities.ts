import Axios from 'axios';
import {Subject} from 'rxjs/Subject';

export class SOSCapabilities {
	url: string;
	capabilities;

	constructor(url: string) {
		this.url = url;
		this.getCapabilities()
			.subscribe( res => {
				this.capabilities = res;
				console.log('capabilities', JSON.stringify(this.capabilities, null, 4));
			})
	}

	getCapabilities() {
		const results = new Subject();
		const temp = {
			'request': 'GetCapabilities',
			'service': 'SOS',
			'sections': [
				/*
								"ServiceIdentification",
								"ServiceProvider",
								"OperationsMetadata",
								"FilterCapabilities",
				*/
				'Contents'
			]
		};

		Axios.post(this.url, temp)
			.then(res => {
				// console.log('getCapabilities results', res.data);
				results.next(res.data);
			})
			.catch(err => {
				console.log('getCapabilities error', err);
				results.error(err);
			})
		return results;
	}


}