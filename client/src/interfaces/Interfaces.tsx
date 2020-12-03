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

export interface DropdownItem {
    label: string,
    value: Token
};

