const express = require("express");
const { CreateSupportTicket, GetAllSupportTickets, updateResolution, updateStatusToResolved } = require("../controllers/SupportController");
const router = express.Router()
const { auth, isUser } = require("../middlewares/RBAC");

router.post('/CreateSupport',auth,isUser, CreateSupportTicket)
router.get('/getSupportTicket',GetAllSupportTickets)
router.patch('/AddResolution/:supportTicketId',updateResolution)
router.patch('/:id/resolved', auth,isUser, updateStatusToResolved)

module.exports = router;