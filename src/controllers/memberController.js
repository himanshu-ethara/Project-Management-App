const prisma = require('../lib/prisma');

// GET /api/projects/:projectId/members
const listMembers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    res.json(members);
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/members  { email, role? }
const addMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email, role = 'MEMBER' } = req.body;

    if (!email) return res.status(400).json({ error: 'email is required.' });
    if (!['ADMIN', 'MEMBER'].includes(role))
      return res.status(400).json({ error: 'role must be ADMIN or MEMBER.' });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true },
    });
    if (!user) return res.status(404).json({ error: 'No user found with that email.' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (existing) return res.status(409).json({ error: 'User is already a member of this project.' });

    const member = await prisma.projectMember.create({
      data: { projectId, userId: user.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:projectId/members/:userId  { role }
const updateMemberRole = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MEMBER'].includes(role))
      return res.status(400).json({ error: 'role must be ADMIN or MEMBER.' });

    // Prevent changing own role
    if (userId === req.user.id)
      return res.status(400).json({ error: 'You cannot change your own role.' });

    const member = await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(member);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/members/:userId
const removeMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;

    // Check if owner
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project?.ownerId === userId)
      return res.status(400).json({ error: 'Cannot remove the project owner.' });

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    res.json({ message: 'Member removed.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listMembers, addMember, updateMemberRole, removeMember };
