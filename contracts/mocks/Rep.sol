// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

//import 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Rep is ERC20 {

    constructor () ERC20('REP', 'Augur Token') public {}
    
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
