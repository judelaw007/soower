import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './ManageProjects.css';

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    hasGoal: false,
    goalAmount: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [pagination.page]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll({ page: pagination.page, limit: 10 });
      setProjects(response.data.data.projects);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        imageUrl: project.imageUrl || '',
        hasGoal: project.hasGoal,
        goalAmount: project.goalAmount || '',
        isActive: project.isActive,
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        hasGoal: false,
        goalAmount: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProject(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        ...formData,
        goalAmount: formData.hasGoal ? parseFloat(formData.goalAmount) : null,
      };

      if (editingProject) {
        await projectsAPI.update(editingProject.id, data);
        toast.success('Project updated successfully');
      } else {
        await projectsAPI.create(data);
        toast.success('Project created successfully');
      }

      handleCloseModal();
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="manage-projects">
      <div className="page-header">
        <div>
          <h1>Manage Projects</h1>
          <p>Create and manage donation projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Create Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card empty-state">
          <h3>No projects yet</h3>
          <p>Create your first project to start receiving donations.</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            Create Project
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Goal</th>
                    <th>Raised</th>
                    <th>Donors</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <div className="project-cell">
                          <p className="project-name">{project.name}</p>
                          <p className="project-desc">{project.description.substring(0, 50)}...</p>
                        </div>
                      </td>
                      <td>{project.hasGoal ? formatCurrency(project.goalAmount) : 'No goal'}</td>
                      <td>{formatCurrency(project.currentAmount)}</td>
                      <td>{project._count?.subscriptions || 0}</td>
                      <td>
                        <span className={`badge ${project.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {project.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenModal(project)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(project.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProject ? 'Edit Project' : 'Create Project'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label htmlFor="name">Project Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    className="input"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="imageUrl">Image URL (optional)</label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    className="input"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="input-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="hasGoal"
                      checked={formData.hasGoal}
                      onChange={handleChange}
                    />
                    Set a funding goal
                  </label>
                </div>

                {formData.hasGoal && (
                  <div className="input-group">
                    <label htmlFor="goalAmount">Goal Amount (NGN)</label>
                    <input
                      type="number"
                      id="goalAmount"
                      name="goalAmount"
                      className="input"
                      value={formData.goalAmount}
                      onChange={handleChange}
                      min="0"
                      required={formData.hasGoal}
                    />
                  </div>
                )}

                {editingProject && (
                  <div className="input-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                      />
                      Project is active
                    </label>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProjects;
