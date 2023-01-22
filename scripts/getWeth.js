const { getNamedAccounts, ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

const AMOUNT = ethers.utils.parseEther("0.1")

async function getWeth() {
    const { deployer } = await getNamedAccounts()
    const iWeth = await ethers.getContractAt("IWeth", networkConfig[network.config.chainId].wethToken, deployer)
    const txResponse = await iWeth.deposit({ value: AMOUNT })
    await txResponse.wait(1)
    // Below will work only on FORKED network
    const wethBalance = await iWeth.balanceOf(deployer)
    const wethBalanceForm = wethBalance / 10 ** 18
    console.log(`Got ${wethBalanceForm.toString()} WETH`)
}

module.exports = { getWeth, AMOUNT }
