// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
import 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol';

/*
** Remark on mapping(bytes32 => mapping(uint256 => Order[])) public orderBook;
    // Enum can be casted into uint = 0 is BUY order, 1 is SELL order.
    // The array of orders will be sorted by price time prioritization (the best prices are at the beginning of the array)
    // example BUY orders: [50, 45, 44, 30]
    // example SELL orders: [60, 67, 70, 72]
*/

contract Dex {
    
    enum Side {
        BUY,
        SELL
    }
    
    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }
    
    struct Order {
        uint256 id;
        Side side;
        bytes32 ticker;
        uint256 amount;
        uint256 filled;
        uint256 price;
        uint256 date;
    }
    
    mapping(bytes32 => Token) public tokens;
    bytes32[] public tokenList;
    mapping(address => mapping(bytes32 => uint256)) public traderBalances;
    mapping(bytes32 => mapping(uint256 => Order[])) public orderBook;
    address public admin;
    uint256 public nextOrderId;
    bytes32 constant DAI = bytes32('DAI');
    
    constructor() public {
        admin = msg.sender;
    }


    function addToken(bytes32 _ticker, address _tokenAddress) external onlyAdmin() {
        tokens[_ticker] = Token(_ticker, _tokenAddress);
        tokenList.push(_ticker);
    }


    function deposit(uint _amount, bytes32 _ticker) external tokenExists(_ticker) {
        IERC20(tokens[_ticker].tokenAddress).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        traderBalances[msg.sender][_ticker] += _amount;
    }
 
    function withdraw(uint _amount, bytes32 _ticker) external tokenExists(_ticker) {
        require(traderBalances[msg.sender][_ticker] >= _amount, 'balance too low');
        traderBalances[msg.sender][_ticker] -= _amount;
        IERC20(tokens[_ticker].tokenAddress).transfer(msg.sender, _amount);

    }
        
    modifier tokenExists(bytes32 _ticker) {
        require(tokens[_ticker].tokenAddress != address(0), 'this token does not exist');
        _;
    }
        
    modifier onlyAdmin() {
        require(msg.sender == admin, 'only admin');
        _;
    }
}
