export interface Token {
    0: string,
    1: string,
    ticker: string,
    address: string
};

export interface User {
    accounts: string[],
    balances: {
        tokenDex: number,
        tokenWallet: number
    },
    selectedToken: Token
};

export interface Side {
    BUY: number,
    SELL: number
};

export interface Order {
    buy: OrderItem[],
    sell: OrderItem[]
};

export interface OrderItem {
    0: string,
    1: string,
    2: string,
    3: string,
    4: string,
    5: string,
    6: string,
    7: string,
    8: string,
    id: number,
    trader: string,
    side: Side,
    ticker: string,
    amount: number,
    filled: number,
    price: number,
    date: number,
};

export interface Trade {
    tradeId: number,
    orderId: number,
    ticker: string,
    trader1: string,
    trader2: string,
    amount: number,
    price: number,
    date: string
}

export interface DropdownItem {
    label: string,
    value: Token
};

export interface Type {
    LIMIT: string,
    MARKET: string
}