import React from 'react';
import GeneralTableList from '../../CustomGeneralComponents/GeneralTableList';
import TableSettings from '../../../Models/TableSettings';

const columns = [
  { header: 'Id', accessor: 'id', type: 'number', filterable: true },
  { header: 'Bank Code', accessor: 'bankCode', type: 'string', filterable: true },
  { header: 'Bank Name', accessor: 'name', type: 'string', filterable: true },
  { header: 'Bank Short Name', accessor: 'shortName', type: 'string', filterable: true },
  { header: 'CBK Code', accessor: 'cbkCode', type: 'string', filterable: true },
];

const expenseTableSettings = new TableSettings({
  columns,
  url: 'api/Expense',
});

const ExpenseList = () => {
  return (
    <div>
      <GeneralTableList title="Expenses" tableSettings={expenseTableSettings} editForm={null}/>
    </div>
  );
};

export default ExpenseList;
