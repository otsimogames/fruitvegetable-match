import * as asset from './services/asset'
import { assetSvc } from './services'
import { readJsonFiles, GameJsWithMaterial } from './export'

function selectorOf(key: string, values: string[] | string, operator: asset.LabelSelectorOperator = asset.LabelSelectorOperator_In) {
    const s = new asset.LabelSelector()
    const term = new asset.LabelSelectorTerm()
    const exp = new asset.LabelSelectorRequirement()
    exp.key = 'name'
    exp.operator = operator
    if (typeof values === 'string') {
        exp.values = [values]
    } else {
        exp.values = values;
    }
    term.expressions = [exp]
    s.terms = [term]
    return s
}

async function allMaterials(selector: { [key: string]: string } = {}) {
    const query = new asset.QueryMaterial();
    query.showDisabled = false
    query.labelSelector = selector
    const res = await assetSvc.listMaterial(query)
    console.log('found', res.ids.length, 'material[s]')
    return Promise.all(res.ids.map((id) => assetSvc.getMaterial(id)))
}

async function materialsByName(names: string[]) {
    const query = new asset.MaterialSpec();
    query.advanced = selectorOf('name', names)
    query.ignoreComponentSpec = true
    const res = await assetSvc.listByMaterialSpec(query)
    const ids = Object.keys(res.materials);
    console.log('found', ids.length, 'material[s]')
    return Promise.all(ids.map((id) => assetSvc.getMaterial(id)))
}

function materialsOfData(file: string): string[] {
    const data = readJsonFiles([file])[0]
    const ms = (data as any as GameJsWithMaterial)[data.game.answers_from]
    return ms.map(m => m.id);
}

function updateLabels(id: string, labels: { [key: string]: string }) {
    const req = new asset.UpdateMaterialRequest()
    req.fieldMask = new asset.FieldMask()
    req.fieldMask.paths = ['labels']
    req.material = new asset.Material()
    req.material.id = id
    req.material.labels = labels
    return assetSvc.updateMaterial(req)
}

async function addNameToLabels(mat: asset.Material) {
    let lb = mat.labels || {}
    if (Object.keys(lb).indexOf('name') !== -1) {
        return mat;
    }
    lb['name'] = mat.name;
    return updateLabels(mat.id, lb)
}

function stringValueOfComponent(mat: asset.Material, key: string): string {
    const cmps = mat.components || [];
    for (let c of cmps) {
        if (c.key === key) {
            return c.value.str;
        }
    }
    return null;
}

async function addKindAndIdToLabels(mat: asset.Material) {
    let lb = mat.labels || {}
    let changed = false
    const addCmpValueToLabel = (key: string, toLabel: string) => {
        if (Object.keys(lb).indexOf(toLabel) === -1) {
            let v = stringValueOfComponent(mat, key);
            if (v !== null) {
                changed = true
                lb[toLabel] = v;
            }
        }
    }
    addCmpValueToLabel('kind', 'kind')
    addCmpValueToLabel('kind', 'kind-match')
    addCmpValueToLabel('kind', 'kind-choose')
    addCmpValueToLabel('id', 'id')
    if (!changed) {
        return mat
    }
    console.log('update material', mat.name, 'labels')
    return updateLabels(mat.id, lb)
}

async function addColorToLabels(mat: asset.Material) {
    let lb = mat.labels || {}
    lb['kind-color'] = lb['kind']
    return updateLabels(mat.id, lb)
}

async function completeNumberLabels(mat: asset.Material) {
    let lb = mat.labels || {}
    lb['type'] = 'number';
    lb['subject'] = 'math';
    lb['usage'] = 'always';
    lb['abstract'] = '3';
    lb['level'] = '1';
    return updateLabels(mat.id, lb)
}
async function main() {
    let mats = await allMaterials()
    console.log(mats.map(m => m.name))
    return null
}

async function main_color() {
    let mats = await allMaterials({ 'type': 'color' })
    return Promise.all(mats.map(m => addColorToLabels(m)))
}

async function main_kind() {
    let mats = await allMaterials()
    return Promise.all(mats.map(m => addColorToLabels(m)))
}

async function main_name() {
    let mats = await allMaterials()
    return Promise.all(mats.map(m => addNameToLabels(m)))
}

async function main_numbers() {
    let mats = await materialsByName(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'])
    console.log(mats.map(m => m.name))
    return Promise.all(mats.map(m => completeNumberLabels(m)))
}

async function main_fruit_labels() {
    let mats = await materialsByName(materialsOfData('./src/data/en.json'))
    console.log(mats.map(m => m.name))
    return null;
}

main_fruit_labels().catch(console.error)