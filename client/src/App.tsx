/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import Header from './Header';
import Wallet from './Wallet';
import NewOrder from './NewOrder';
import AllOrders from './AllOrders';
import MyOrders from './MyOrders';
import AllTrades from './AllTrades';
import { User, Token, Side, Order, Trade } from './interfaces/Interfaces';

const SIDE = {
	BUY: 0,
	SELL: 1,
}

const App = ({
	web3,
	accounts,
	contracts }: {
		web3: any,
		accounts: string[],
		contracts: any
	}) => {
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
	const [trades, setTrades] = React.useState<Trade[]>([]);
	const [listener, setListener] = React.useState(undefined);

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

	const listenToTrades = (token: Token): void => {
		const tradeIds = new Set(); // Set() is equivalent to array but with unique values
		setTrades([]); // Start with clean state in case the users changes to another token
		const listener = contracts.dex.events.NewTrade({
			filter: { ticker: web3.utils.fromAscii(token.ticker) },
			fromBlock: 0 // In production, block from the deployment of the contract
		})
			.on('data', (newTrade: any) => {
				// Avoid duplicated values from the same trade event
				console.log('tradeIds: ', tradeIds);
				if (tradeIds.has(newTrade.returnValues.tradeId)) return;
				tradeIds.add(newTrade.returnValues.tradeId);
				setTrades((trades: any) => ([...trades, newTrade.returnValues]));
			});
		setListener(listener);
	};

	const selectToken = (token: Token): void => {
		setUser({ ...user, selectedToken: token });
	};

	const deposit = async (amount: number) => {
		// Approve amount
		await contracts[user.selectedToken.ticker].methods
			.approve(contracts.dex.options.address, amount)
			.send({ from: user.accounts[0] })
			.on('error', (err: any) => {
				console.log('Error in Approve: ', err);
				return;
			});
		// Send amount
		await contracts.dex.methods
			.deposit(
				amount,
				web3.utils.fromAscii(user.selectedToken.ticker)
			)
			.send({ from: user.accounts[0] })
			.on('error', (err: any) => {
				console.log('Error in Send: ', err);
				console.log('Details: ', err.value);
				return;
			});
		// Update balances
		const balances = await getBalances(
			user.accounts[0],
			user.selectedToken
		);
		// Update balances in state
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

	// React.useEffect(() => {
	// 	const init = async () => {
	// 		console.log('a')
	// 		const rawTokens = await contracts.dex.methods.getTokens().call();
	// 		const tokens = rawTokens.map((token: Token) => ({
	// 			...token,
	// 			ticker: web3.utils.hexToUtf8(token.ticker)
	// 		}));
	// 		// const balances = await getBalances(accounts[0], tokens[0]);
	// 		// const orders = await getOrders(tokens[0])
	// 		// Optimisation:
	// 		const [balances, orders] = await Promise.all([
	// 			getBalances(accounts[0], tokens[0]),
	// 			getOrders(tokens[0])
	// 		]);
	// 		listenToTrades(tokens[0]);
	// 		setTokens(tokens);
	// 		setUser({ accounts, balances, selectedToken: tokens[0] });
	// 		setOrders(orders);
	// 	};
	// 	init();
	// }, []);

	// /* listener.unsubscribe() IS PENDING (!) */
	// React.useEffect(() => {
	// 	const init = async () => {
	// 		console.log('b')
	// 		const [balances, orders] = await Promise.all([
	// 			getBalances(user.accounts[0], user.selectedToken),
	// 			getOrders(user.selectedToken)
	// 		]);
	// 		/* To be reviewed */
	// 		//if (typeof listener !== 'undefined') listener!.unsubscribe();
	// 		listenToTrades(user.selectedToken);
	// 		setUser(user => ({ ...user, balances }))
	// 		setOrders(orders);
	// 	};
	// 	if (user.selectedToken.ticker !== '') {
	// 		init();
	// 	};
	// 	// return () => {listener.unsubscribe();}
	// }, [user.selectedToken]);

	React.useEffect(() => {
		const init = async () => {
			let balances: any, orders: any;
			if (typeof listener === 'undefined' && user.selectedToken.ticker === '') {
				const rawTokens = await contracts.dex.methods.getTokens().call();
				const tokens = rawTokens.map((token: Token) => ({
					...token,
					ticker: web3.utils.hexToUtf8(token.ticker)
				}));
				balances = await getBalances(accounts[0], tokens[0]);
				orders = await getOrders(tokens[0]);
				setUser({ accounts, balances, selectedToken: tokens[0] });
				setTokens(tokens);
			} else {
				balances = await getBalances(accounts[0], user.selectedToken);
				orders = await getOrders(user.selectedToken);
				listenToTrades(user.selectedToken);
				setUser(user => ({ ...user, balances }));
			};
			setOrders(orders);
		};
		init();
	}, [user.selectedToken]);

	// Show loading screen is no token is selected
	if (user.selectedToken.ticker === '') {
		return <div>Loading...</div>;
	};

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
								<AllTrades
									trades={trades}
								/>
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
