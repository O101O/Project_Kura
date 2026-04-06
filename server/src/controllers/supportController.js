import SupportReport from '../models/SupportReport.js';

export const createSupportReport = async (req, res, next) => {
  try {
    const { subject, description } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required' });
    }

    const report = await SupportReport.create({
      user: req.user._id,
      subject,
      description
    });

    res.status(201).json({ message: 'Report submitted successfully', reportId: report._id });
  } catch (error) {
    next(error);
  }
};
