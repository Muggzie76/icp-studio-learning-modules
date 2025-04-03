import React, { useState } from 'react';
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

const MobileMenuToggle = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  
  @media (max-width: 768px) {
    display: block;
  }
  
  span {
    display: block;
    width: 25px;
    height: 3px;
    margin: 5px auto;
    background-color: white;
    transition: all 0.3s ease;
    
    &:nth-child(1) {
      transform: ${props => props.isOpen ? 'translateY(8px) rotate(45deg)' : 'none'};
    }
    
    &:nth-child(2) {
      opacity: ${props => props.isOpen ? 0 : 1};
    }
    
    &:nth-child(3) {
      transform: ${props => props.isOpen ? 'translateY(-8px) rotate(-45deg)' : 'none'};
    }
  }
`;

const DesktopNavLinks = styled(NavLinks)`
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenu = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: #0057b8;
    z-index: 1000;
    padding: 20px;
  }
`;

const MobileMenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const MobileMenuClose = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
`;

const MobileNavLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const MobileNavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: ${props => props.active ? '600' : '400'};
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  
  &:last-child {
    border-bottom: none;
  }
`;

function Navbar() {
  const { isAuthenticated, isAdmin, principal, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  return (
    <NavbarContainer>
      <NavbarContent>
        <Logo to="/">ICP Studio</Logo>
        
        {isAuthenticated && (
          <>
            <DesktopNavLinks>
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
            </DesktopNavLinks>
            
            <MobileMenuToggle onClick={toggleMobileMenu} isOpen={mobileMenuOpen}>
              <span></span>
              <span></span>
              <span></span>
            </MobileMenuToggle>
            
            <MobileMenu isOpen={mobileMenuOpen}>
              <MobileMenuHeader>
                <Logo to="/" onClick={closeMobileMenu}>ICP Studio</Logo>
                <MobileMenuClose onClick={closeMobileMenu}>✕</MobileMenuClose>
              </MobileMenuHeader>
              
              <MobileNavLinks>
                <MobileNavLink to="/" active={isActive('/')} onClick={closeMobileMenu}>
                  Home
                </MobileNavLink>
                <MobileNavLink 
                  to="/learn" 
                  active={isActive('/learn') || location.pathname.startsWith('/module/')}
                  onClick={closeMobileMenu}
                >
                  Learning Modules
                </MobileNavLink>
                <MobileNavLink to="/profile" active={isActive('/profile')} onClick={closeMobileMenu}>
                  My Profile
                </MobileNavLink>
                
                {isAdmin && (
                  <>
                    <MobileNavLink to="/admin" active={isActive('/admin')} onClick={closeMobileMenu}>
                      Admin Dashboard
                    </MobileNavLink>
                    <MobileNavLink to="/admin/modules" active={isActive('/admin/modules')} onClick={closeMobileMenu}>
                      Manage Modules
                    </MobileNavLink>
                    <MobileNavLink to="/admin/users" active={isActive('/admin/users')} onClick={closeMobileMenu}>
                      Manage Users
                    </MobileNavLink>
                    <MobileNavLink to="/admin/admins" active={isActive('/admin/admins')} onClick={closeMobileMenu}>
                      Manage Admins
                    </MobileNavLink>
                  </>
                )}
                
                <UserSection>
                  <UserName>
                    {principal?.toString().substring(0, 5)}...
                    {isAdmin && <AdminBadge>Admin</AdminBadge>}
                  </UserName>
                  <LogoutButton onClick={() => { logout(); closeMobileMenu(); }}>
                    Logout
                  </LogoutButton>
                </UserSection>
              </MobileNavLinks>
            </MobileMenu>
          </>
        )}
        
        {isAuthenticated && (
          <UserSection className="d-none d-md-flex">
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