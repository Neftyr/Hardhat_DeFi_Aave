// Below will deploy contract and save it in `deployments` folder, we can deploy it ONCE, otherwise we need to remove it from `deployments` folder or remove whole folder.

async function deployTest() {
    const { deploy, log } = deployments
    const { deploya } = await getNamedAccounts()

    const test = await deploy("Test", { from: deploya, log: true, waitConfirmations: 1 })
    log(`Test Contract deployed at: ${test.address}`)

    const testContract = await ethers.getContractAt("Test", test.address, deploya)

    // Using Contract "add()" function:
    await testContract.add()
}

deployTest()
