import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext.jsx';

const UserProfile = () => {
  const { actor, isAuthenticated, principal } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [modules, setModules] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || !actor) return;
      
      try {
        setLoading(true);
        
        // Fetch user profile data
        const profileResult = await actor.getMyProfile();
        if ('ok' in profileResult) {
          setUserProfile(profileResult.ok);
        } else {
          setError('Failed to load user profile');
        }
        
        // Fetch available modules for reference
        const modulesData = await actor.getAvailableModules();
        setModules(modulesData);
        
        // Fetch user achievements
        const achievementsResult = await actor.getUserAchievements(principal);
        if ('ok' in achievementsResult) {
          setAchievements(achievementsResult.ok);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [actor, isAuthenticated, principal]);
  
  // Calculate completion percentage
  const calculateProgress = () => {
    if (!userProfile || !modules || modules.length === 0) return 0;
    return Math.round((userProfile.completedModules.length / modules.length) * 100);
  };
  
  if (loading) {
    return <LoadingContainer>Loading profile data...</LoadingContainer>;
  }
  
  if (error) {
    return <ErrorContainer>{error}</ErrorContainer>;
  }
  
  if (!userProfile) {
    return <ErrorContainer>User profile not found</ErrorContainer>;
  }
  
  return (
    <Container>
      <ProfileHeader>
        <ProfileAvatar>
          {principal && principal.toString().substring(0, 2).toUpperCase()}
        </ProfileAvatar>
        <ProfileInfo>
          <ProfileName>{userProfile.username || 'User'}</ProfileName>
          <ProfileId>Principal ID: {principal?.toString().substring(0, 10)}...</ProfileId>
          <ProfileJoined>Joined: {new Date(userProfile.registrationDate / 1000000).toLocaleDateString()}</ProfileJoined>
        </ProfileInfo>
      </ProfileHeader>
      
      <Section>
        <SectionTitle>Progress Overview</SectionTitle>
        <ProgressStats>
          <StatCard>
            <StatValue>{userProfile.completedModules.length}</StatValue>
            <StatLabel>Modules Completed</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{calculateProgress()}%</StatValue>
            <StatLabel>Overall Progress</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue highlight>{userProfile.totalTokens}</StatValue>
            <StatLabel>Tokens Earned</StatLabel>
          </StatCard>
        </ProgressStats>
        
        <ProgressBarTitle>Learning Progress</ProgressBarTitle>
        <ProgressBarContainer>
          <ProgressBar width={calculateProgress()} />
          <ProgressPercentage>{calculateProgress()}%</ProgressPercentage>
        </ProgressBarContainer>
      </Section>
      
      <Section>
        <SectionTitle>Completed Modules</SectionTitle>
        {userProfile.completedModules.length > 0 ? (
          <ModulesList>
            {userProfile.completedModules.map(moduleId => {
              const module = modules.find(m => m.id === moduleId);
              return module ? (
                <ModuleItem key={moduleId}>
                  <ModuleTitle>{module.title}</ModuleTitle>
                  <ModuleCompletion>
                    <CompletionIcon>✓</CompletionIcon>
                    Completed
                  </ModuleCompletion>
                </ModuleItem>
              ) : null;
            })}
          </ModulesList>
        ) : (
          <EmptyState>You haven't completed any modules yet. Start learning to track your progress!</EmptyState>
        )}
      </Section>
      
      <Section>
        <SectionTitle>Achievements</SectionTitle>
        {achievements.length > 0 ? (
          <AchievementGrid>
            {achievements.map((achievement, index) => (
              <AchievementCard key={index}>
                <AchievementIcon>{achievement.icon || '🏆'}</AchievementIcon>
                <AchievementTitle>{achievement.title}</AchievementTitle>
                <AchievementDescription>{achievement.description}</AchievementDescription>
                <AchievementDate>
                  Earned on {new Date(achievement.dateEarned / 1000000).toLocaleDateString()}
                </AchievementDate>
              </AchievementCard>
            ))}
          </AchievementGrid>
        ) : (
          <EmptyState>Complete modules and quizzes to earn achievements!</EmptyState>
        )}
      </Section>
      
      <Section>
        <SectionTitle>Token Balance</SectionTitle>
        <TokenContainer>
          <TokenBalance>
            <TokenIcon>🪙</TokenIcon>
            <TokenAmount>{userProfile.totalTokens}</TokenAmount>
            <TokenLabel>ICP Studio Tokens</TokenLabel>
          </TokenBalance>
          <TokenInfo>
            Tokens are earned by completing modules and quizzes. They represent your progress and expertise in Internet Computer development.
          </TokenInfo>
        </TokenContainer>
      </Section>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 20px;
  color: #ff4d4f;
  background-color: #fff1f0;
  border-radius: 8px;
  margin: 20px 0;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  background-color: #f0f8ff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ProfileAvatar = styled.div`
  width: 80px;
  height: 80px;
  background-color: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  margin-right: 20px;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileName = styled.h1`
  margin: 0 0 5px 0;
  font-size: 24px;
`;

const ProfileId = styled.div`
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
`;

const ProfileJoined = styled.div`
  color: #666;
  font-size: 14px;
`;

const Section = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
  color: #1890ff;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
`;

const ProgressStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
  }
`;

const StatCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  flex: 1;
  margin: 0 10px;

  &:first-child {
    margin-left: 0;
  }

  &:last-child {
    margin-right: 0;
  }

  @media (max-width: 768px) {
    margin: 0;
  }
`;

const StatValue = styled.div`
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 5px;
  color: ${props => props.highlight ? '#faad14' : '#1890ff'};
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 14px;
`;

const ProgressBarTitle = styled.div`
  font-weight: 500;
  margin-bottom: 10px;
`;

const ProgressBarContainer = styled.div`
  height: 24px;
  background-color: #f0f0f0;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  width: ${props => props.width}%;
  background-color: #1890ff;
  border-radius: 12px;
  transition: width 0.3s ease;
`;

const ProgressPercentage = styled.div`
  position: absolute;
  top: 0;
  right: 10px;
  line-height: 24px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
`;

const ModulesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ModuleItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #52c41a;
`;

const ModuleTitle = styled.div`
  font-weight: 500;
`;

const ModuleCompletion = styled.div`
  display: flex;
  align-items: center;
  color: #52c41a;
  font-size: 14px;
  font-weight: 500;
`;

const CompletionIcon = styled.span`
  margin-right: 5px;
`;

const AchievementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
`;

const AchievementCard = styled.div`
  background-color: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  }
`;

const AchievementIcon = styled.div`
  font-size: 40px;
  margin-bottom: 10px;
`;

const AchievementTitle = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
`;

const AchievementDescription = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
`;

const AchievementDate = styled.div`
  font-size: 12px;
  color: #999;
`;

const TokenContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }
`;

const TokenBalance = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  background-color: #fffbe6;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #ffe58f;
  min-width: 180px;
`;

const TokenIcon = styled.div`
  font-size: 40px;
  margin-bottom: 10px;
`;

const TokenAmount = styled.div`
  font-size: 36px;
  font-weight: bold;
  color: #faad14;
  margin-bottom: 5px;
`;

const TokenLabel = styled.div`
  font-size: 14px;
  color: #666;
`;

const TokenInfo = styled.div`
  flex: 1;
  padding: 0 20px;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px;
  color: #666;
  font-style: italic;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

export default UserProfile; 