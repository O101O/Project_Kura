import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createEvent, deleteEvent, getEvents } from '../controllers/eventController.js';

const router = Router();

router.use(protect);
router.post('/', createEvent);
router.get('/', getEvents);
router.delete('/:id', deleteEvent);

export default router;
