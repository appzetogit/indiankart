import React from 'react';

const join = (...classes) => classes.filter(Boolean).join(' ');

export const AdminTable = ({
    children,
    shellClassName = '',
    scrollClassName = '',
    tableClassName = '',
}) => (
    <div className={join('bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full max-w-full', shellClassName)}>
        <div
            className={join('overflow-x-auto w-full pb-4 custom-scrollbar', scrollClassName)}
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            <table className={join('w-full text-left border-collapse', tableClassName)}>
                {children}
            </table>
        </div>
    </div>
);

export const AdminTableHead = ({ children, className = '' }) => (
    <thead className={className}>
        {children}
    </thead>
);

export const AdminTableHeaderRow = ({ children, className = '' }) => (
    <tr className={join('bg-slate-900 border-b border-slate-800', className)}>
        {children}
    </tr>
);

export const AdminTableHeaderCell = ({
    children,
    className = '',
    compact = false,
}) => (
    <th
        className={join(
            compact
                ? 'px-3 py-2.5 md:px-4 md:py-3 text-[10px] md:text-[11px]'
                : 'px-4 py-2.5 md:px-5 md:py-3 text-[10px] md:text-xs',
            'font-black text-white uppercase tracking-widest',
            className
        )}
    >
        {children}
    </th>
);

export default AdminTable;
