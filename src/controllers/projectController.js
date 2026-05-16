const prisma = require('../lib/prisma');

// GET /api/projects
const listProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            _count: { select: { members: true, tasks: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      myRole: m.role,
    }));

    res.json(projects);
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required.' });

    const userId = req.user.id;

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: userId,
        members: {
          create: { userId, role: 'ADMIN' },
        },
      },
      include: { _count: { select: { members: true, tasks: true } } },
    });

    res.status(201).json({ ...project, myRole: 'ADMIN' });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId
const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { tasks: true } },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json({ ...project, myRole: req.memberRole });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:projectId
const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required.' });

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { name: name.trim(), description: description?.trim() || null },
    });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId
const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    if (project.ownerId !== userId)
      return res.status(403).json({ error: 'Only the project owner can delete this project.' });

    await prisma.project.delete({ where: { id: projectId } });
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listProjects, createProject, getProject, updateProject, deleteProject };
