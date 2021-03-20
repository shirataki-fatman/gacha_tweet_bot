const fs = require("fs")
const csv = require("csv")
const yaml = require("js-yaml")

const SrcPath = "../gachaTypeSrc"
const ConfigFileName = "gachaConfig.json"
const CategoryFileName = "category.csv"
const ItemFileName = "item.csv"
const RequiredGachaFile = [CategoryFileName, ItemFileName]
const DistPath = "../gachaType"
const OutputCategoryFileName = "category.yaml"
const OutputItemFileName = "item.yaml"
const OutputConfigFileName = "config.yaml"

const Categories = {}
const Items = {}
let Config = {}

function isDirectory(fileName) {
    try {
        const stat = fs.statSync(`${SrcPath}/${fileName}`)
        return stat.isDirectory()
    }
    catch(err) {
        return false
    }
}

function loadConfigFile() {
    try {
        Config = JSON.parse(fs.readFileSync(`${SrcPath}/${ConfigFileName}`))
    }
    catch(error) {
        throw error
    }
}

function checkFiles(dirName) {
    try {
        const files = fs.readdirSync(`${SrcPath}/${dirName}`)
        RequiredGachaFile.forEach(requiredFileName => {
            const filtered = files.filter(fileName => fileName === requiredFileName)
            if (!filtered.length) {
                throw `required file not exist: ${SrcPath}/${dirName}/${requiredFileName}`
            }
        })
    }
    catch(err) {
        throw err
    }
}

function saveYamlFile(dirName, fileName, yaml) {
    if (!isDirectory(`${DistPath}/${dirName}`)) {
        fs.mkdirSync(`${DistPath}/${dirName}`)
    }
    fs.writeFileSync(`${DistPath}/${dirName}/${fileName}`, yaml)
}

async function saveCategory(dirName) {
    return new Promise(resolve => {
        const categoryParser = csv.parse((error, data) => {
            if (error) {
                throw error
            }
        
            const parseResult = []
            data.forEach((element, index) => {
                parseResult.push({
                    id: index,
                    name: `${element[0]}`,
                    weight: parseInt(element[1]),
                    label: `${element[2]}`
                })
            })
            Categories[dirName] = parseResult;
        
            const yamlText = yaml.dump(parseResult)
            saveYamlFile(dirName, OutputCategoryFileName, yamlText)

            resolve()
        })
    
        const stream = fs.createReadStream(`${SrcPath}/${dirName}/${CategoryFileName}`);
        stream.pipe(categoryParser)
    })
}

async function saveItem(dirName) {
    return new Promise(resolve => {
        const itemParser = csv.parse((error, data) => {
            if (error) {
                throw error
            }
    
            const parseResult = []
            data.forEach((element) => {
                const categoryID = searchCategoryID(dirName, element[1])
                parseResult.push({
                    id: element[0],
                    categoryID: categoryID,
                    category: element[1],
                    name: element[2]
                })
            })
            Items[dirName] = parseResult
    
            const yamlText = yaml.dump(parseResult)
            saveYamlFile(dirName, OutputItemFileName, yamlText)

            resolve()
        })
    
        const stream = fs.createReadStream(`${SrcPath}/${dirName}/${ItemFileName}`)
        stream.pipe(itemParser)
    })
}

function checkConfigData(dirName) {
    const gachaConfig = Config[dirName]
    Object.keys(gachaConfig.useGachaLabel).forEach(key => {
        if (gachaConfig.gachaCount < parseInt(key)) {
            throw "error."
        }
    })
    Object.keys(gachaConfig.pickupUpward).forEach(itemID => {
        const item = searchItem(dirName, itemID)
        if (!item) {
            throw "error."
        }
        const category = searchCategory(dirName, item.categoryID)
        if (gachaConfig.pickupUpward[itemID] > category.weight) {
            throw "error."
        }
    })

    const yamlText = yaml.dump(gachaConfig)
    saveYamlFile(dirName, OutputConfigFileName, yamlText)
}

function searchCategoryID(dirName, categoryName) {
    const category = Categories[dirName]
    let categoryID
    category.forEach(c => {
        if (c.name === categoryName && c.label === "") {
            categoryID = c.id
        }
    })
    return categoryID
}

function searchCategory(dirName, categoryID) {
    const categories = Categories[dirName]
    let category
    categories.forEach(c => {
        if (c.id === categoryID) {
            category = c
        }
    })
    return category
}

function searchItem(dirName, itemID) {
    const items = Items[dirName]
    let item
    items.forEach(i => {
        if (i.id === itemID) {
            item = i
        }
    })
    return item
}

async function main() {
    loadConfigFile()
    const files = fs.readdirSync(SrcPath)
    files.forEach(async (fileName) => {
        if (isDirectory(fileName)) {
            console.log(`create [${fileName}] gachaType`)
            const dirName = fileName
            checkFiles(dirName)
            await saveCategory(dirName)
            await saveItem(dirName)
            checkConfigData(dirName)
        }
    })
}

main()