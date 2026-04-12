import Event from '../models/Event.js';

const normalizeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const createEvent = async (req, res, next) => {
  try {
    const { title, description = '', date, time } = req.body;

    if (!title || !date || !time) {
      return res.status(400).json({ message: 'Title, date, and time are required' });
    }

    const eventDate = normalizeDate(date);
    if (!eventDate) {
      return res.status(400).json({ message: 'Invalid event date' });
    }

    const event = await Event.create({
      title: String(title).trim(),
      description: String(description || '').trim(),
      date: eventDate,
      time: String(time).trim(),
      userId: req.user._id
    });

    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ userId: req.user._id }).sort({ date: 1, time: 1 });
    res.status(200).json({ events });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({ message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};
