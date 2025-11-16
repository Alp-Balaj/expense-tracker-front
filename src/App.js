import './App.css';
import HomePage from './Pages/HomePage';
import { AuthProvider } from './Authorization/AuthContext'; 

function App() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
}

export default App;
