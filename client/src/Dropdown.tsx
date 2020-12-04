import React from 'react';
import { DropdownItem } from './interfaces/Interfaces';

const Dropbown = ({
    onSelect,
    activeItem,
    items }: {
        onSelect: any,
        activeItem: DropdownItem,
        items: DropdownItem[]
    }) => {
    const [dropdownVisible, setDropdownVisible] = React.useState<boolean>(false);

    const selectItem = (e: any, item: any) => {
        e.preventDefault();
        setDropdownVisible(!dropdownVisible);
        onSelect(item);
    };

    return (
        <div className={'dropdown ml-3'}>
            <button
                className='btn btn-secondary dropdown-toggle'
                type='button'
                onClick={() => setDropdownVisible(!dropdownVisible)}
            >
                {activeItem.label}
            </button>
            <div className={`dropdown-menu ${dropdownVisible ? 'visible' : ''}`}>
                {items && items.map((item: DropdownItem, i: number) => (
                    <a
                        className={`dropdown-item ${item.value === activeItem.value ? 'active' : null}`}
                        href='/#'
                        key={i}
                        onClick={e => selectItem(e, item.value)}
                    >
                        {item.label}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default Dropbown;