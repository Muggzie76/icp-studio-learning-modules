import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext.jsx';

const ModuleContent = () => {
  const { moduleId } = useParams();
  const { actor, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [module, setModule] = useState(null);
  const [content, setContent] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  
  // Fetch module data
  useEffect(() => {
    const fetchModuleData = async () => {
      if (!isAuthenticated || !actor || !moduleId) return;
      
      try {
        setLoading(true);
        
        // Get module details
        const moduleData = await actor.getModule(Number(moduleId));
        if (!moduleData) {
          setError('Module not found');
          setLoading(false);
          return;
        }
        
        setModule(moduleData);
        
        // Get module content
        const contentResult = await actor.getModuleContent(Number(moduleId));
        if ('ok' in contentResult) {
          setContent(contentResult.ok);
        }
        
        // Get module questions
        const questionsResult = await actor.getModuleQuestions(Number(moduleId));
        if ('ok' in questionsResult) {
          setQuestions(questionsResult.ok);
          
          // Initialize answers state
          const initialAnswers = {};
          questionsResult.ok.forEach(question => {
            initialAnswers[question.id] = null;
          });
          setAnswers(initialAnswers);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching module data:', err);
        setError('Failed to load module content. Please try again.');
        setLoading(false);
      }
    };
    
    fetchModuleData();
  }, [actor, isAuthenticated, moduleId]);
  
  // Handle navigation between content blocks
  const handleNextContent = () => {
    if (currentContentIndex < content.length - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
    } else {
      // Show quiz when reached the end of content
      setShowQuiz(true);
    }
  };
  
  const handlePrevContent = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(currentContentIndex - 1);
    }
  };
  
  // Handle quiz answer selection
  const handleAnswerSelect = (questionId, optionId) => {
    setAnswers({
      ...answers,
      [questionId]: optionId
    });
  };
  
  // Submit quiz answers
  const handleSubmitQuiz = async () => {
    if (!isAuthenticated || !actor) return;
    
    // Check if all questions are answered
    const allAnswered = questions.every(question => answers[question.id] !== null);
    
    if (!allAnswered) {
      setError('Please answer all questions before submitting.');
      return;
    }
    
    try {
      // Format answers for submission
      const answersArray = Object.entries(answers).map(([questionId, optionId]) => [
        Number(questionId),
        Number(optionId)
      ]);
      
      const result = await actor.submitQuizAnswers(Number(moduleId), answersArray);
      setQuizSubmitted(true);
      
      if ('ok' in result) {
        setQuizResult({
          passed: result.ok > 0,
          tokensEarned: result.ok
        });
      } else {
        setQuizResult({
          passed: false,
          error: 'err' in result ? result.err : 'Failed to submit quiz'
        });
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setQuizSubmitted(true);
      setQuizResult({
        passed: false,
        error: 'An error occurred while submitting your answers.'
      });
    }
  };
  
  // Render content based on its type
  const renderContent = (contentBlock) => {
    switch (contentBlock.contentType[0]) {
      case 'Text':
        return <TextContent>{contentBlock.contentType[1]}</TextContent>;
      case 'Image':
        return <ImageContent src={contentBlock.contentType[1]} alt="Module content" />;
      case 'Video':
        return (
          <VideoContainer>
            <iframe 
              src={contentBlock.contentType[1]} 
              title="Module video content"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          </VideoContainer>
        );
      case 'Code':
        return <CodeContent>{contentBlock.contentType[1]}</CodeContent>;
      default:
        return <p>Unknown content type</p>;
    }
  };
  
  if (loading) {
    return <LoadingContainer>Loading module content...</LoadingContainer>;
  }
  
  if (error) {
    return <ErrorContainer>{error}</ErrorContainer>;
  }
  
  if (!module) {
    return <ErrorContainer>Module not found</ErrorContainer>;
  }
  
  return (
    <Container>
      <Header>
        <HeaderTitle>{module.title}</HeaderTitle>
        <BackButton onClick={() => navigate('/learn')}>Back to Modules</BackButton>
      </Header>
      
      <ProgressBar>
        {content.map((_, index) => (
          <ProgressDot 
            key={index}
            active={index === currentContentIndex}
            completed={index < currentContentIndex}
            onClick={() => !showQuiz && setCurrentContentIndex(index)}
          />
        ))}
        <ProgressDot 
          active={showQuiz}
          completed={quizSubmitted}
          onClick={() => content.length > 0 && setShowQuiz(true)}
        />
      </ProgressBar>
      
      <ContentContainer>
        {!showQuiz ? (
          content.length > 0 ? (
            <>
              <ContentBlock>
                {renderContent(content[currentContentIndex])}
              </ContentBlock>
              
              <NavigationButtons>
                <NavButton 
                  onClick={handlePrevContent}
                  disabled={currentContentIndex === 0}
                >
                  Previous
                </NavButton>
                <NavButton 
                  primary
                  onClick={handleNextContent}
                >
                  {currentContentIndex < content.length - 1 ? 'Next' : 'Go to Quiz'}
                </NavButton>
              </NavigationButtons>
            </>
          ) : (
            <EmptyContent>
              <h3>No content available for this module</h3>
              <NavButton primary onClick={() => setShowQuiz(true)}>
                Skip to Quiz
              </NavButton>
            </EmptyContent>
          )
        ) : (
          <QuizContainer>
            <h2>Module Quiz</h2>
            
            {!quizSubmitted ? (
              <>
                <p>Answer all questions to complete this module.</p>
                
                {questions.length > 0 ? (
                  <>
                    {questions.map((question, index) => (
                      <QuestionCard key={question.id}>
                        <QuestionNumber>Question {index + 1}</QuestionNumber>
                        <QuestionText>{question.text}</QuestionText>
                        
                        <OptionsContainer>
                          {question.options.map((option) => (
                            <OptionLabel 
                              key={option.id}
                              selected={answers[question.id] === option.id}
                            >
                              <OptionInput
                                type="radio"
                                name={`question-${question.id}`}
                                checked={answers[question.id] === option.id}
                                onChange={() => handleAnswerSelect(question.id, option.id)}
                              />
                              <OptionText>{option.text}</OptionText>
                            </OptionLabel>
                          ))}
                        </OptionsContainer>
                      </QuestionCard>
                    ))}
                    
                    <SubmitButtonContainer>
                      <NavButton onClick={() => setShowQuiz(false)}>
                        Back to Content
                      </NavButton>
                      <NavButton 
                        primary 
                        onClick={handleSubmitQuiz}
                      >
                        Submit Answers
                      </NavButton>
                    </SubmitButtonContainer>
                  </>
                ) : (
                  <EmptyContent>
                    <h3>No questions available for this module</h3>
                    <NavButton primary onClick={() => navigate('/learn')}>
                      Return to Modules
                    </NavButton>
                  </EmptyContent>
                )}
              </>
            ) : (
              <ResultsContainer>
                {quizResult && (
                  <>
                    {quizResult.passed ? (
                      <>
                        <ResultHeader success>
                          <ResultIcon>✓</ResultIcon>
                          <h2>Module Completed!</h2>
                        </ResultHeader>
                        
                        <ResultDetails>
                          <p>Congratulations! You have successfully completed this module.</p>
                          <TokensEarned>
                            <TokenIcon>🏆</TokenIcon>
                            <TokenAmount>+{quizResult.tokensEarned} tokens earned</TokenAmount>
                          </TokensEarned>
                        </ResultDetails>
                      </>
                    ) : (
                      <>
                        <ResultHeader>
                          <ResultIcon error>✗</ResultIcon>
                          <h2>Not Quite There Yet</h2>
                        </ResultHeader>
                        
                        <ResultDetails>
                          <p>
                            {quizResult.error || 
                              "You didn't pass the quiz. Review the module content and try again."}
                          </p>
                        </ResultDetails>
                      </>
                    )}
                    
                    <ButtonContainer>
                      <NavButton 
                        onClick={() => {
                          setQuizSubmitted(false);
                          setShowQuiz(false);
                          setCurrentContentIndex(0);
                        }}
                      >
                        Review Module
                      </NavButton>
                      <NavButton 
                        primary
                        onClick={() => navigate('/learn')}
                      >
                        Back to Modules
                      </NavButton>
                    </ButtonContainer>
                  </>
                )}
              </ResultsContainer>
            )}
          </QuizContainer>
        )}
      </ContentContainer>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 24px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ProgressBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #e8e8e8;
    z-index: 0;
  }
`;

const ProgressDot = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#1890ff' : props.completed ? '#52c41a' : '#e8e8e8'};
  border: 2px solid ${props => props.active ? '#1890ff' : props.completed ? '#52c41a' : '#d9d9d9'};
  z-index: 1;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.2);
  }
`;

const ContentContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
  min-height: 400px;
`;

const ContentBlock = styled.div`
  margin-bottom: 30px;
`;

const TextContent = styled.div`
  line-height: 1.6;
  font-size: 16px;
  white-space: pre-wrap;
`;

const ImageContent = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  display: block;
  margin: 0 auto;
`;

const VideoContainer = styled.div`
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  
  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 4px;
  }
`;

const CodeContent = styled.pre`
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  line-height: 1.5;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`;

const NavButton = styled.button`
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
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

const EmptyContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  color: #666;
`;

const QuizContainer = styled.div`
  h2 {
    margin-top: 0;
    margin-bottom: 20px;
  }
`;

const QuestionCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const QuestionNumber = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;

const QuestionText = styled.div`
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 15px;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OptionLabel = styled.label`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-radius: 4px;
  border: 1px solid ${props => props.selected ? '#1890ff' : '#d9d9d9'};
  background-color: ${props => props.selected ? '#e6f7ff' : '#ffffff'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.selected ? '#e6f7ff' : '#f5f5f5'};
  }
`;

const OptionInput = styled.input`
  margin-right: 10px;
`;

const OptionText = styled.span`
  flex: 1;
`;

const SubmitButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`;

const ResultsContainer = styled.div`
  padding: 20px;
  text-align: center;
`;

const ResultHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  color: ${props => props.success ? '#52c41a' : '#ff4d4f'};
`;

const ResultIcon = styled.div`
  font-size: 48px;
  margin-bottom: 10px;
  color: ${props => props.error ? '#ff4d4f' : '#52c41a'};
`;

const ResultDetails = styled.div`
  margin-bottom: 30px;
`;

const TokensEarned = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  padding: 15px;
  background-color: #fffbe6;
  border-radius: 8px;
  border: 1px solid #ffe58f;
`;

const TokenIcon = styled.span`
  font-size: 24px;
  margin-right: 10px;
`;

const TokenAmount = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #faad14;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
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

export default ModuleContent; 