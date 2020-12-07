import React from 'react';
import Web3 from 'web3';
import { getWeb3, getContracts } from './utils';
import App from './App';

const LoadingContainer = () => {
    const [web3, setWeb3] = React.useState<Web3>();
    const [accounts, setAccounts] = React.useState<string[]>([]);
    const [contracts, setContracts] = React.useState(undefined);

    React.useEffect(() => {
        const init = async () => {
            let web3: any;
            web3 = await getWeb3();
            const contracts = await getContracts(web3);
            const accounts = await web3.eth.getAccounts();
            setWeb3(web3);
            setContracts(contracts);
            setAccounts(accounts);
        };
        init();
    }, []);

    const isReady = () => (
        typeof web3 !== 'undefined'
        && typeof contracts !== 'undefined'
        && accounts.length > 0
    )

    if (!isReady()) {
        return <div> Loading... </div>
    };

    return (
        <App
            web3={web3}
            accounts={accounts}
            contracts={contracts}
        />
    );
};

export default LoadingContainer;