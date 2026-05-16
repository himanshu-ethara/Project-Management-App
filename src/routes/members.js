const router = require('express').Router({ mergeParams: true });
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { listMembers, addMember, updateMemberRole, removeMember } = require('../controllers/memberController');

router.use(authenticate);

router.get('/', requireRole('ADMIN', 'MEMBER'), listMembers);
router.post('/', requireRole('ADMIN'), addMember);
router.put('/:userId', requireRole('ADMIN'), updateMemberRole);
router.delete('/:userId', requireRole('ADMIN'), removeMember);

module.exports = router;
