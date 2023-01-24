const { getWeth, AMOUNT } = require("../scripts/getWeth.js")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

async function main() {
    await getWeth()
    const { deployer } = await getNamedAccounts()
    const wethAddress = networkConfig[network.config.chainId].wethToken
    const daiAddress = networkConfig[network.config.chainId].daiEthPriceFeed
    console.log(`weth: ${wethAddress}`)

    const lendingPool = await getLendingPool(deployer)
    console.log(`LendingPool Address: ${lendingPool.address}`)

    // Approve LendingPool to deposit funds for us
    await approveERC20(AMOUNT, lendingPool.address, wethAddress, deployer)
    // Deposit
    console.log("Depositing Collateral...")
    await lendingPool.deposit(wethAddress, AMOUNT, deployer, 0)
    console.log("Collateral Deposited!")

    // Borrowing some DAI
    console.log("Borrowing DAI...")
    const daiEthPrice = await getAssetPrice(daiAddress)
    await getUserBorrowData(lendingPool, deployer)
}

async function getLendingPool(account) {
    // We are getting "lendingPoolAddressesProvider" from:
    // Run command: `yarn add --dev @aave/protocol-v2`
    // node_modules -> @aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol:ILendingPoolAddressesProvider
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        networkConfig[network.config.chainId].lendingPoolAddressesProvider,
        account
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
    return lendingPool
}

async function approveERC20(amount, spender, erc20Address, account) {
    console.log("Approving ERC20 Token...")
    const erc20 = await ethers.getContractAt("IERC20", erc20Address, account)
    const approveTx = await erc20.approve(spender, amount)
    await approveTx.wait(1)
    console.log("ERC20 Approved!")
}

async function getAssetPrice(priceFeedAddress) {
    // As this is PriceFeed we do not need sign it as deployer
    const priceFeedContract = await ethers.getContractAt("AggregatorV3Interface", priceFeedAddress)
    const price = (await priceFeedContract.latestRoundData())[1]
    console.log(`Price: ${price.toString() / 10 ** 18}`)
    return price
}

async function getUserBorrowData(lendingPool, account) {
    // Names below have to be equal to lendingPool
    let { totalCollateralETH, totalDebtETH, availableBorrowsETH, currentLiquidationThreshold, ltv, healthFactor } = await lendingPool.getUserAccountData(
        account
    )

    // We can round data in 2 ways:
    currentLiquidationThreshold = parseFloat(currentLiquidationThreshold / 100).toFixed(2)
    ltv = parseFloat(ltv / 100).toFixed(2)
    healthFactor = parseFloat(healthFactor / 10 ** 18).toFixed(2)

    console.log(`You have ${ethers.utils.formatEther(totalCollateralETH)} worth of ETH deposited.`)
    console.log(`You have ${ethers.utils.formatEther(totalDebtETH)} worth of ETH borrowed.`)
    console.log(`You can borrow ${ethers.utils.formatEther(availableBorrowsETH)} worth of ETH.`)
    console.log(`Liquidation threshold ${currentLiquidationThreshold}%, Max LTV is ${ltv}%, Health Factor ${healthFactor}`)
    return { availableBorrowsETH, totalDebtETH }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
