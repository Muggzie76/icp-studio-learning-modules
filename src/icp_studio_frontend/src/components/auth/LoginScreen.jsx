import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../logo2.svg';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f5f5f5;
`;

const LoginCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Logo = styled.img`
  max-width: 200px;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 1.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 2rem;
`;

const LoginButton = styled.button`
  background-color: #0057b8;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #003d82;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

function LoginScreen() {
  const { login, isLoading } = useAuth();

  const handleLogin = () => {
    login();
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo src={logo} alt="ICP Studio Logo" />
        <Title>Welcome to ICP Studio</Title>
        <Subtitle>
          Sign in with Internet Identity to access the learning platform
        </Subtitle>
        <LoginButton 
          onClick={handleLogin} 
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Sign in with Internet Identity'}
        </LoginButton>
      </LoginCard>
    </LoginContainer>
  );
}

export default LoginScreen; 