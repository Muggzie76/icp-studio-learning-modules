import React from 'react';
import styled from 'styled-components';
import Layout from '../components/common/Layout';
import { useAuth } from '../contexts/AuthContext';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2rem;
`;

const WelcomeSection = styled.div`
  margin-top: 2rem;
  max-width: 800px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1000px;
`;

const FeatureCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  text-align: center;
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  color: #333;
  margin: 1rem 0;
`;

const FeatureDescription = styled.p`
  font-size: 1rem;
  color: #666;
`;

const GetStartedButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 2rem;
  font-size: 1.125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;
  
  &:hover {
    background-color: #388e3c;
  }
`;

function HomePage() {
  const { isAdmin } = useAuth();
  
  return (
    <Layout>
      <HomeContainer>
        <WelcomeSection>
          <Title>Welcome to ICP Studio</Title>
          <Subtitle>
            Your interactive learning platform for mastering decentralized application development on the Internet Computer.
          </Subtitle>
          
          {isAdmin ? (
            <GetStartedButton onClick={() => window.location.href = '/admin'}>
              Go to Admin Dashboard
            </GetStartedButton>
          ) : (
            <GetStartedButton onClick={() => window.location.href = '/modules'}>
              Start Learning
            </GetStartedButton>
          )}
        </WelcomeSection>
        
        <FeatureGrid>
          <FeatureCard>
            <FeatureTitle>Interactive Learning</FeatureTitle>
            <FeatureDescription>
              Engage with hands-on exercises and quizzes that reinforce your understanding of Internet Computer concepts.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureTitle>Earn Rewards</FeatureTitle>
            <FeatureDescription>
              Complete modules to earn tokens that demonstrate your expertise and commitment to learning.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureTitle>Track Progress</FeatureTitle>
            <FeatureDescription>
              Monitor your learning journey with detailed progress tracking and achievement milestones.
            </FeatureDescription>
          </FeatureCard>
        </FeatureGrid>
      </HomeContainer>
    </Layout>
  );
}

export default HomePage; 