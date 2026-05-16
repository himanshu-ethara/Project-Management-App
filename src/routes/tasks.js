const router = require('express').Router({ mergeParams: true });
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { listTasks, createTask, updateTask, updateTaskStatus, deleteTask } = require('../controllers/taskController');

router.use(authenticate);

// Nested: /api/projects/:projectId/tasks
router.get('/', requireRole('ADMIN', 'MEMBER'), listTasks);
router.post('/', requireRole('ADMIN'), createTask);

module.exports = router;
