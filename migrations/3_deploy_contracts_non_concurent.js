const Dai = artifacts.require('mocks/Dai.sol');
const Bat = artifacts.require('mocks/Bat.sol');
const Rep = artifacts.require('mocks/Rep.sol');
const Zrx = artifacts.require('mocks/Zrx.sol');
const Dex = artifacts.require('Dex.sol');

const [DAI, BAT, REP, ZRX] = ['DAI', 'BAT', 'REP', 'ZRX']
    .map(ticker => web3.utils.fromAscii(ticker));

const SIDE = {
    BUY: 0,
    SELL: 1
};

module.exports = async (deployer, _network, accounts) => {

    // Get User accounts
    const [trader1, trader2, trader3, _] = accounts;

    // Initialize contracts
    console.log('Deploy Tokens...');
    await Promise.all(
        [Dai, Bat, Rep, Zrx, Dex].map(contract => deployer.deploy(contract))
    );
    const [dai, bat, rep, zrx, dex] = await Promise.all(
        [Dai, Bat, Rep, Zrx, Dex].map(contract => contract.deployed())
    );
    console.log('Add Tokens to DEX...');
    await Promise.all([
        dex.addToken(DAI, dai.address),
        dex.addToken(BAT, bat.address),
        dex.addToken(REP, rep.address),
        dex.addToken(ZRX, zrx.address)
    ]);

    // Set initial balance to traders for all tokens
    const amount = web3.utils.toWei('1000');
    const seedTokenBalance = async (token, trader) => {
        await token.faucet(trader, amount);
        await token.approve(
            dex.address,
            amount,
            { from: trader }
        );
        const ticker = await token.name();
        await dex.deposit(
            amount,
            web3.utils.fromAscii(ticker),
            { from: trader }
        );
    };

    // Set Token balance to Trader 1:
    console.log('Set Token balance to Trader 1...');
    await seedTokenBalance(dai, trader1);
    await seedTokenBalance(bat, trader1);
    await seedTokenBalance(rep, trader1);
    await seedTokenBalance(zrx, trader1);
    // await Promise.all(
    //     [dai, bat, rep, zrx].map(token => seedTokenBalance(token, trader1))
    // );

    // Set Token balance to Trader 2:
    console.log('Set Token balance to Trader 2...');
    await seedTokenBalance(dai, trader2);
    await seedTokenBalance(bat, trader2);
    await seedTokenBalance(rep, trader2);
    await seedTokenBalance(zrx, trader2);
    // await Promise.all(
    //     [dai, bat, rep, zrx].map(token => seedTokenBalance(token, trader2))
    // );

    // Set Token balance to Trader 3:
    console.log('Set Token balance to Trader 3...');
    await seedTokenBalance(dai, trader3);
    await seedTokenBalance(bat, trader3);
    await seedTokenBalance(rep, trader3);
    await seedTokenBalance(zrx, trader3);
    // await Promise.all(
    //     [dai, bat, rep, zrx].map(token => seedTokenBalance(token, trader3))
    // );

    // Increase the blockchain time by N seconds
    console.log('Increase blockchain timestamp...');
    const increaseTime = async (seconds) => {
        await web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [seconds],
            id: 0,
        }, () => { });
        await web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            params: [],
            id: 0,
        }, () => { });
    }

    //create (fake) trades
    console.log('Create initial trades (slot 1/2)...');
    await dex.createLimitOrder(BAT, 1000, 10, SIDE.BUY, { from: trader1 });
    await dex.createMarketOrder(BAT, 1000, SIDE.SELL, { from: trader2 }); // matches with previous
    await increaseTime(1);
    await dex.createLimitOrder(BAT, 1200, 11, SIDE.BUY, { from: trader1 });
    await dex.createMarketOrder(BAT, 1200, SIDE.SELL, { from: trader2 }); // idem and so on
    await increaseTime(1);
    await dex.createLimitOrder(BAT, 1200, 15, SIDE.BUY, { from: trader1 });
    await dex.createMarketOrder(BAT, 1200, SIDE.SELL, { from: trader2 });
    await increaseTime(1);
    await dex.createLimitOrder(BAT, 1500, 14, SIDE.BUY, { from: trader1 });
    await dex.createMarketOrder(BAT, 1500, SIDE.SELL, { from: trader2 });
    await increaseTime(1);
    await dex.createLimitOrder(BAT, 2000, 12, SIDE.BUY, { from: trader1 });
    await dex.createMarketOrder(BAT, 2000, SIDE.SELL, { from: trader2 });

    console.log('Create initial trades (slot 2/2)...');
    await dex.createLimitOrder(REP, 1000, 2, SIDE.BUY, { from: trader1 });
    await dex.createMarketOrder(REP, 1000, SIDE.SELL, { from: trader2 });
    await increaseTime(1);
    await dex.createLimitOrder(REP, 500, 4, SIDE.BUY, { from: trader1 });
    await dex.createMarketOrder(REP, 500, SIDE.SELL, { from: trader2 });
    await increaseTime(1);
    await dex.createLimitOrder(REP, 800, 2, SIDE.BUY, { from: trader1 });
    await dex.createMarketOrder(REP, 800, SIDE.SELL, { from: trader2 });
    await increaseTime(1);
    await dex.createLimitOrder(REP, 1200, 6, SIDE.BUY, { from: trader1 });
    await dex.createMarketOrder(REP, 1200, SIDE.SELL, { from: trader2 });

    //create (fake) orders
    console.log('Create initial orders...');

    await dex.createLimitOrder(BAT, 1400, 10, SIDE.BUY, { from: trader1 });
    await dex.createLimitOrder(BAT, 1200, 11, SIDE.BUY, { from: trader2 });
    await dex.createLimitOrder(BAT, 1000, 12, SIDE.BUY, { from: trader2 });

    await dex.createLimitOrder(REP, 3000, 4, SIDE.BUY, { from: trader1 });
    await dex.createLimitOrder(REP, 2000, 5, SIDE.BUY, { from: trader1 });
    await dex.createLimitOrder(REP, 500, 6, SIDE.BUY, { from: trader2 });

    await dex.createLimitOrder(ZRX, 4000, 12, SIDE.BUY, { from: trader1 });
    await dex.createLimitOrder(ZRX, 3000, 13, SIDE.BUY, { from: trader1 });
    await dex.createLimitOrder(ZRX, 500, 14, SIDE.BUY, { from: trader2 });

    /*
        await Promise.all([
            dex.createLimitOrder(BAT, 1400, 10, SIDE.BUY, { from: trader1 }),
            dex.createLimitOrder(BAT, 1200, 11, SIDE.BUY, { from: trader2 }),
            dex.createLimitOrder(BAT, 1000, 12, SIDE.BUY, { from: trader2 }),
    
            dex.createLimitOrder(REP, 3000, 4, SIDE.BUY, { from: trader1 }),
            dex.createLimitOrder(REP, 2000, 5, SIDE.BUY, { from: trader1 }),
            dex.createLimitOrder(REP, 500, 6, SIDE.BUY, { from: trader2 }),
    
            dex.createLimitOrder(ZRX, 4000, 12, SIDE.BUY, { from: trader1 }),
            dex.createLimitOrder(ZRX, 3000, 13, SIDE.BUY, { from: trader1 }),
            dex.createLimitOrder(ZRX, 500, 14, SIDE.BUY, { from: trader2 }),
    
            dex.createLimitOrder(BAT, 2000, 16, SIDE.SELL, { from: trader3 }),
            dex.createLimitOrder(BAT, 3000, 15, SIDE.SELL, { from: trader4 }),
            dex.createLimitOrder(BAT, 500, 14, SIDE.SELL, { from: trader4 }),
    
            dex.createLimitOrder(REP, 4000, 10, SIDE.SELL, { from: trader3 }),
            dex.createLimitOrder(REP, 2000, 9, SIDE.SELL, { from: trader3 }),
            dex.createLimitOrder(REP, 800, 8, SIDE.SELL, { from: trader4 }),
    
            dex.createLimitOrder(ZRX, 1500, 23, SIDE.SELL, { from: trader3 }),
            dex.createLimitOrder(ZRX, 1200, 22, SIDE.SELL, { from: trader3 }),
            dex.createLimitOrder(ZRX, 900, 21, SIDE.SELL, { from: trader4 }),
        ]);
    */
}
