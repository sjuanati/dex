const Dex = artifacts.require('Dex.sol');

const [UNI, DAI, WETH] = ['UNI', 'DAI', 'WETH']
    .map(ticker => web3.utils.fromAscii(ticker));

module.exports = async (deployer, network) => {

    switch (network) {
        case 'ropsten':
            deployer.deploy(Dex)
                .then(async (DexDeployed) => {
                    await Promise.all([
                        DexDeployed.addToken(UNI, '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'),
                        DexDeployed.addToken(DAI, '0xad6d458402f60fd3bd25163575031acdce07538d'),
                        DexDeployed.addToken(WETH, '0xc778417e063141139fce010982780140aa0cd5ab'),
                    ]);
                });
            break;
        case 'rinkeby':
            deployer.deploy(Dex)
            .then(async (DexDeployed) => {
                await Promise.all([
                    DexDeployed.addToken(UNI, '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'),
                    DexDeployed.addToken(DAI, '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735'),
                    DexDeployed.addToken(WETH, '0xc778417E063141139Fce010982780140Aa0cD5Ab'),
                ]);
            });
        default:
            break;
    };

};

/*
   Ropsten
   ---------------
   > transaction hash:    0x154f4c7e9b98bf39860e1ad250db358557e2e6bcf9df45107954071bad95dfdd
   > Blocks: 0            Seconds: 29
   > contract address:    0x808C893164d95dbF4A805A8Fe47C1fcbC48cB3F8
   > block number:        9252296
   > block timestamp:     1607879194
   > account:             0xb5bE4d2510294d0BA77214F26F704d2956a99072
   > balance:             4.948940075478488939
   > gas used:            2958897 (0x2d2631)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.05917794 ETH
*/

/*
   Rinkeby
   ---------------
   > transaction hash:    0xb46f7662c84fd58cb05fc8abec9bca4f74df6521b2218c6bc35080db90a9cbfe
   > Blocks: 1            Seconds: 5
   > contract address:    0x8903500b2AeA79b4b0E95Bb3f05CCC7E7C946F69
   > block number:        7713885
   > block timestamp:     1607883453
   > account:             0xb5bE4d2510294d0BA77214F26F704d2956a99072
   > balance:             74.81023461
   > gas used:            2958897 (0x2d2631)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.05917794 ETH
*/


// truffle deploy --network ropsten --reset -f 4 --to 4

