const fetch = require('node-fetch')

const ASSRT_TOKEN = process.env.ASSRT_TOKEN
const TMDB_TOKEN = process.env.TMDB_TOKEN
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
    const response = await axios.get(`https://api.assrt.net/v1/sub/search?token=${ASSRT_TOKEN}&q=${filename}&cnt=5&pos=0&no_muxer=1&filelist=1`)
	const data = response.data
	var ids = []
    if (data.sub.subs) {
		for (var sub of data.sub.subs) {
			var filelist = getFileList(sub)
			if (sub.id == undefined
				|| filelist.length == 0) {
				continue;
			}
			var langlist = sub.lang.langlist
			if (langlist.langcht
				|| langlist.langchs
				|| langlist.langdou
				|| filelist.find(file => isChineseSubtitle(file) != undefined)) {
				ids.push(sub.id)
			}
		}
    }
	return ids;
}

async function searchUrl(type, id, extra) {
	var subtitles = []
	var subids = await searchId(type, id, extra)
	for (var subid of subids) {
		const response = await axios.get(`https://api.assrt.net/v1/sub/detail?token=${ASSRT_TOKEN}&id=${subid}`)
		const sub = response.data.sub.subs[0]
		var filelist = getFileList(sub)
		for (var file of filelist) {
			var subtitle = {
				id: `${subid} ${file.f}`,
				url: file.url,
				lang: sub.lang.desc ?? "Assrt-Chinese"
			}
			subtitles.push(subtitle)
		}
	}

	return subtitles
}

function isChineseSubtitle(str) {
	return str.search("简") != -1
			|| str.search("繁") != -1
			|| str.search("sc") != -1
			|| str.search("SC") != -1
			|| str.search("chi") != -1
			|| str.search("chs") != -1
			|| str.search("cht") != -1
			|| str.search("zhe") != -1
			|| str.search("zho") != -1;
}

function isFileCompatible(str) {
	return str.search(".srt") != -1;
}

function getFileList(sub) {
var filelist = sub.filelist
	var files = []
	if (Array.isArray(filelist)) {
		for (var file of filelist) {
			if (!isFileCompatible(file.f)) {
				continue;
			}
			files.push(file)
		}
	}
	if (isFileCompatible(sub.filename)) {
		files.push({
			f: sub.filename,
			url: sub.url
		})
	}
	return files

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
//	id: "tt0405422",
//	extra: undefined
//}

//getSub(info.type, info.id, info.extra)

module.exports = {
    getSub
}