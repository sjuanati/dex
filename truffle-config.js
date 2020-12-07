const path = require('path');
const fs = require('fs');
const provider = require('@truffle/hdwallet-provider');
const secrets = JSON.parse(
	fs.readFileSync('.secrets.json').toString().trim()
);


module.exports = {
	networks: {
		development: {
			host: "127.0.0.1",
			port: 9545,
			network_id: "*",
		},
		ganachina: {
			host: "127.0.0.1",
			port: 7545,
			network_id: "5777",
		},
		kovan: {
			provider: () => new provider(
				secrets.privateKeysKovan,
				`https://kovan.infura.io/v3/${secrets.infuraKey}`,
				0, // from address 0
				3,  // to address 3
			),
			network_id: 42,
		},
		ropsten: {
			provider: () => new provider(
				secrets.privateKeysRopsten,
				`https://ropsten.infura.io/v3/${secrets.infuraKey}`,
				0, // from address 0
				2, // to address 2
			),
			network_id: 3,
		},
	},

	// Set default mocha options here, use special reporters etc.
	mocha: {
		// timeout: 100000
	},

	// Configure your compilers
	compilers: {
		solc: {
			version: "0.6.12",    // Fetch exact version from solc-bin (default: truffle's version)
			// docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
			// settings: {          // See the solidity docs for advice about optimization and evmVersion
			//  optimizer: {
			//    enabled: false,
			//    runs: 200
			//  },
			//  evmVersion: "byzantium"
			// }
		}
	}
};
