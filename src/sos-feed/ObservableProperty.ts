import Axios from 'axios';
import {Subject} from 'rxjs/Subject';

export class ObservableProperty {
	url: string;
	label: string;
	format = 'rdf';

	constructor(url: string) {
		if ( url.indexOf('opengis.net') >= 0 ) {
			url = 'http://defs.opengis.net/sissvoc/ogc-def/resource.json?uri=' + url;
			this.format = 'json';
		}
		this.url = url;
	}

	retrieveLabel() {
		const retVal = new Subject();

		Axios.get(this.url)
			.then( (res: any) => {
				// console.log('res', res.data);
				if ( this.format === 'json' ) {
					// console.log('json', JSON.stringify(res.result, null, 4));
					this.label = res.data.result.primaryTopic.definition;
				} else if ( this.format === 'rdf' ) {
					var xmldoc = require('xmldoc');

					var document = new xmldoc.XmlDocument(res.data);
					// console.log('doc 1', document.toString())
					// console.log('doc', JSON.stringify(document, null, 4));
					var prefLabel = document.valueWithPath('skos:Concept.skos:prefLabel');
					// console.log('doc', JSON.stringify(prefLabel, null, 4));
					// console.log('label', prefLabel);
					this.label = prefLabel;
				}
				retVal.next(this.label);
			})
		return retVal;
	}
}