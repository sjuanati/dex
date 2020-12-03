/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import Header from './Header';

function App({ web3, accounts, contracts }: { web3: any, accounts: any, contracts: any }) {
	const [tokens, setTokens] = React.useState([]);
	const [user, setUser] = React.useState({
		accounts: [],
		selectedToken: undefined
	});

	const selectToken = (token: any) => {
		setUser({...user, selectedToken: token})
	}

	React.useEffect(() => {
		const init = async () => {
			const rawTokens = await contracts.dex.methods.getTokens().call();
			const tokens = rawTokens.map((token: any) => ({
				...token,
				ticker: web3.utils.hexToUtf8(token.ticker)
			}));
			setTokens(tokens);
			setUser({accounts, selectedToken: tokens[0]})
		};
		init();
	}, []);

	if (typeof user.selectedToken === 'undefined') {
		return <div>Loading...</div>
	};

	return (
		<div id='app'>
			<Header 
				contracts={contracts}
				tokens={tokens}
				user={user}
				selectToken={selectToken}
			/>
			<div>
				Main part
			</div>
			{/* <Footer /> */}
		</div>
	);
}

export default App;
