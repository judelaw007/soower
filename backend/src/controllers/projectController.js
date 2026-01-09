const prisma = require('../config/database');

// Get all projects (public)
const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, active } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get projects',
      error: error.message,
    });
  }
};

// Get single project
const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: { where: { status: 'ACTIVE' } },
            payments: { where: { status: 'SUCCESS' } },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: { project },
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project',
      error: error.message,
    });
  }
};

// Create project (admin only)
const createProject = async (req, res) => {
  try {
    const { name, description, imageUrl, goalAmount, hasGoal } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        imageUrl,
        goalAmount: hasGoal ? goalAmount : null,
        hasGoal: hasGoal || false,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message,
    });
  }
};

// Update project (admin only)
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, goalAmount, hasGoal, isActive } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        imageUrl,
        goalAmount: hasGoal ? goalAmount : null,
        hasGoal,
        isActive,
      },
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project },
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message,
    });
  }
};

// Delete project (admin only)
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Check for active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: { projectId: id, status: 'ACTIVE' },
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete project with active subscriptions. Deactivate it instead.',
      });
    }

    await prisma.project.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message,
    });
  }
};

// Get project statistics (admin only)
const getProjectStats = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Get statistics
    const [totalDonors, totalPayments, monthlyRevenue, recentPayments] = await Promise.all([
      prisma.subscription.count({
        where: { projectId: id, status: 'ACTIVE' },
      }),
      prisma.payment.aggregate({
        where: { projectId: id, status: 'SUCCESS' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          projectId: id,
          status: 'SUCCESS',
          paidAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: { projectId: id, status: 'SUCCESS' },
        orderBy: { paidAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        project,
        stats: {
          totalDonors,
          totalPayments: totalPayments._count,
          totalAmount: totalPayments._sum.amount || 0,
          monthlyRevenue: monthlyRevenue._sum.amount || 0,
          progressPercentage: project.hasGoal && project.goalAmount
            ? Math.min(100, (parseFloat(project.currentAmount) / parseFloat(project.goalAmount)) * 100).toFixed(1)
            : null,
        },
        recentPayments,
      },
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
};
