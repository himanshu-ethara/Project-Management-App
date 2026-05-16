const prisma = require('../lib/prisma');

/**
 * Returns a middleware that checks if the current user has one of the required roles
 * in the given project (identified by req.params.projectId).
 * @param  {...string} roles - Allowed roles e.g. 'ADMIN', 'MEMBER'
 */
const requireRole = (...roles) => async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  if (!projectId) return next(); // no project context — skip

  try {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    if (!roles.includes(member.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}.`,
      });
    }

    req.memberRole = member.role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireRole };
