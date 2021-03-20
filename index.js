const gacha = require("./src/gacha")

const gachaData = gacha.loadYaml("umamusumeSupport")
const gachaResult = gacha.execGacha(gachaData)

gachaResult.forEach(item => {
    console.log(`${item.category}: ${item.name}`)
})