const fetch = require('node-fetch')
const IMDB = require('imdb-light')

const TOKEN = "OgkGzD8XMUYzjgIRXi8cYDevvDPwX8yl"

function imdbFetch(id) {
    return new Promise(function (resolve, reject) {
        IMDB.fetch(id, (details) => {
            resolve(details);
        });
    });
}

async function searchId(type, id, filename) {
    var sp = id.split(":")
    if (filename == undefined) {
        filename = (await imdbFetch(sp[0])).Title.replace(/: /g, '.').replace(/ /g, '.')
    } else {
        filename = filename.replace(/: /g, '.').replace(/ /g, '.')
    }
    var tname = filename.split(".")
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
    const response = await fetch(`https://api.assrt.net/v1/sub/search?token=${TOKEN}&q=${filename}&cnt=15&pos=0&no_muxer=1&filelist=1`)
    const data = await response.json()
    if (data.sub.subs) {
        for (i in data.sub.subs) {
            if (data.sub.subs[i].videoname.search(tname[0]) != -1) {
                for (var j in data.sub.subs[i].filelist) {
                    if (data.sub.subs[i].filelist[j].f.search(".srt") != -1 && (data.sub.subs[i].filelist[j].f.search("简") != -1 || data.sub.subs[i].filelist[j].f.search("sc") != -1 || data.sub.subs[i].filelist[j].f.search("SC") != -1 || data.sub.subs[i].filelist[j].f.search("chi") != -1 || data.sub.subs[0].filelist[i].f.search("chs") != -1 || data.sub.subs[0].filelist[i].f.search("zhe") != -1 || data.sub.subs[0].filelist[i].f.search("zho") != -1)) {
                        var fid = data.sub.subs[0].id
                        if (fid != undefined) {
                            return fid
                        }
                    }
                }
            }
        }
    }
    return undefined
}

async function searchUrl(type, id, filename) {
    var subtitle = {
        url: "",
        lang: ""
    }
    var fid = await searchId(type, id, filename)
    if (fid != undefined) {
        const response = await fetch(`https://api.assrt.net/v1/sub/detail?token=${TOKEN}&id=${fid}`)
        const data = await response.json()
        for (var i in data.sub.subs[0].filelist) {
            if (data.sub.subs[0].filelist[i].f.search(".srt") != -1 && (data.sub.subs[0].filelist[i].f.search("简") != -1 || data.sub.subs[0].filelist[i].f.search("sc") != -1 || data.sub.subs[0].filelist[i].f.search("SC") != -1 || data.sub.subs[0].filelist[i].f.search("chi") != -1 || data.sub.subs[0].filelist[i].f.search("chs") != -1 || data.sub.subs[0].filelist[i].f.search("zhe") != -1 || data.sub.subs[0].filelist[i].f.search("zho") != -1)) {
                subtitle.url = data.sub.subs[0].filelist[i].url
                subtitle.lang = "Assrt-Chinese"
            }
        }
        return subtitle
    } else {
        return undefined
    }
}

async function getSub(type, id, filename) {
    var subtitle = await searchUrl(type, id, filename)
    return subtitle
}

// var info = {
//     type: "movies",
//     id: "tt7097896",
//     filename: undefined
// }

// getSub(info.type, info.id, info.filename)

module.exports = {
    getSub
}