import loadJson from '../components/load-json/'
import { Relocator } from './modules/relocator'
import { Toolbelt } from './modules/toolbelt'
import { Preflight } from './modules/preflight'
import settings from './data/settings.json'
import { Loader, LoaderOptions } from 'google-maps';

var app = {

	lat: null,

	lng: null,

	preload: (key) => {

		loadJson(`https://interactive.guim.co.uk/docsdata/1T49ad9W3eOMdRaWZE8eAiPMYbp5mT7BcwxDUyGAvvKo.json`)
			.then((resp) => {

				app.init(resp.sheets.Sheet1)
				
			})

	},

	init: (postcodes) => {

		var toolbelt = new Toolbelt()

		var key = "1W6Y3nd7AbfbfPLyqcuHuF-odvoLVuYK92X9BXqXq01Q";

		app.lat = toolbelt.getURLParams('lat');

		app.lng = toolbelt.getURLParams('lng');

		loadJson(`https://interactive.guim.co.uk/docsdata/${key}.json`)
			.then((data) => {

				var wrangle = new Preflight(data.sheets.Sheet1, key, settings, postcodes, app.lat, app.lng)

				wrangle.process().then( (application) => {

					new Relocator(application)

				})
				
			})


	}
}

async function alphabet() {

  return new Promise(function(resolve, reject) {

        try {

		    var loader = new Loader('AIzaSyD8Op4vGvy_plVVJGjuC5r0ZbqmmoTOmKk');

		    loader.load().then(data => resolve(data))

        } catch(e) {

            reject(e);

        }

  });

}

async function boom() {

	console.log(`Version 17 May 2021`)

  await alphabet().then(data => {

    app.preload()

  })

}

boom();


