const prisma = require('../lib/prisma');

// GET /api/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Projects user is part of
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true, role: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    // All tasks across those projects
    const [allTasks, myTasks, overdueTasks, projects] = await Promise.all([
      prisma.task.count({ where: { projectId: { in: projectIds } } }),
      prisma.task.count({ where: { projectId: { in: projectIds }, assigneeId: userId } }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          dueDate: { lt: now },
          status: { not: 'DONE' },
        },
      }),
      prisma.project.findMany({
        where: { id: { in: projectIds } },
        include: { _count: { select: { tasks: true, members: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Status breakdown
    const statusBreakdown = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId: { in: projectIds } },
      _count: { status: true },
    });

    // Priority breakdown for assigned tasks
    const priorityBreakdown = await prisma.task.groupBy({
      by: ['priority'],
      where: { projectId: { in: projectIds }, assigneeId: userId },
      _count: { priority: true },
    });

    // Recent overdue tasks (full detail)
    const overdueList = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: now },
        status: { not: 'DONE' },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    // Recently updated tasks
    const recentTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    });

    res.json({
      stats: {
        totalProjects: projectIds.length,
        totalTasks: allTasks,
        myTasks,
        overdueTasks,
      },
      statusBreakdown,
      priorityBreakdown,
      recentProjects: projects,
      overdueList,
      recentTasks,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
