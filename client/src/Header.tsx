import React from 'react';
import Dropdown from './Dropdown';
import { User, Token } from './interfaces/Interfaces';

const Header = ({
    user,
    tokens,
    contracts,
    selectToken
}: {
    user: User,
    tokens: Token[],
    contracts: any,
    selectToken(token: Token): void
}) => {
    return (
        <head id='header' className='card'>
            <div className='row'>
                <div className='col-sm-3 flex'>
                    <Dropdown
                        items={tokens.map((token: Token) => ({
                            label: token.ticker,
                            value: token
                        }))}
                        activeItem={{
                            label: user.selectedToken.ticker,
                            value: user.selectedToken
                        }}
                        onSelect={selectToken}
                    />
                </div>
                <div className='col-sm-9'>
                    <h1 className='header-title'>
                        Dex - <span className='contract-address'> Contract Address: <span className='address'>{contracts.dex.options.address} </span></span>
                    </h1>

                </div>
            </div>
        </head>
    );
};

export default Header;