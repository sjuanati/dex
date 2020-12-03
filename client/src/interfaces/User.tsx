export interface User {
    accounts: string[],
    balances: {
        tokenDex: number,
        tokenWallet: number
    },
    selectedToken: {
        0: string,
        1: string,
        ticker: string,
        address: string
    }
};
