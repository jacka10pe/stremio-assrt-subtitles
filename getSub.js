const fetch = require('node-fetch')

const ASSRT_TOKEN = ""
const TMDB_TOKEN = ""
const axios = require('axios');
const latinize = require('./latinize')

async function fetchTitle(id, mediaType) {

	const options = {
		method: 'GET',
		url: `https://api.themoviedb.org/3/find/${id}?external_source=imdb_id`,
		params: {
			query: id
		},
		headers: {
			accept: 'application/json',
			Authorization: 'Bearer ' + TMDB_TOKEN
		}
	};

	try {
		var title = undefined;
		const response = await axios.request(options);
		switch (mediaType) {
			case "movie":
				title = response.data.movie_results[0].original_title;
				break;
			case "series":
				title = response.data.tv_results[0].original_name;
				break;
		}
		var latinized = latinize.convert(title);
		console.log(latinized);
		return latinized;
	} catch (error) {
		console.error(error);
	}
}

async function searchId(type, id, extra) {
    var sp = id.split(":")
	var filename = await fetchTitle(sp[0], type)
    if (type == "series") {
        if (sp[1] *= 1 < 10) {
            sp[1] = "0" + sp[1]
        }
        if (sp[2] *= 1 < 10) {
            sp[2] = "0" + sp[2]
        }
        filename = filename + " S" + sp[1] + "E" + sp[2]
    }
    console.log("filename: " + filename)
    const response = await fetch(`https://api.assrt.net/v1/sub/search?token=${ASSRT_TOKEN}&q=${filename}&cnt=15&pos=0&no_muxer=1&filelist=1`)
    const data = await response.json()
    if (data.sub.subs) {
        for (i in data.sub.subs) {
			for (var j in data.sub.subs[i].filelist) {
				if (isChineseSubtitle(data.sub.subs[i].filelist[j].f)) {
					var fid = data.sub.subs[i].id
					if (fid != undefined) {
						return fid
					}
				}
			}
        }
    }
    return undefined
}

async function searchUrl(type, id, extra) {
	var subtitles = []
	var fid = await searchId(type, id, extra)
    if (fid != undefined) {
		const response = await fetch(`https://api.assrt.net/v1/sub/detail?token=${ASSRT_TOKEN}&id=${fid}`)
		const data = await response.json()
		for (var i in data.sub.subs[0].filelist) {
			var f = data.sub.subs[0].filelist[i].f;
			if (isChineseSubtitle(f)) {
				var subtitle = {
					id: "assrt" + i,
					url: data.sub.subs[0].filelist[i].url,
					lang: "Assrt-Chinese"
				}
				subtitles.push(subtitle)
            }
        }
		return subtitles
    } else {
        return undefined
    }
}

function isChineseSubtitle(str) {
	return str.search(".srt") != -1
		&& (str.search("简") != -1
			|| str.search("繁") != -1
			|| str.search("sc") != -1
			|| str.search("SC") != -1
			|| str.search("chi") != -1
			|| str.search("chs") != -1
			|| str.search("cht") != -1
			|| str.search("zhe") != -1
			|| str.search("zho") != -1);
}

async function getSub(type, id, extra) {
	var subtitles = await searchUrl(type, id, extra)
    return subtitles
}

//var info = {
//	 type: "series",
//	 id: "tt2788316:1:3",
//     extra: undefined
//}
//var info = {
//	type: "movie",
//	id: "tt7097896",
//	extra: undefined
//}

// getSub(info.type, info.id, info.extra)

module.exports = {
    getSub
}