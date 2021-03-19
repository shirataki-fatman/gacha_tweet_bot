const fs = require("fs")
const csv = require("csv")
const yaml = require("js-yaml")

const SrcPath = "../gachaTypeSrc"
const CategoryFileName = "category.csv"
const ItemFileName = "item.csv"
const RequiredGachaFile = [CategoryFileName, ItemFileName]
const DistPath = "../gachaType"
const OutputCategoryFileName = "category.yaml"
const OutputItemFileName = "item.yaml"

const files = fs.readdirSync(SrcPath)
files.forEach((fileName) => {
    if (isDirectory(fileName)) {
        console.log(`create [${fileName}] gachaType`)
        const dirName = fileName
        checkFiles(dirName)
        saveCategory(dirName)
        saveItem(dirName)
    }
})

function isDirectory(fileName) {
    try {
        const stat = fs.statSync(`${SrcPath}/${fileName}`)
        return stat.isDirectory()
    }
    catch(err) {
        return false
    }
}

function checkFiles(dirName) {
    const files = fs.readdirSync(`${SrcPath}/${dirName}`)
    RequiredGachaFile.forEach(requiredFileName => {
        const filtered = files.filter(fileName => fileName === requiredFileName)
        if (!filtered.length) {
            throw `required file not exist: ${SrcPath}/${dirName}/${requiredFileName}`
        }
    })
}

function saveYamlFile(dirName, fileName, yaml) {
    if (!isDirectory(`${DistPath}/${dirName}`)) {
        fs.mkdirSync(`${DistPath}/${dirName}`)
    }
    fs.writeFileSync(`${DistPath}/${dirName}/${fileName}`, yaml)
}

function saveCategory(dirName) {
    const categoryParser = csv.parse((error, data) => {
        if (error) {
            throw error
        }
    
        const parseResult = []
        data.forEach(element => {
            parseResult.push({
                name: `${element[0]}`,
                weight: parseInt(element[1]),
                label: `${element[2]}`
            })
        })
    
        const yamlText = yaml.dump(parseResult)
        saveYamlFile(dirName, OutputCategoryFileName, yamlText)
    })

    fs.createReadStream(`${SrcPath}/${dirName}/${CategoryFileName}`).pipe(categoryParser)
}

function saveItem(dirName) {
    const itemParser = csv.parse((error, data) => {
        if (error) {
            throw error
        }

        const parseResult = []
        data.forEach(element => {
            parseResult.push({
                category: element[0],
                name: element[1]
            })
        })

        const yamlText = yaml.dump(parseResult)
        saveYamlFile(dirName, OutputItemFileName, yamlText)
    })

    fs.createReadStream(`${SrcPath}/${dirName}/${ItemFileName}`).pipe(itemParser)
}