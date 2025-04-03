import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const LearningInterface = () => {
  const { actor, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [userProgress, setUserProgress] = useState(null);

  // Fetch modules and user progress
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !actor) return;
      
      try {
        setLoading(true);
        
        // Get available modules
        const availableModules = await actor.getAvailableModules();
        setModules(availableModules);
        
        // Get user progress
        const progressResult = await actor.getMyProgress();
        if ('ok' in progressResult) {
          setUserProgress(progressResult.ok);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching learning data:', err);
        setError('Failed to load learning content. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [actor, isAuthenticated]);

  // Helper to check if module is completed
  const isModuleCompleted = (moduleId) => {
    if (!userProgress) return false;
    return userProgress.completedModules.some(id => id === moduleId);
  };

  // Helper to check if module is available (prerequisites completed)
  const isModuleAvailable = (module) => {
    if (!userProgress) return module.prerequisiteModules.length === 0;
    
    // A module is available if all prerequisites are completed
    return module.prerequisiteModules.every(prereqId => 
      userProgress.completedModules.some(id => id === prereqId)
    );
  };

  // Handle module selection
  const handleModuleSelect = (module) => {
    setSelectedModule(module);
  };

  // Start a module
  const handleStartModule = async (moduleId) => {
    if (!isAuthenticated || !actor) return;
    
    try {
      const result = await actor.startModule(moduleId);
      if ('ok' in result) {
        navigate(`/learn/module/${moduleId}`);
      } else {
        setError('Failed to start module: ' + ('err' in result ? result.err : 'Unknown error'));
      }
    } catch (err) {
      console.error('Error starting module:', err);
      setError('Failed to start module. Please try again.');
    }
  };

  if (loading) {
    return <LoadingContainer>Loading learning content...</LoadingContainer>;
  }

  if (error) {
    return <ErrorContainer>{error}</ErrorContainer>;
  }

  return (
    <Container>
      <ModulesSection>
        <h2>Learning Modules</h2>
        <ModulesList>
          {modules.map((module) => (
            <ModuleCard 
              key={module.id}
              completed={isModuleCompleted(module.id)}
              available={isModuleAvailable(module)}
              onClick={() => handleModuleSelect(module)}
              selected={selectedModule && selectedModule.id === module.id}
            >
              <ModuleTitle>{module.title}</ModuleTitle>
              {isModuleCompleted(module.id) && <CompletedBadge>✓</CompletedBadge>}
              <ModuleDifficulty>
                {module.prerequisiteModules.length === 0 
                  ? 'Beginner' 
                  : module.prerequisiteModules.length < 3 
                    ? 'Intermediate' 
                    : 'Advanced'}
              </ModuleDifficulty>
            </ModuleCard>
          ))}
        </ModulesList>
      </ModulesSection>

      <ContentSection>
        {selectedModule ? (
          <>
            <h2>{selectedModule.title}</h2>
            <ModuleDescription>{selectedModule.description}</ModuleDescription>
            
            <ModuleDetails>
              <DetailItem>
                <DetailLabel>Reward:</DetailLabel>
                <DetailValue>{selectedModule.tokenReward} tokens</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Questions:</DetailLabel>
                <DetailValue>{selectedModule.questions.length}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Content Blocks:</DetailLabel>
                <DetailValue>{selectedModule.content.length}</DetailValue>
              </DetailItem>
              {selectedModule.prerequisiteModules.length > 0 && (
                <DetailItem>
                  <DetailLabel>Prerequisites:</DetailLabel>
                  <DetailValue>
                    {selectedModule.prerequisiteModules.map(id => {
                      const module = modules.find(m => m.id === id);
                      return module ? module.title : `Module ${id}`;
                    }).join(', ')}
                  </DetailValue>
                </DetailItem>
              )}
            </ModuleDetails>
            
            <ButtonContainer>
              {isModuleCompleted(selectedModule.id) ? (
                <Button 
                  onClick={() => navigate(`/learn/module/${selectedModule.id}`)}
                  primary
                >
                  Review Module
                </Button>
              ) : isModuleAvailable(selectedModule) ? (
                <Button 
                  onClick={() => handleStartModule(selectedModule.id)}
                  primary
                >
                  Start Module
                </Button>
              ) : (
                <Button disabled>
                  Complete Prerequisites First
                </Button>
              )}
            </ButtonContainer>
          </>
        ) : (
          <EmptyState>
            <h2>Welcome to ICP Studio</h2>
            <p>Select a module from the list to begin learning.</p>
            <EmptyStateImage src="/logo.svg" alt="ICP Studio Logo" />
          </EmptyState>
        )}
      </ContentSection>

      <ProgressSection>
        <h2>Your Progress</h2>
        {userProgress ? (
          <>
            <ProgressStats>
              <ProgressStat>
                <StatValue>{userProgress.completedModules.length}</StatValue>
                <StatLabel>Modules Completed</StatLabel>
              </ProgressStat>
              <ProgressStat>
                <StatValue>{userProgress.totalTokens}</StatValue>
                <StatLabel>Tokens Earned</StatLabel>
              </ProgressStat>
              <ProgressStat>
                <StatValue>
                  {modules.length > 0 
                    ? Math.round((userProgress.completedModules.length / modules.length) * 100) 
                    : 0}%
                </StatValue>
                <StatLabel>Overall Progress</StatLabel>
              </ProgressStat>
            </ProgressStats>
            
            <ProgressBar>
              <ProgressFill 
                width={modules.length > 0 
                  ? (userProgress.completedModules.length / modules.length) * 100 
                  : 0}
              />
            </ProgressBar>
          </>
        ) : (
          <p>No progress data available.</p>
        )}
      </ProgressSection>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "modules content"
    "progress progress";
  gap: 20px;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "modules"
      "content"
      "progress";
  }
`;

const ModulesSection = styled.div`
  grid-area: modules;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  overflow-y: auto;
  max-height: 600px;
`;

const ContentSection = styled.div`
  grid-area: content;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ProgressSection = styled.div`
  grid-area: progress;
  background-color: #f0f8ff;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
`;

const ModulesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ModuleCard = styled.div`
  position: relative;
  padding: 15px;
  border-radius: 6px;
  background-color: ${props => props.selected ? '#e6f7ff' : '#ffffff'};
  border: 1px solid ${props => props.selected ? '#1890ff' : '#e8e8e8'};
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${props => props.available ? 1 : 0.6};
  
  ${props => props.completed && `
    border-left: 4px solid #52c41a;
  `}
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ModuleTitle = styled.h3`
  margin: 0 0 5px 0;
  font-size: 16px;
`;

const ModuleDifficulty = styled.span`
  display: inline-block;
  font-size: 12px;
  color: #666;
  margin-top: 5px;
`;

const CompletedBadge = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #52c41a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
`;

const ModuleDescription = styled.p`
  margin-bottom: 20px;
  line-height: 1.6;
`;

const ModuleDetails = styled.div`
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
`;

const DetailItem = styled.div`
  display: flex;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  font-weight: 600;
  width: 120px;
`;

const DetailValue = styled.span`
  flex: 1;
`;

const ButtonContainer = styled.div`
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  background-color: ${props => props.primary ? '#1890ff' : '#f5f5f5'};
  color: ${props => props.primary ? '#ffffff' : '#666666'};
  border: 1px solid ${props => props.primary ? '#1890ff' : '#d9d9d9'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover {
    opacity: ${props => props.disabled ? 0.5 : 0.9};
  }
`;

const ProgressStats = styled.div`
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
`;

const ProgressStat = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #666;
`;

const ProgressBar = styled.div`
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.width}%;
  background-color: #1890ff;
  border-radius: 5px;
  transition: width 0.5s ease;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
`;

const EmptyStateImage = styled.img`
  width: 100px;
  margin-top: 20px;
  opacity: 0.5;
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

export default LearningInterface; 