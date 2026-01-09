const prisma = require('../config/database');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get various statistics in parallel
    const [
      totalDonors,
      totalProjects,
      activeSubscriptions,
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      recentPayments,
      recentDonors,
      projectStats,
    ] = await Promise.all([
      // Total donors
      prisma.user.count({ where: { role: 'DONOR' } }),

      // Total projects
      prisma.project.count(),

      // Active subscriptions
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),

      // Total revenue
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),

      // This month's revenue
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      // Last month's revenue
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),

      // Recent payments
      prisma.payment.findMany({
        where: { status: 'SUCCESS' },
        orderBy: { paidAt: 'desc' },
        take: 10,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          project: { select: { name: true } },
        },
      }),

      // Recent donors
      prisma.user.findMany({
        where: { role: 'DONOR' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          _count: { select: { subscriptions: true } },
        },
      }),

      // Project statistics
      prisma.project.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          currentAmount: true,
          goalAmount: true,
          hasGoal: true,
          _count: {
            select: {
              subscriptions: { where: { status: 'ACTIVE' } },
            },
          },
        },
      }),
    ]);

    // Calculate growth percentage
    const currentMonthAmount = monthlyRevenue._sum.amount || 0;
    const lastMonthAmount = lastMonthRevenue._sum.amount || 0;
    const growthPercentage = lastMonthAmount > 0
      ? (((currentMonthAmount - lastMonthAmount) / lastMonthAmount) * 100).toFixed(1)
      : currentMonthAmount > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalDonors,
          totalProjects,
          activeSubscriptions,
          totalRevenue: totalRevenue._sum.amount || 0,
          monthlyRevenue: currentMonthAmount,
          lastMonthRevenue: lastMonthAmount,
          growthPercentage: parseFloat(growthPercentage),
        },
        recentPayments,
        recentDonors,
        projectStats,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message,
    });
  }
};

// Get all donors
const getDonors = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { role: 'DONOR' };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [donors, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              subscriptions: true,
              payments: { where: { status: 'SUCCESS' } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Get total donated amount for each donor
    const donorsWithTotals = await Promise.all(
      donors.map(async (donor) => {
        const totalDonated = await prisma.payment.aggregate({
          where: { userId: donor.id, status: 'SUCCESS' },
          _sum: { amount: true },
        });
        return {
          ...donor,
          totalDonated: totalDonated._sum.amount || 0,
        };
      })
    );

    res.json({
      success: true,
      data: {
        donors: donorsWithTotals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get donors',
      error: error.message,
    });
  }
};

// Get donor details
const getDonorDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        subscriptions: {
          include: {
            project: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            project: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!donor || donor.role === 'ADMIN') {
      return res.status(404).json({
        success: false,
        message: 'Donor not found',
      });
    }

    // Get total donated
    const totalDonated = await prisma.payment.aggregate({
      where: { userId: id, status: 'SUCCESS' },
      _sum: { amount: true },
    });

    res.json({
      success: true,
      data: {
        donor: {
          ...donor,
          totalDonated: totalDonated._sum.amount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get donor details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get donor details',
      error: error.message,
    });
  }
};

// Toggle donor status
const toggleDonorStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await prisma.user.findUnique({ where: { id } });
    if (!donor || donor.role === 'ADMIN') {
      return res.status(404).json({
        success: false,
        message: 'Donor not found',
      });
    }

    const updatedDonor = await prisma.user.update({
      where: { id },
      data: { isActive: !donor.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: `Donor ${updatedDonor.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { donor: updatedDonor },
    });
  } catch (error) {
    console.error('Toggle donor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle donor status',
      error: error.message,
    });
  }
};

// Get revenue analytics
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '12' } = req.query; // months
    const months = parseInt(period);

    const analytics = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthRevenue = await prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paidAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      });

      analytics.push({
        month: startDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue._sum.amount || 0,
        transactions: monthRevenue._count,
      });
    }

    res.json({
      success: true,
      data: { analytics },
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue analytics',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getDonors,
  getDonorDetails,
  toggleDonorStatus,
  getRevenueAnalytics,
};
