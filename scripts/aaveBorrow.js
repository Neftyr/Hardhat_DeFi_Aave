const { getWeth, AMOUNT } = require("../scripts/getWeth.js")

async function main() {
    await getWeth()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
