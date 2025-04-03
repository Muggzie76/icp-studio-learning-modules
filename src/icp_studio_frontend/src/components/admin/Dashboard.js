import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { icp_studio_backend } from '../../../../declarations/icp_studio_backend';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
`;

const StatCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const StatTitle = styled.h3`
  font-size: 1rem;
  color: #666;
  margin: 0 0 0.5rem 0;
`;

const StatValue = styled.p`
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const StatSubtext = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin: 0.5rem 0 0 0;
`;

const ModulesSection = styled.div`
  margin-top: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 1rem 0;
`;

const ModuleTable = styled.table`
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

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1rem;
  color: #666;
`;

const ErrorState = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [moduleStats, setModuleStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch overall user stats
        const userStats = await icp_studio_backend.getUserCompletionStats();
        
        // Fetch modules and their stats
        const modules = await icp_studio_backend.getModules();
        
        // Create an array of promises for module statistics
        const statsPromises = modules.map(async (module, index) => {
          const stats = await icp_studio_backend.getModuleStatistics(BigInt(index));
          return {
            id: index,
            title: module.title,
            ...stats
          };
        });
        
        // Resolve all promises
        const moduleStatsData = await Promise.all(statsPromises);
        
        setStats(userStats);
        setModuleStats(moduleStatsData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingState>Loading dashboard data...</LoadingState>;
  }

  if (error) {
    return <ErrorState>{error}</ErrorState>;
  }

  return (
    <DashboardContainer>
      <DashboardHeader>
        <Title>Admin Dashboard</Title>
      </DashboardHeader>

      <StatsGrid>
        <StatCard>
          <StatTitle>Total Users</StatTitle>
          <StatValue>{stats?.totalUsers.toString()}</StatValue>
        </StatCard>
        
        <StatCard>
          <StatTitle>Active Users</StatTitle>
          <StatValue>{stats?.activeUsers.toString()}</StatValue>
          <StatSubtext>Users who have started at least one module</StatSubtext>
        </StatCard>
        
        <StatCard>
          <StatTitle>Module Completions</StatTitle>
          <StatValue>{stats?.completedModules.toString()}</StatValue>
          <StatSubtext>Total modules completed by all users</StatSubtext>
        </StatCard>
        
        <StatCard>
          <StatTitle>Completion Rate</StatTitle>
          <StatValue>
            {stats && stats.activeUsers > 0 
              ? `${Math.round((Number(stats.completedModules) / Number(stats.activeUsers)) * 100)}%`
              : '0%'
            }
          </StatValue>
          <StatSubtext>Average modules completed per active user</StatSubtext>
        </StatCard>
      </StatsGrid>

      <ModulesSection>
        <SectionTitle>Module Performance</SectionTitle>
        
        <ModuleTable>
          <thead>
            <tr>
              <TableHeader>Module Title</TableHeader>
              <TableHeader>Started</TableHeader>
              <TableHeader>Completed</TableHeader>
              <TableHeader>Completion Rate</TableHeader>
              <TableHeader>Avg. Score</TableHeader>
            </tr>
          </thead>
          <tbody>
            {moduleStats.map((module) => (
              <tr key={module.id}>
                <TableCell>{module.title}</TableCell>
                <TableCell>{module.usersStarted.toString()}</TableCell>
                <TableCell>{module.usersCompleted.toString()}</TableCell>
                <TableCell>
                  {module.usersStarted > 0 
                    ? `${Math.round((Number(module.usersCompleted) / Number(module.usersStarted)) * 100)}%`
                    : '0%'
                  }
                </TableCell>
                <TableCell>
                  {module.averageScore ? `${module.averageScore.toFixed(1)}%` : 'N/A'}
                </TableCell>
              </tr>
            ))}
            {moduleStats.length === 0 && (
              <tr>
                <TableCell colSpan={5} style={{ textAlign: 'center' }}>
                  No modules available
                </TableCell>
              </tr>
            )}
          </tbody>
        </ModuleTable>
      </ModulesSection>
    </DashboardContainer>
  );
}

export default AdminDashboard; 