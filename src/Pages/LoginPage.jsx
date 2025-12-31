import LoginForm from '../Components/LoginForm';
import styled from 'styled-components';

const LoginPageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

function LoginPage() {
  console.log("Rendering LoginPage");

  return (
    <LoginPageContainer>
      <LoginForm />
    </LoginPageContainer>
  )
}

export default LoginPage;