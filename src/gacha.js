const fs = require("fs")
const yaml = require("js-yaml")
const weighted = require("weighted")
const mersenne = require("mersenne")

const GachaTypeDataPath = "./gachaType"
const CategoryFileName = "category.yaml"
const ItemFileName = "item.yaml"
const ConfigFileName = "config.yaml"
const DefaultLabelName = "default"

function loadYaml(dirName) {
    try {
        return {
            category: yaml.load(fs.readFileSync(`${GachaTypeDataPath}/${dirName}/${CategoryFileName}`)),
            item: yaml.load(fs.readFileSync(`${GachaTypeDataPath}/${dirName}/${ItemFileName}`)),
            config: yaml.load(fs.readFileSync(`${GachaTypeDataPath}/${dirName}/${ConfigFileName}`))
        }
    }
    catch(error) {
        console.log(error)
    }
}

function getCategories(gachaData, label) {
    const categories = gachaData.category
    return categories.filter(c => c.label === label)
}

function getItems(gachaData, categories) {
    const items = gachaData.item
    return items.filter(i => categories.filter(c => i.category === c.name).length)
}

function getWeight(gachaData, label) {
    const categories = getCategories(gachaData, label)
    const items = getItems(gachaData, categories)
    const weights = {}
    const categoryTotalData = {}
    categories.forEach(c => {
        categoryTotalData[c.name] = {
            totalWeight: c.weight,
            count: 0,
            averageWeight: 0
        }        
    })

    if (label !== "" && gachaData.config.pickupUpward[label]) {
        Object.keys(gachaData.config.pickupUpward[label]).forEach(itemID => {
            const item = items.filter(i => i.id === itemID)[0]
            if (!item) {
                return
            }
            weights[itemID] = gachaData.config.pickupUpward[label][itemID]
        })
    }
    if (gachaData.config.pickupUpward[DefaultLabelName]) {
        Object.keys(gachaData.config.pickupUpward[DefaultLabelName]).forEach(itemID => {
            const item = items.filter(i => i.id === itemID)[0]
            if (!item) {
                return
            }
            if (!weights[itemID]) {
                weights[itemID] = gachaData.config.pickupUpward[DefaultLabelName][itemID]
            }
        })
    }

    Object.keys(weights).forEach(itemID => {
        const item = items.filter(i => i.id === itemID)[0]
        if (!item) {
            return
        }
        categoryTotalData[item.category].totalWeight -= weights[itemID]
        categoryTotalData[item.category].count++
    })
    Object.keys(categoryTotalData).forEach(categoryName => {
        let itemCount = items.filter(i => i.category === categoryName).length
        itemCount -= categoryTotalData[categoryName].count
        categoryTotalData[categoryName].averageWeight = categoryTotalData[categoryName].totalWeight / itemCount
        categoryTotalData[categoryName].averageWeight = Math.floor(categoryTotalData[categoryName].averageWeight * 1000) / 1000
    })

    items.forEach(item => {
        if (!weights[item.id]) {
            weights[item.id] = categoryTotalData[item.category].averageWeight
        }
    })
    Object.keys(weights).forEach(itemID => {
        weights[itemID] *= 1000;
    })

    return weights
}

function execGacha(gachaData) {
    const gachaCount = gachaData.config.gachaCount
    const result = []
    for (let i = 0; i < gachaCount; i++) {
        let label = ""
        if (gachaData.config.useGachaLabel[i+1]) {
            label = gachaData.config.useGachaLabel[i+1]
        }
        const weights = getWeight(gachaData, label)
        const selectedItemID = weighted.select(weights, () => mersenne.rand() / 32768)
        const selectedItem = gachaData.item.filter(i => i.id === selectedItemID)[0]
        result.push(selectedItem)
    }
    return result
}

module.exports = {
    loadYaml: loadYaml,
    execGacha: execGacha
}