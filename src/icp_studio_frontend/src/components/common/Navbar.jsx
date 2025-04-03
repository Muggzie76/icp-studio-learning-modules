import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const NavbarContainer = styled.nav`
  background-color: #0057b8;
  color: white;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const NavbarContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  text-decoration: none;
  color: white;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: ${props => props.active ? '600' : '400'};
  padding: 0.5rem 0;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: ${props => props.active ? '100%' : '0'};
    height: 2px;
    background-color: white;
    transition: width 0.2s;
  }
  
  &:hover::after {
    width: 100%;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoutButton = styled.button`
  background-color: transparent;
  color: white;
  border: 1px solid white;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const UserName = styled.span`
  font-weight: 500;
`;

const AdminBadge = styled.span`
  background-color: #f44336;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
`;

function Navbar() {
  const { isAuthenticated, isAdmin, principal, logout } = useAuth();
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <NavbarContainer>
      <NavbarContent>
        <Logo to="/">ICP Studio</Logo>
        
        {isAuthenticated && (
          <NavLinks>
            <NavLink to="/" active={isActive('/')}>
              Home
            </NavLink>
            <NavLink to="/learn" active={isActive('/learn') || location.pathname.startsWith('/module/')}>
              Learning Modules
            </NavLink>
            <NavLink to="/profile" active={isActive('/profile')}>
              My Profile
            </NavLink>
            
            {isAdmin && (
              <>
                <NavLink to="/admin" active={isActive('/admin')}>
                  Admin Dashboard
                </NavLink>
                <NavLink to="/admin/modules" active={isActive('/admin/modules')}>
                  Manage Modules
                </NavLink>
                <NavLink to="/admin/users" active={isActive('/admin/users')}>
                  Manage Users
                </NavLink>
                <NavLink to="/admin/admins" active={isActive('/admin/admins')}>
                  Manage Admins
                </NavLink>
              </>
            )}
          </NavLinks>
        )}
        
        {isAuthenticated && (
          <UserSection>
            <UserName>
              {principal?.toString().substring(0, 5)}...
              {isAdmin && <AdminBadge>Admin</AdminBadge>}
            </UserName>
            <LogoutButton onClick={logout}>
              Logout
            </LogoutButton>
          </UserSection>
        )}
      </NavbarContent>
    </NavbarContainer>
  );
}

export default Navbar; 