const prisma = require('../lib/prisma');

// GET /api/projects/:projectId/tasks
const listTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assigneeId } = req.query;

    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/tasks
const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, dueDate, assigneeId } = req.body;

    if (!title) return res.status(400).json({ error: 'title is required.' });

    // Validate assignee is a project member
    if (assigneeId) {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assigneeId } },
      });
      if (!isMember)
        return res.status(400).json({ error: 'Assignee must be a member of this project.' });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        createdById: req.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id  (Admin or assignee)
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    // Check user is admin or assignee
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
    });
    if (!member) return res.status(403).json({ error: 'Not a member of this project.' });
    if (member.role !== 'ADMIN' && task.assigneeId !== req.user.id)
      return res.status(403).json({ error: 'Only Admins or the assigned member can edit this task.' });

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: title?.trim() || task.title,
        description: description !== undefined ? description?.trim() || null : task.description,
        status: status || task.status,
        priority: priority || task.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
        assigneeId: assigneeId !== undefined ? assigneeId || null : task.assigneeId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id/status  (Any member)
const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(status))
      return res.status(400).json({ error: 'status must be TODO, IN_PROGRESS, or DONE.' });

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    // Verify membership
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
    });
    if (!member) return res.status(403).json({ error: 'Not a member of this project.' });

    const updated = await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id  (Admin only)
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
    });
    if (!member || member.role !== 'ADMIN')
      return res.status(403).json({ error: 'Only Admins can delete tasks.' });

    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listTasks, createTask, updateTask, updateTaskStatus, deleteTask };
