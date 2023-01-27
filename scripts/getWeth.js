const { getNamedAccounts, ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

const AMOUNT = ethers.utils.parseEther("0.1")

async function getWeth() {
    const { deploya } = await getNamedAccounts()
    const iWeth = await ethers.getContractAt("IWeth", networkConfig[network.config.chainId].wethToken, deploya)
    const txResponse = await iWeth.deposit({ value: AMOUNT })
    await txResponse.wait(1)
    // Below will work only on FORKED network
    const wethBalance = await iWeth.balanceOf(deploya)
    const wethBalanceForm = wethBalance / 10 ** 18
    console.log(`Got ${wethBalanceForm.toString()} WETH`)
}

module.exports = { getWeth, AMOUNT }
