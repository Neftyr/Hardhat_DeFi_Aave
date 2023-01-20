const { getNamedAccounts } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

async function getWeth() {
    const { deployer } = await getNamedAccounts()
}
