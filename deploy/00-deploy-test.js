// Below code will deploy it to hardhat node, so it won't be saved in `deployments` folder.
// Below code will run only from `deploy` folder.

const { ethers } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deploya } = await getNamedAccounts()

    // Deploying Contract
    const testDeploy = await deploy("Test", { from: deploya })
    log(`Test Contract deployed at: ${testDeploy.address}`)

    // Getting Contract
    const getContract_1 = await ethers.getContract("Test", deploya)
    const getContract_2 = await ethers.getContractAt("Test", testDeploy.address, deploya)

    // Getting Deployer
    log(`Deployer: ${deploya}`)

    // Using Contract "add()" function:
    log(`Counter: ${await getContract_2.getCounter()}`)
    await getContract_1.add()
    await getContract_2.add()
}

module.exports.tags = ["deploy"]
