import mongoose from 'mongoose'

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  doctor: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'served', 'cancelled'],
    default: 'pending'
  },
  queueNumber: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
})

// Index for efficient queue queries
appointmentSchema.index({ date: 1, queueNumber: 1 })
appointmentSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('Appointment', appointmentSchema)
