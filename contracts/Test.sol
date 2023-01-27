// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "hardhat/console.sol";

contract Test {
    uint256 public counter = 5;

    constructor() {
        console.log("Contract Test Deployed With Hardhat!");
    }

    function add() public {
        counter++;
        console.log(msg.sender, "add to counter", counter);
    }

    function getCounter() public view returns (uint256) {
        return counter;
    }

    function messagePrinter(string memory someMessage) public view {
        console.log(someMessage);
    }
}
