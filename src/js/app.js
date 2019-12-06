import loadJson from '../components/load-json/'
import { Relocator } from './modules/relocator'
import { Toolbelt } from './modules/toolbelt'
import { Preflight } from './modules/preflight'
import settings from './data/settings.json'


var app = {

	init: () => {

		var toolbelt = new Toolbelt()

		var key = ( toolbelt.getURLParams('key')!=null) ? toolbelt.getURLParams('key') : "1W6Y3nd7AbfbfPLyqcuHuF-odvoLVuYK92X9BXqXq01Q" ;

		loadJson(`https://interactive.guim.co.uk/docsdata/${key}.json`)
			.then((data) => {

				var wrangle = new Preflight(data.sheets.Sheet1, key, settings)

				wrangle.process().then( (application) => {

					new Relocator(application)

				})
				
			})


	}
}

app.init()