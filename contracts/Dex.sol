// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;
//import 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol';
//import 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';

/*
** Remark on mapping(bytes32 => mapping(uint256 => Order[])) public orderBook;
    Enum can be casted into uint = 0 is BUY order, 1 is SELL order.
    The array of orders will be sorted by price prioritization (the best prices are at the beginning of the array)
    example BUY orders: [50, 45, 44, 30]
    example SELL orders: [60, 67, 70, 72]
*/
/*
    Order types:
    - Limit order, which specifies a MAX price to buy / MIN price to sell
    - Market order, when you agree to buy or sell at any price in the market
*/

contract Dex {
    
    using SafeMath for uint256;
    
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
        address trader;
        Side side;
        bytes32 ticker;
        uint256 amount;
        uint256 filled;  // how much of the amount was filled (if market order partially matches with this order)
        uint256 price;
        uint256 date;
    }
    
    mapping(bytes32 => Token) public tokens;
    bytes32[] public tokenList;
    mapping(address => mapping(bytes32 => uint256)) public traderBalances;  // user -> ticker -> amount
    mapping(bytes32 => mapping(uint256 => Order[])) public orderBook;       // ticker -> Side -> Order
    address public admin;
    uint256 public nextOrderId;
    uint256 public nextTradeId;
    bytes32 constant DAI = bytes32('DAI');
    
    event NewTrade(
        uint256 tradeId,
        uint256 orderId,
        bytes32 indexed ticker,
        address indexed trader1,
        address indexed trader2,
        uint256 amount,
        uint256 price,
        uint256 date
    );
    
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
        traderBalances[msg.sender][_ticker] = traderBalances[msg.sender][_ticker].add(_amount);
    }
 
    function withdraw(uint _amount, bytes32 _ticker) external tokenExists(_ticker) {
        require(traderBalances[msg.sender][_ticker] >= _amount, 'balance too low');
        traderBalances[msg.sender][_ticker] = traderBalances[msg.sender][_ticker].sub(_amount);
        IERC20(tokens[_ticker].tokenAddress).transfer(msg.sender, _amount);

    }
    
    function createLimitOrder(bytes32 _ticker, uint256 _amount, uint256 _price, Side _side) external tokenExists(_ticker) tokenIsNotDai(_ticker){
        if (_side == Side.SELL) {
            require(traderBalances[msg.sender][_ticker] >= _amount,
            'token balance too low');
        } else {
            require(traderBalances[msg.sender][DAI] >= _amount.mul(_price),
            'dai balance to low');
        }
        Order[] storage orders = orderBook[_ticker][uint256(_side)];
        orders.push(Order(
            nextOrderId,
            msg.sender,
            _side,
            _ticker,
            _amount,
            0,
            _price,
            now
        ));
        // Bubble Algorithm: sort last element added in the array
        // For BUY, move max to the left
        // For SELL, move min to the left
        uint256 i = orders.length > 0 ? orders.length - 1 : 0;
        while(i > 0) {
            if (_side == Side.BUY && orders[i-1].price > orders[i].price)
                break;
            if (_side == Side.SELL && orders[i-1].price < orders[i].price)
                break;
            Order memory order = orders[i-1];
            orders[i-1] = orders[i];
            orders[i] = order;
            i = i.sub(1);
            
        }
        nextOrderId = nextOrderId.add(1);
    }
    
    function createMarketOrder(bytes32 _ticker, uint256 _amount, Side _side) external tokenExists(_ticker) tokenIsNotDai(_ticker){
        if (_side == Side.SELL) {
            require(traderBalances[msg.sender][_ticker] >= _amount,
            'token balance too low');
        }
        // Pointer to the Side of the orderBook
        // If it's a market BUY order, we want to have the list of the SELL orders
        // If it's a market SELL order, we want to have the list of the BUY orders
        Order[] storage orders = orderBook[_ticker][uint256(_side == Side.BUY ? Side.SELL : Side.BUY)];
        
        uint256 i;
        uint256 remaining = _amount;
        while(i < orders.length && remaining > 0) {
            // Goal: What's the available liquidity for each order of the orderBook
            // Diff between the original amount of the order and the part that has been filled already
            uint256 available = orders[i].amount.sub(orders[i].filled);
            // If remaining > available, we will take all the liquidity of this order => what is matched is the available
            // If remaining < available, the limit order is bigger than the market order => the market order will be totally matched => remaining
            uint256 matched = (remaining > available) ? available : remaining;
            remaining = remaining.sub(matched);
            orders[i].filled = orders[i].filled.add(matched);
            emit NewTrade(
                nextTradeId,
                orders[i].id,
                _ticker,
                orders[i].trader,
                msg.sender,
                matched,
                orders[i].price,
                now
                );
            // Update token balance for the 2 traders
            if (_side == Side.SELL) {
                // Sells the token
                traderBalances[msg.sender][_ticker] = traderBalances[msg.sender][_ticker]
                    .sub(matched);
                // Receives DAIs
                traderBalances[msg.sender][DAI] = traderBalances[msg.sender][DAI]
                    .add(matched.mul(orders[i].price));
                // Buys the token
                traderBalances[orders[i].trader][_ticker] = traderBalances[orders[i].trader][_ticker]
                    .add(matched);
                // Sends DAIs
                traderBalances[orders[i].trader][DAI] = traderBalances[orders[i].trader][DAI]
                    .sub(matched.mul(orders[i].price));
            } else {
                require(traderBalances[msg.sender][DAI] >= matched * orders[i].price,
                        'dai balance too low');
                // Buys the token
                traderBalances[msg.sender][_ticker] = traderBalances[msg.sender][_ticker]
                    .add(matched);
                // Sends DAIs
                traderBalances[msg.sender][DAI] = traderBalances[msg.sender][DAI]
                    .sub(matched.mul(orders[i].price));
                // Sells the token
                traderBalances[orders[i].trader][_ticker] = traderBalances[orders[i].trader][_ticker]
                    .sub(matched);
                // Receives DAIs
                traderBalances[orders[i].trader][DAI] = traderBalances[orders[i].trader][DAI]
                    .add(matched.mul(orders[i].price));
            }
            nextTradeId = nextTradeId.add(1);
            i = i.add(1);
        }
        // Prune the orderBook for the totally matched orders (to avoid gas cost)
        // At every loop, if element is matched, remove element and shift the rest of elements to the left
        i = 0;
        while(i < orders.length && orders[i].filled == orders[i].amount) {
            for (uint256 j = i; j < orders.length -1; j++) {
                orders[j] = orders[j + 1];
            }
            orders.pop();
            i = i.add(1);
        }
        
    }
    
    function getOrders(bytes32 _ticker, Side _side) external view returns(Order[] memory) {
        return orderBook[_ticker][uint256(_side)];
    }
    
    function getTokens() external view returns(Token[] memory) {
        Token[] memory _tokens = new Token[](tokenList.length);
        for (uint256 i = 0; i < tokenList.length; i++) {
            _tokens[i] = Token(
                tokens[tokenList[i]].ticker,
                tokens[tokenList[i]].tokenAddress
            );
        }
        return _tokens;
    }
    
    modifier tokenIsNotDai(bytes32 _ticker) {
        // exclude DAI because is used as the quote currency (we shouldn't buy or sell DAIs directly)
        require(_ticker != DAI, 'cannot trade DAI');
        _;
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






