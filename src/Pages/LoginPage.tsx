import { useState } from 'react';
import { LoginForm } from '../Components/UserAuthentication/LoginForm.tsx';
import { SignUpForm } from '../Components/UserAuthentication/SignUpForm.tsx';

function LoginPage() {
  const [isLoginPage, setIsLoginPage] = useState(true);

  const handlePage = () => {
      setIsLoginPage(!isLoginPage);
  };

  return (
    <div className="flex min-h-dvh w-full items-center justify-center overflow-y-auto py-8">
      {isLoginPage ? <LoginForm changePageState={handlePage}/> : <SignUpForm changePageState={handlePage}/>}
    </div>
  )
}

export default LoginPage;