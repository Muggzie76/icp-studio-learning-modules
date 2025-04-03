import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { icp_studio_backend } from '../../../../declarations/icp_studio_backend';

const ModuleManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;
`;

const AddButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #388e3c;
  }
`;

const ModulesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ModuleCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModuleInfo = styled.div`
  flex: 1;
`;

const ModuleTitle = styled.h3`
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const ModuleDescription = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin: 0;
`;

const ModuleActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EditButton = styled.button`
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #1976d2;
  }
`;

const DeleteButton = styled.button`
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #d32f2f;
  }
`;

const NoModulesMessage = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  color: #666;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 2rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background-color: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 1rem;
  color: #333;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    border-color: #2196f3;
    outline: none;
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    border-color: #2196f3;
    outline: none;
  }
`;

const SubmitButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  align-self: flex-end;
  
  &:hover {
    background-color: #388e3c;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

function ModuleManagement() {
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  
  const fetchModules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const modulesList = await icp_studio_backend.getModules();
      setModules(modulesList);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError('Failed to load modules. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchModules();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleAddModule = () => {
    setIsEditing(false);
    setCurrentModuleId(null);
    setFormData({
      title: '',
      description: ''
    });
    setModalOpen(true);
  };
  
  const handleEditModule = (moduleId) => {
    const module = modules[moduleId];
    setIsEditing(true);
    setCurrentModuleId(moduleId);
    setFormData({
      title: module.title,
      description: module.description
    });
    setModalOpen(true);
  };
  
  const handleDeleteModule = async (moduleId) => {
    if (window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        const success = await icp_studio_backend.deleteModule(BigInt(moduleId));
        if (success) {
          await fetchModules();
        } else {
          setError('Failed to delete module. Please try again later.');
        }
      } catch (err) {
        console.error('Error deleting module:', err);
        setError('Failed to delete module. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (isEditing) {
        // Edit existing module
        const success = await icp_studio_backend.editModule(
          BigInt(currentModuleId),
          formData.title,
          formData.description
        );
        
        if (success) {
          setModalOpen(false);
          await fetchModules();
        } else {
          setError('Failed to update module. Please try again later.');
        }
      } else {
        // Add new module
        const moduleId = await icp_studio_backend.addModule(
          formData.title,
          formData.description
        );
        
        if (moduleId !== null) {
          setModalOpen(false);
          await fetchModules();
        } else {
          setError('Failed to create module. Please try again later.');
        }
      }
    } catch (err) {
      console.error('Error saving module:', err);
      setError('Failed to save module. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && modules.length === 0) {
    return <LoadingState>Loading modules...</LoadingState>;
  }
  
  return (
    <ModuleManagementContainer>
      <Header>
        <Title>Module Management</Title>
        <AddButton onClick={handleAddModule}>Add New Module</AddButton>
      </Header>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <ModulesList>
        {modules.length === 0 ? (
          <NoModulesMessage>
            No modules available. Click "Add New Module" to create your first module.
          </NoModulesMessage>
        ) : (
          modules.map((module, index) => (
            <ModuleCard key={index}>
              <ModuleInfo>
                <ModuleTitle>{module.title}</ModuleTitle>
                <ModuleDescription>{module.description}</ModuleDescription>
              </ModuleInfo>
              <ModuleActions>
                <EditButton onClick={() => handleEditModule(index)}>
                  Edit
                </EditButton>
                <DeleteButton onClick={() => handleDeleteModule(index)}>
                  Delete
                </DeleteButton>
              </ModuleActions>
            </ModuleCard>
          ))
        )}
      </ModulesList>
      
      {modalOpen && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {isEditing ? 'Edit Module' : 'Add New Module'}
              </ModalTitle>
              <CloseButton onClick={() => setModalOpen(false)}>&times;</CloseButton>
            </ModalHeader>
            
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="title">Module Title</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="description">Module Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              
              <SubmitButton type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update Module' : 'Create Module'}
              </SubmitButton>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </ModuleManagementContainer>
  );
}

export default ModuleManagement; 