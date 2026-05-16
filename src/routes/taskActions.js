// Standalone task routes (not nested under project)
const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { updateTask, updateTaskStatus, deleteTask } = require('../controllers/taskController');

router.use(authenticate);

router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

module.exports = router;
