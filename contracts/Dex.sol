// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

contract Dex {
    struct Token {
        bytes32 ticker;
        address tokenAddres;
    }
    
    mapping(bytes32 => Token) public tokens;
    bytes32[] public tokenList;
    address public admin;
    
    constructor() public {
        admin = msg.sender;
    }
    
    function addToken(
        bytes32 ticker,
        address tokenAddres)
        external
        onlyAdmin() {
            tokens[ticker] = Token(ticker, tokenAddres);
            tokenList.push(ticker);
        }
        
    modifier onlyAdmin() {
        require(msg.sender == admin, 'only admin');
        _;
    }
}
