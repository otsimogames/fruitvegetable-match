
import fs = require('fs');
import path = require('path');
import { assetSvc, fileMan } from './services';
import * as asset from './services/asset';
import * as filesvc from './services/file';
import * as mimetypes from 'mime-types';
import * as request from 'request';

const { exec } = require('child_process');

interface GameJsPreload {
    name: string
    type: string
    path: string
}


interface GameJsMaterial {
    id: string
    kind: string
    image: string
    audio: string
    question: string
    text: string
    tint: string
}

interface GameJs {
    _language: string
    _root: string
    preload: GameJsPreload[]
    game: {
        question_from: string,
        answers_from: string,
        answer_type: 'choose' | 'match'
    },
}

export interface GameJsWithMaterial {
    [key: string]: GameJsMaterial[]
}

interface MaterialGroup {
    [language: string]: GameJsMaterial
}

export function readJsonFiles(files: string[]): GameJs[] {
    const read = files.map(f => {
        let t: GameJs = JSON.parse(fs.readFileSync(f).toString('utf-8'))
        let ss = f.split('/')
        t._language = ss[ss.length - 1].split('.')[0]
        t._root = path.dirname(path.join(__dirname, f)).replace('/src/data', '');
        return t
    })
    return read
}

function generateMaterialGroups(datas: GameJs[]) {
    let m = new Map<string, MaterialGroup>();
    for (let d of datas) {
        const key = d.game.answers_from;
        const dm = d as any as GameJsWithMaterial;
        const mats = dm[key]
        for (let material of mats) {
            let mg = m.get(material.id)
            if (!mg) {
                mg = {}
            }
            mg[d._language + d.game.answer_type] = material
            m.set(material.id, mg)
        }
    }
    return Array.from(m.values())
}

function checkRefEqual(name: string, mg: MaterialGroup, datas: GameJs[]) {
    return datas
        .map(m => ({ lang: m._language, d: m.preload.filter(s => s.name == mg[m._language + m.game.answer_type][name])[0] }))
        .reduce((pv, cv) => {
            if (pv.p == null) {
                return { p: cv.d.path, ok: true }
            }
            if (pv.p !== cv.d.path) {
                pv.ok = false
            }
            return pv;
        }, { p: null, ok: true }).ok
}

function getPreloadUrl(name: string, lang: string, datas: GameJs[]) {
    for (let d of datas) {
        if (d._language == lang) {
            let t = d.preload.filter(s => s.name == name)[0];
            return path.join(d._root, 'src', t.path);
        }
    }
    return null;
}

function newComponent(key: string, type: asset.ComponentType, locales: string[]) {
    let c = new asset.Component();
    c.key = key
    c.type = type
    c.locales = locales;
    c.value = new asset.ComponentValue()
    return c;
}

function newStrComponent(key: string, type: asset.ComponentType, locales: string[], value: string) {
    const cid = newComponent(key, type, locales)
    cid.value.str = value
    return cid
}

function convertMaterial(datas: GameJs[], mg: MaterialGroup): asset.Material {
    let mat = new asset.Material();
    let langList = Array.from(new Set(datas.map(d => d._language)))
    const at = datas[0].game.answer_type
    const defkey = langList[0] + at

    mat.name = mg[defkey].id
    mat.description = 'material of ' + mat.name
    mat.disabled = false
    mat.components = []


    mat.components.push(newStrComponent('id', 'TEXT', langList, mg[defkey].id))
    mat.components.push(newStrComponent('kind', 'TEXT', langList, mg[defkey].kind))
    mat.components.push(newStrComponent('tint', 'TEXT', langList, mg[defkey].tint))
    mat.components.push(newStrComponent('text', 'I18N', langList, mg['enmatch'].text))

    //image
    let imgOK = checkRefEqual('image', mg, datas)
    let audioOK = checkRefEqual('audio', mg, datas)

    if (imgOK) {
        const c = newComponent('image', 'IMAGE', langList)
        c.value.url = getPreloadUrl(mg[defkey].image, langList[0], datas)
        mat.components.push(c)
    } else {
        for (let l of langList) {
            const c = newComponent('image', 'IMAGE', [l])
            c.value.url = getPreloadUrl(mg[l + at].image, l, datas)
            mat.components.push(c)
        }
    }
    if (audioOK) {
        const c = newComponent('audio', 'AUDIO', langList)
        c.value.url = getPreloadUrl(mg[defkey].audio, langList[0], datas)
        mat.components.push(c)
    } else {
        for (let l of langList) {
            const c = newComponent('audio', 'AUDIO', [l])
            c.value.url = getPreloadUrl(mg[l + at].audio, l, datas)
            mat.components.push(c)
        }
    }

    // match
    for (let l of langList) {
        const c = newComponent('question_match', 'AUDIO', [l])
        c.value.url = getPreloadUrl(mg[l + 'match'].question, l, datas.filter(d => d.game.answer_type === 'match'))
        mat.components.push(c)
    }
    // choose
    for (let l of langList) {
        const c = newComponent('question_choose', 'AUDIO', [l])
        c.value.url = getPreloadUrl(mg[l + 'choose'].question, l, datas.filter(d => d.game.answer_type === 'choose'))
        mat.components.push(c)
    }
    return mat
}

async function uploadFile(file: string, meta: filesvc.FileMetadata, autoSend: boolean = true): Promise<string> {
    const req = new filesvc.UploadReq()
    meta.collection = 'asset'
    meta.type = meta.type;
    req.metadata = [meta];
    const res = await fileMan.requestStoreBig(req)
    return new Promise<string>((resolve, reject) => {
        fs.readFile(file, function (err, data) {
            if (err) {
                return reject(err);
            }
            request({
                method: "PUT",
                url: res.uploadUrls[meta.key],
                body: data,
                headers: {
                    'Content-Type': meta.type,
                }
            }, function (err, r, body) {
                if (err) {
                    return reject(err);
                }
                if (r.statusCode !== 200) {
                    console.log(body);
                    return reject('failed to upload:' + r.statusCode);
                }
                resolve(res.uploadUrls[meta.key].split('?')[0])
            })
        });
    })
}

async function upload(all: asset.Material[]) {
    console.log(JSON.stringify(all, null, '  '))
    for (let m of all) {
        for (let c of m.components) {
            if (c.value.url) {
                if (!fs.existsSync(c.value.url)) {
                    throw 'file "' + c.value.url + '" does not exits';
                }
                console.log('start to upload', m.name, c.key)
                let meta = new filesvc.FileMetadata();
                meta.type = mimetypes.lookup(c.value.url) || 'application/octet-stream'
                meta.collection = 'asset'
                meta.key = m.name + "/" + path.basename(c.value.url);
                meta.labels = {}
                const res = await uploadFile(c.value.url, meta)
                c.value.url = res;
            }
        }
        const res = await assetSvc.putMaterial(m);
        console.log(res);
    }
}

export function exportMaterials(files: string[]) {
    const datas = readJsonFiles(files);
    const mats = generateMaterialGroups(datas);
    let all = []
    for (let m of mats) {
        all.push(convertMaterial(datas, m))
    }
    upload(all)
        .then(ok => { console.log('completed') })
        .catch(err => console.error(err))
}



