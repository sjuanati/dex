// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

//import 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Dai is ERC20 {

    constructor () ERC20('DAI', 'Dai Stablecoin') public {}
    
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
}
