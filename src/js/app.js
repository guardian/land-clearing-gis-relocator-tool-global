import loadJson from '../components/load-json/'
import { Relocator } from './modules/relocator'
import { Toolbelt } from './modules/toolbelt'
import { Preflight } from './modules/preflight'
import settings from './data/settings.json'


var app = {

	preload: (key) => {

		loadJson(`https://interactive.guim.co.uk/docsdata/1T49ad9W3eOMdRaWZE8eAiPMYbp5mT7BcwxDUyGAvvKo.json`)
			.then((resp) => {

				app.init(resp.sheets.Sheet1)
				
			})

	},

	init: (postcodes) => {

		var toolbelt = new Toolbelt()

		var key = "1W6Y3nd7AbfbfPLyqcuHuF-odvoLVuYK92X9BXqXq01Q";

		loadJson(`https://interactive.guim.co.uk/docsdata/${key}.json`)
			.then((data) => {

				var wrangle = new Preflight(data.sheets.Sheet1, key, settings, postcodes)

				wrangle.process().then( (application) => {

					new Relocator(application)

				})
				
			})


	}
}

app.preload()