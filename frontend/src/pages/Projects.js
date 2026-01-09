import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import Navbar from '../components/layouts/Navbar';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    fetchProjects();
  }, [pagination.page]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll({
        page: pagination.page,
        limit: 12,
        active: true,
      });
      setProjects(response.data.data.projects);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProgress = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(100, (parseFloat(current) / parseFloat(goal)) * 100);
  };

  if (loading) {
    return (
      <div className="projects-page">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <Navbar />

      <div className="projects-header">
        <div className="container">
          <h1>Support Our Projects</h1>
          <p>Choose a project to support with your recurring donation</p>
        </div>
      </div>

      <div className="container projects-container">
        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>No Projects Yet</h3>
            <p>Check back later for projects to support.</p>
          </div>
        ) : (
          <>
            <div className="projects-grid">
              {projects.map((project) => (
                <Link to={`/projects/${project.id}`} key={project.id} className="project-card">
                  <div className="project-image">
                    {project.imageUrl ? (
                      <img src={project.imageUrl} alt={project.name} />
                    ) : (
                      <div className="project-placeholder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="project-content">
                    <h3>{project.name}</h3>
                    <p className="project-description">{project.description}</p>

                    {project.hasGoal && (
                      <div className="project-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${calculateProgress(project.currentAmount, project.goalAmount)}%` }}
                          ></div>
                        </div>
                        <div className="progress-info">
                          <span>{formatCurrency(project.currentAmount)} raised</span>
                          <span>of {formatCurrency(project.goalAmount)}</span>
                        </div>
                      </div>
                    )}

                    <div className="project-stats">
                      <span className="stat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        {project._count?.subscriptions || 0} donors
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  Previous
                </button>
                <span>Page {pagination.page} of {pagination.pages}</span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Projects;
