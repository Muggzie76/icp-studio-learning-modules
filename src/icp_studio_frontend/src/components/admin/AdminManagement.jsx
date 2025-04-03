import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { icp_studio_backend } from '../../../../declarations/icp_studio_backend';

const AdminManagementContainer = styled.div`
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

const AdminList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AdminCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AdminInfo = styled.div`
  flex: 1;
`;

const AdminName = styled.h3`
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const AdminId = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin: 0;
  font-family: monospace;
`;

const AdminActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const RemoveButton = styled.button`
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

const NoAdminsMessage = styled.div`
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
  max-width: 500px;
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

const SuccessMessage = styled.div`
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    principalId: '',
    username: ''
  });
  
  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await icp_studio_backend.listAdmins();
      
      if ('ok' in result) {
        setAdmins(result.ok);
      } else if ('err' in result) {
        setError(result.err);
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError('Failed to load administrators. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAdmins();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleAddAdmin = () => {
    setFormData({
      principalId: '',
      username: ''
    });
    setModalOpen(true);
  };
  
  const handleRemoveAdmin = async (adminPrincipal) => {
    if (window.confirm('Are you sure you want to remove this admin? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        
        const result = await icp_studio_backend.removeAdmin(adminPrincipal);
        
        if ('ok' in result) {
          setSuccess('Admin removed successfully.');
          await fetchAdmins();
        } else if ('err' in result) {
          setError(result.err);
        }
      } catch (err) {
        console.error('Error removing admin:', err);
        setError('Failed to remove administrator. Please try again later.');
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
      setSuccess(null);
      
      const principalId = formData.principalId.trim();
      const username = formData.username.trim();
      
      if (!principalId) {
        setError('Principal ID is required.');
        setIsLoading(false);
        return;
      }
      
      if (!username) {
        setError('Username is required.');
        setIsLoading(false);
        return;
      }
      
      // Convert string to Principal type
      try {
        const result = await icp_studio_backend.addAdmin(principalId, username);
        
        if ('ok' in result) {
          setSuccess('Admin added successfully.');
          setModalOpen(false);
          await fetchAdmins();
        } else if ('err' in result) {
          setError(result.err);
        }
      } catch (err) {
        console.error('Error adding admin:', err);
        setError('Failed to add administrator. Please check the Principal ID format.');
      } finally {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error in form submission:', err);
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };
  
  if (isLoading && admins.length === 0) {
    return <LoadingState>Loading administrators...</LoadingState>;
  }
  
  return (
    <AdminManagementContainer>
      <Header>
        <Title>Admin Management</Title>
        <AddButton onClick={handleAddAdmin}>Add New Admin</AddButton>
      </Header>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <AdminList>
        {admins.length === 0 ? (
          <NoAdminsMessage>
            No administrators found. Click "Add New Admin" to create one.
          </NoAdminsMessage>
        ) : (
          admins.map((admin) => (
            <AdminCard key={admin.id.toString()}>
              <AdminInfo>
                <AdminName>{admin.username}</AdminName>
                <AdminId>{admin.id.toString()}</AdminId>
              </AdminInfo>
              <AdminActions>
                <RemoveButton 
                  onClick={() => handleRemoveAdmin(admin.id)}
                  disabled={isLoading}
                >
                  Remove Admin
                </RemoveButton>
              </AdminActions>
            </AdminCard>
          ))
        )}
      </AdminList>
      
      {modalOpen && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Add New Admin</ModalTitle>
              <CloseButton onClick={() => setModalOpen(false)}>&times;</CloseButton>
            </ModalHeader>
            
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="principalId">Principal ID</Label>
                <Input
                  type="text"
                  id="principalId"
                  name="principalId"
                  value={formData.principalId}
                  onChange={handleInputChange}
                  placeholder="e.g. rmmnq-lp6ph-jecfe-unios-34txb-5cwzz-h3uzu-plyvf-ac67t-ooltr-bae"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="username">Username</Label>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Admin Name"
                  required
                />
              </FormGroup>
              
              <SubmitButton type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Admin'}
              </SubmitButton>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </AdminManagementContainer>
  );
}

export default AdminManagement; 