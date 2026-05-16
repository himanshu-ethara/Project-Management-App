const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

router.use(authenticate);

router.get('/', listProjects);
router.post('/', createProject);
router.get('/:projectId', requireRole('ADMIN', 'MEMBER'), getProject);
router.put('/:projectId', requireRole('ADMIN'), updateProject);
router.delete('/:projectId', requireRole('ADMIN'), deleteProject);

module.exports = router;
