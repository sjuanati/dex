/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import Header from './Header';
import Wallet from './Wallet';
import NewOrder from './NewOrder';
import AllOrders from './AllOrders';
import MyOrders from './MyOrders';
import { User, Token, Side, Order } from './interfaces/Interfaces';

const SIDE = {
	BUY: 0,
	SELL: 1,
}

function App({ web3, accounts, contracts }: { web3: any, accounts: string[], contracts: any }) {
	const [tokens, setTokens] = React.useState<Token[]>([]);
	const [user, setUser] = React.useState<User>({
		accounts: [],
		balances: {
			tokenDex: 0,
			tokenWallet: 0
		},
		selectedToken: {
			0: '',
			1: '',
			ticker: '',
			address: ''
		}
	});
	const [orders, setOrders] = React.useState<Order>({
		buy: [],
		sell: []
	});

	const getBalances = async (account: string, token: Token) => {
		console.log('token.ticker at getBalances():', token.ticker)
		const tokenDex = await contracts.dex.methods
			.traderBalances(account, web3.utils.fromAscii(token.ticker))
			.call();
		const tokenWallet = await contracts[token.ticker].methods
			.balanceOf(account)
			.call();
		return { tokenDex, tokenWallet };
	};

	const getOrders = async (token: Token) => {
		const orders = await Promise.all([
			contracts.dex.methods
				.getOrders(web3.utils.fromAscii(token.ticker), SIDE.BUY)
				.call(),
			contracts.dex.methods
				.getOrders(web3.utils.fromAscii(token.ticker), SIDE.SELL)
				.call(),
		]);
		return { buy: orders[0], sell: orders[1] };
	};

	const selectToken = (token: Token) => {
		setUser({ ...user, selectedToken: token })
	};

	const deposit = async (amount: number) => {
		await contracts[user.selectedToken.ticker].methods
			.approve(contracts.dex.options.address, amount)
			.send({ from: user.accounts[0] });
		await contracts.dex.methods
			.deposit(
				amount,
				web3.utils.fromAscii(user.selectedToken.ticker)
			)
			.send({ from: user.accounts[0] });
		const balances = await getBalances(
			user.accounts[0],
			user.selectedToken
		);
		setUser(user => ({ ...user, balances }));
	};

	const withdraw = async (amount: number) => {
		await contracts.dex.methods
			.withdraw(
				amount,
				web3.utils.fromAscii(user.selectedToken.ticker)
			)
			.send({ from: user.accounts[0] });
		const balances = await getBalances(
			user.accounts[0],
			user.selectedToken
		);
		setUser(user => ({ ...user, balances }));
	};

	const createMarketOrder = async (amount: number, side: Side) => {
		await contracts.dex.methods
			.createMarketOrder(
				web3.utils.fromAscii(user.selectedToken.ticker),
				amount,
				side
			)
			.send({ from: user.accounts[0] });
		const orders = await getOrders(user.selectedToken);
		setOrders(orders);
	};

	const createLimitOrder = async (amount: number, price: number, side: Side) => {
		console.log('inside limit order')
		await contracts.dex.methods
			.createLimitOrder(
				web3.utils.fromAscii(user.selectedToken.ticker),
				amount,
				price,
				side
			)
			.send({ from: user.accounts[0] });
		const orders = await getOrders(user.selectedToken);
		setOrders(orders);
	};

	React.useEffect(() => {
		const init = async () => {
			const rawTokens = await contracts.dex.methods.getTokens().call();
			const tokens = rawTokens.map((token: Token) => ({
				...token,
				ticker: web3.utils.hexToUtf8(token.ticker)
			}));
			// const balances = await getBalances(accounts[0], tokens[0]);
			// const orders = await getOrders(tokens[0])
			// Optimisation:
			const [balances, orders] = await Promise.all([
				getBalances(accounts[0], tokens[0]),
				getOrders(tokens[0])
			]);
			setTokens(tokens);
			setUser({ accounts, balances, selectedToken: tokens[0] });
			setOrders(orders);
		};
		init();
	}, []);

	React.useEffect(() => {
		const init = async () => {
			const [balances, orders] = await Promise.all([
				getBalances(accounts[0], user.selectedToken),
				getOrders(user.selectedToken)
			]);
			setUser(user => ({ ...user, balances }))
			setOrders(orders);
		};
		if (user.selectedToken.ticker !== '')
			init();
	}, [user.selectedToken]);

	if (user.selectedToken.ticker === '') {
		return <div>Loading...</div>
	} else {
		console.log('orders:', orders)
	}

	return (
		<div id='app'>
			<Header
				contracts={contracts}
				tokens={tokens}
				user={user}
				selectToken={selectToken}
			/>
			<main className='container-fluid'>
				<div className='row'>
					<div className='col-sm-4 first-col'>
						<Wallet
							user={user}
							deposit={deposit}
							withdraw={withdraw}
						/>
						{/* only if not DAI is selected */}
						{(user.selectedToken.ticker !== 'DAI')
							? (<NewOrder
								createMarketOrder={createMarketOrder}
								createLimitOrder={createLimitOrder}
							/>)
							: null}
					</div>
					{(user.selectedToken.ticker !== 'DAI')
						? (
							<div className='col-sm-8'>
								<AllOrders 
									orders={orders}
								/>
								<MyOrders 
									orders={{
										buy: orders.buy.filter(
											order => order.trader.toLowerCase() === user.accounts[0].toLocaleLowerCase()
										),
										sell: orders.sell.filter(
											order => order.trader.toLowerCase() === user.accounts[0].toLocaleLowerCase()
										),
									}}
								/>
							</div>
						)
						: null}
				</div>
			</main>
			{/* <Footer /> */}
		</div>
	);
}

export default App;
