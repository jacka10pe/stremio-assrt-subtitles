const {
	addonBuilder, serveHTTP, publishToCentral
} = require("stremio-addon-sdk")
const {
	getSub
} = require("./getSub")

// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
	"id": "jackalope.assrt",
	"version": "1.0.0",
	"catalogs": [],
	"resources": [
		"subtitles"
	],
	"types": [
		"movie",
		"series"
	],
	"name": " assrt-subtitles",
	"description": "字幕服务由assrt.net提供。"
}
const builder = new addonBuilder(manifest)

builder.defineSubtitlesHandler(async ({
	type,
	id,
	extra
}) => {
	await console.log("request for subtitles: " + type + " " + id)
	try {
		var subtitles = await getSub(type, id, extra)
		if (subtitles != undefined) {
			console.log(subtitles)
			return Promise.resolve({
				subtitles: subtitles
			})
		} else {
			console.log("未找到字幕。")
			return Promise.resolve({
				subtitles: []
			})
		}
	} catch (error) {
		console.log(error)
		return Promise.resolve({
			subtitles: []
		})
	}
})

module.exports = builder.getInterface()