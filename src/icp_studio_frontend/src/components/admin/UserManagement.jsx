import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { icp_studio_backend } from '../../../../declarations/icp_studio_backend';

const UserManagementContainer = styled.div`
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

const SearchBar = styled.div`
  display: flex;
  gap: 0.5rem;
  max-width: 400px;
`;

const SearchInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  flex: 1;
  
  &:focus {
    border-color: #2196f3;
    outline: none;
  }
`;

const UsersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 1rem;
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #ddd;
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #ddd;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background-color: ${props => props.active ? '#e8f5e9' : '#fff3e0'};
  color: ${props => props.active ? '#2e7d32' : '#ef6c00'};
`;

const ActionButton = styled.button`
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
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ResetButton = styled.button`
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f57c00;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const NoUsersMessage = styled.div`
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
  max-width: 700px;
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

const ProfileSection = styled.div`
  margin-bottom: 2rem;
`;

const ProfileHeader = styled.h3`
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
`;

const ProfileDetail = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  margin-bottom: 0.75rem;
`;

const DetailLabel = styled.div`
  font-weight: 500;
  color: #666;
`;

const DetailValue = styled.div`
  color: #333;
`;

const ProgressSection = styled.div`
  margin-bottom: 2rem;
`;

const ProgressTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const ProgressWrapper = styled.div`
  width: 100%;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: #2196f3;
  width: ${props => props.progress || 0}%;
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

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const PageButton = styled.button`
  background-color: ${props => props.active ? '#2196f3' : 'transparent'};
  color: ${props => props.active ? 'white' : '#333'};
  border: 1px solid ${props => props.active ? '#2196f3' : '#ddd'};
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.active ? '#1976d2' : '#f5f5f5'};
  }
  
  &:disabled {
    background-color: #f5f5f5;
    color: #bbb;
    border-color: #ddd;
    cursor: not-allowed;
  }
`;

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  
  // Fetch all users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const usersList = await icp_studio_backend.getAllUsers();
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(lowercaseSearch) ||
        user.principal.toString().toLowerCase().includes(lowercaseSearch)
      );
      setFilteredUsers(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, users]);
  
  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleViewUser = async (userId) => {
    try {
      setIsLoading(true);
      // Find user in the array
      const user = users.find(u => u.principal.toString() === userId.toString());
      setSelectedUser(user);
      
      // Fetch detailed progress
      const progress = await icp_studio_backend.getMyDetailedProgress(userId);
      setUserProgress(progress);
      
      setModalOpen(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details. Please try again later.');
      setIsLoading(false);
    }
  };
  
  const handleResetModuleProgress = async (userId, moduleId) => {
    if (window.confirm('Are you sure you want to reset this user\'s progress for this module? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        const success = await icp_studio_backend.resetUserModuleProgress(userId, BigInt(moduleId));
        
        if (success) {
          // Refresh user progress
          const progress = await icp_studio_backend.getMyDetailedProgress(userId);
          setUserProgress(progress);
          alert('Module progress has been reset successfully.');
        } else {
          setError('Failed to reset module progress. Please try again later.');
        }
      } catch (err) {
        console.error('Error resetting module progress:', err);
        setError('Failed to reset module progress. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  if (isLoading && users.length === 0) {
    return <LoadingState>Loading users...</LoadingState>;
  }
  
  return (
    <UserManagementContainer>
      <Header>
        <Title>User Management</Title>
        <SearchBar>
          <SearchInput
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </SearchBar>
      </Header>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {filteredUsers.length === 0 ? (
        <NoUsersMessage>
          {searchTerm ? 'No users match your search criteria.' : 'No users registered yet.'}
        </NoUsersMessage>
      ) : (
        <>
          <UsersTable>
            <thead>
              <tr>
                <TableHeader>User ID</TableHeader>
                <TableHeader>Username</TableHeader>
                <TableHeader>Tokens</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Modules Completed</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.principal.toString()}>
                  <TableCell>{user.principal.toString().substring(0, 10)}...</TableCell>
                  <TableCell>{user.username || 'Anonymous'}</TableCell>
                  <TableCell>{user.tokenBalance.toString()}</TableCell>
                  <TableCell>
                    <StatusBadge active={user.completedModules.length > 0}>
                      {user.completedModules.length > 0 ? 'Active' : 'New'}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{user.completedModules.length}</TableCell>
                  <TableCell>
                    <ActionGroup>
                      <ActionButton 
                        onClick={() => handleViewUser(user.principal)}
                        disabled={isLoading}
                      >
                        View Details
                      </ActionButton>
                    </ActionGroup>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </UsersTable>
          
          {totalPages > 1 && (
            <Pagination>
              <PageButton 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </PageButton>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, index, array) => {
                  // Add ellipsis if pages are skipped
                  if (index > 0 && page > array[index - 1] + 1) {
                    return (
                      <React.Fragment key={`ellipsis-${page}`}>
                        <span>...</span>
                        <PageButton 
                          active={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </PageButton>
                      </React.Fragment>
                    );
                  }
                  return (
                    <PageButton 
                      key={page}
                      active={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PageButton>
                  );
                })}
              
              <PageButton 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </PageButton>
            </Pagination>
          )}
        </>
      )}
      
      {modalOpen && selectedUser && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>User Details</ModalTitle>
              <CloseButton onClick={() => setModalOpen(false)}>&times;</CloseButton>
            </ModalHeader>
            
            <ProfileSection>
              <ProfileHeader>Profile Information</ProfileHeader>
              <ProfileDetail>
                <DetailLabel>User ID:</DetailLabel>
                <DetailValue>{selectedUser.principal.toString()}</DetailValue>
              </ProfileDetail>
              <ProfileDetail>
                <DetailLabel>Username:</DetailLabel>
                <DetailValue>{selectedUser.username || 'Anonymous'}</DetailValue>
              </ProfileDetail>
              <ProfileDetail>
                <DetailLabel>Token Balance:</DetailLabel>
                <DetailValue>{selectedUser.tokenBalance.toString()} tokens</DetailValue>
              </ProfileDetail>
              <ProfileDetail>
                <DetailLabel>Modules Completed:</DetailLabel>
                <DetailValue>{selectedUser.completedModules.length}</DetailValue>
              </ProfileDetail>
            </ProfileSection>
            
            <ProgressSection>
              <ProfileHeader>Module Progress</ProfileHeader>
              
              {userProgress ? (
                <ProgressTable>
                  <thead>
                    <tr>
                      <TableHeader>Module</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Score</TableHeader>
                      <TableHeader>Progress</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {userProgress.modules.map((module, index) => (
                      <tr key={index}>
                        <TableCell>{module.title}</TableCell>
                        <TableCell>
                          <StatusBadge active={module.status === 'completed'}>
                            {module.status === 'completed' 
                              ? 'Completed' 
                              : module.status === 'in_progress' 
                                ? 'In Progress' 
                                : 'Not Started'}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          {module.score !== null ? `${module.score}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <ProgressWrapper>
                            <ProgressBar progress={
                              module.status === 'completed' 
                                ? 100 
                                : module.status === 'in_progress' 
                                  ? 50 
                                  : 0
                            } />
                          </ProgressWrapper>
                        </TableCell>
                        <TableCell>
                          {module.status !== 'not_started' && (
                            <ResetButton
                              onClick={() => handleResetModuleProgress(selectedUser.principal, index)}
                              disabled={isLoading}
                            >
                              Reset
                            </ResetButton>
                          )}
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </ProgressTable>
              ) : (
                <LoadingState>Loading progress data...</LoadingState>
              )}
            </ProgressSection>
          </ModalContent>
        </Modal>
      )}
    </UserManagementContainer>
  );
}

export default UserManagement; 