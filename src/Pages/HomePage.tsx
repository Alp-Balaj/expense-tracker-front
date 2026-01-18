import AccountList from "../Components/Lists/AccountList";
import CategoryList from "../Components/Lists/CategoryList";
import CurrencyList from "../Components/Lists/CurrencyList";
import ExpenseList from "../Components/Lists/ExpenseList";
import FutureExpenseList from "../Components/Lists/FutureExpenseList";
import IncomeList from "../Components/Lists/IncomeList";
import SavingList from "../Components/Lists/SavingList";

const HomePage = () => {
  return (
    <div>
      <h1 style={{color: "#fff"}}>Home Page</h1>
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
        <ExpenseList />
        <IncomeList />
        <AccountList />
        <CategoryList />
        <CurrencyList />
        <FutureExpenseList />
        <SavingList />
      </div>
    </div>
  );
}

export default HomePage;