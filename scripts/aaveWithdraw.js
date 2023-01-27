const { getWeth, AMOUNT } = require("../scripts/getWeth.js")
const { networkConfig } = require("../helper-hardhat-config")
const { getLendingPool, approveERC20, getUserBorrowData } = require("../scripts/aaveBorrow.js")

/*
============================================================================================
    To run below first comment out "main()..." at the bottom of code in "aaveBorrow.js" !!! 

                                    ONLY FOR LOCAL TESTING !!!
============================================================================================
*/

async function aaveWithdrawLending() {
    // Setup...
    const { deploya } = await getNamedAccounts()
    const wethAddress = networkConfig[network.config.chainId].wethToken
    await preWithdraw(deploya, wethAddress)

    // Withdrawing...
    // const tokenToWithdraw = await ethers.getContractAt("IERC20", wethAddress, deploya)
    const lending = await getLendingPool(deploya)
    console.log("Withdrawing...")
    const withdrawTx = await lending.withdraw(wethAddress, AMOUNT, deploya)
    await withdrawTx.wait(1)
    console.log("Withdrew Successfully!")
    await getUserBorrowData(lending, deploya)
}

/*
    Below function will work only on MAINNET !!!
    Because we need aave funds deposited to withdraw them 
*/
async function aaveWithdrawInterface() {
    // Setup...
    const { deploya } = await getNamedAccounts()
    const wethAddress = networkConfig[network.config.chainId].wethToken

    // Withdrawing...
    const tokenToWithdraw = await ethers.getContractAt("IWeth", wethAddress, deploya)
    const lending = await getLendingPool(deploya)
    console.log("Withdrawing...")
    const withdrawTx = await tokenToWithdraw.withdraw(AMOUNT)
    await withdrawTx.wait(1)
    console.log("Withdrew Successfully!")
    await getUserBorrowData(lending, deploya)
}

async function preWithdraw(account, wethAddress) {
    await getWeth()

    const lendingPool = await getLendingPool(account)
    console.log(`LendingPool Address: ${lendingPool.address}`)

    // Approve LendingPool to deposit funds for us
    await approveERC20(AMOUNT, lendingPool.address, wethAddress, account)
    // Deposit
    console.log("Depositing Collateral...")
    await lendingPool.deposit(wethAddress, AMOUNT, account, 0)
    console.log("Collateral Deposited!")
    await getUserBorrowData(lendingPool, account)
}

//aaveWithdrawInterface()
aaveWithdrawLending()
