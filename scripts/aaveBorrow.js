const { getWeth, AMOUNT } = require("../scripts/getWeth.js")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

async function main() {
    await getWeth()
    const { deploya } = await getNamedAccounts()
    const wethAddress = networkConfig[network.config.chainId].wethToken
    const daiAddress = networkConfig[network.config.chainId].daiToken
    const daiEthPriceFeedAddress = networkConfig[network.config.chainId].daiEthPriceFeed
    console.log(`weth: ${wethAddress}`)

    const lendingPool = await getLendingPool(deploya)
    console.log(`LendingPool Address: ${lendingPool.address}`)

    // Approve LendingPool to deposit funds for us
    await approveERC20(AMOUNT, lendingPool.address, wethAddress, deploya)
    // Deposit
    console.log("Depositing Collateral...")
    await lendingPool.deposit(wethAddress, AMOUNT, deploya, 0)
    console.log("Collateral Deposited!")

    // Borrowing some DAI
    console.log("Getting User Borrow Data...")
    const daiEthPrice = await getAssetPrice(daiEthPriceFeedAddress)
    const daiTokenName = await getTokenName(daiAddress)
    console.log(`${daiTokenName} price: ${daiEthPrice.toString() / 10 ** 18}`)
    const { availableBorrowsETH, totalDebtETH } = await getUserBorrowData(lendingPool, deploya)
    // Borrwing DAI for 95% of ETH funds
    const borrowFor = 0.95
    const amountDaiToBorrow = availableBorrowsETH.toString() * borrowFor * (1 / daiEthPrice.toString())
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
    console.log(`We are borrowing ${amountDaiToBorrow} DAI`)
    console.log("===========================================================================================")
    console.log("Borrowing DAI...")
    await borrowAsset(daiAddress, lendingPool, amountDaiToBorrowWei, deploya)
    console.log(`Successfully borrowed ${daiTokenName}`)
    console.log("Your updated User Borrow Data:")
    await getUserBorrowData(lendingPool, deploya)

    // Repaying Debt
    const amountDaiToRepay = (amountDaiToBorrowWei - 0.01).toString()
    await repayAll(daiAddress, amountDaiToRepay, lendingPool, deploya)
    console.log("===========================================================================================")
    console.log("User Borrow Data After Repay:")
    await getUserBorrowData(lendingPool, deploya)
}

async function repayAll(assetAddress, amountToRepay, lendingPool, account) {
    await approveERC20(amountToRepay, lendingPool.address, assetAddress, account)
    const repayTx = await lendingPool.repay(assetAddress, amountToRepay, 1, account)
    await repayTx.wait(1)
}

async function borrowAsset(assetAddress, lendingPool, amountToBorrow, account) {
    const borrowTx = await lendingPool.borrow(assetAddress, amountToBorrow, 1, 0, account)
    await borrowTx.wait(1)
}

async function approveERC20(amount, spender, erc20Address, account) {
    console.log("Approving ERC20 Token...")
    const erc20 = await ethers.getContractAt("IERC20", erc20Address, account)
    const approveTx = await erc20.approve(spender, amount)
    await approveTx.wait(1)
    console.log("ERC20 Approved!")
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

async function getTokenName(tokenAddress) {
    const token = await ethers.getContractAt("IERC20", tokenAddress)
    const tokenName = await token.name()
    return tokenName
}

async function getAssetPrice(priceFeedAddress) {
    // As this is PriceFeed we do not need sign it as deployer
    const priceFeedContract = await ethers.getContractAt("AggregatorV3Interface", priceFeedAddress)
    const price = (await priceFeedContract.latestRoundData())[1]
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
