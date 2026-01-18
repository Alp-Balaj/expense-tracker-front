import { useState } from 'react';
import LoginForm from '../Components/LoginForm.tsx';
import SignUpForm from '../Components/SignUpForm.tsx';
import styled from 'styled-components';

const LoginPageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

function LoginPage() {
  const [isLoginPage, setIsLoginPage] = useState(true);

  const handlePage = () => {
      setIsLoginPage(!isLoginPage);
  };

  return (
    <LoginPageContainer>
      {isLoginPage ? <LoginForm changePageState={handlePage}/> : <SignUpForm changePageState={handlePage}/>}
    </LoginPageContainer>
  )
}

export default LoginPage;