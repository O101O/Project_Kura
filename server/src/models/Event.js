import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

eventSchema.index({ userId: 1, date: 1 });

export default mongoose.model('Event', eventSchema);
