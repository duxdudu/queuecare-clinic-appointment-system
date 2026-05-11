import express from 'express'
import Appointment from '../models/Appointment.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// GET /api/queue/today?date=YYYY-MM-DD
// Staff  → all appointments for the day
// Patient → only their own appointments for the day
router.get('/today', authenticate, async (req, res) => {
  try {
    const dateParam = req.query.date
    let targetDate

    if (dateParam) {
      targetDate = new Date(dateParam + 'T00:00:00')
    } else {
      targetDate = new Date()
      targetDate.setHours(0, 0, 0, 0)
    }

    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const filter = {
      date: { $gte: startOfDay, $lte: endOfDay }
    }

    // Patients only see their own appointments in the queue
    if (req.user.role === 'patient') {
      filter.userId = req.user._id
    }

    const queue = await Appointment.find(filter)
      .sort({ queueNumber: 1 })
      .lean()

    res.json({ queue })
  } catch (error) {
    console.error('Get queue error:', error)
    res.status(500).json({ error: 'Failed to fetch queue' })
  }
})

export default router
