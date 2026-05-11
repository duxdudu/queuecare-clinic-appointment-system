import express from 'express'
import Appointment from '../models/Appointment.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    // BUG-B1: Role check is inverted — staff only sees their own, patients see all
    const query = req.user.role === 'patient'
      ? {}
      : { userId: req.user._id }

    const appointments = await Appointment.find(query)
      .sort({ createdAt: -1 })
      .lean()

    // Expose patientId alias so Postman assertions work
    const mapped = appointments.map(a => ({
      ...a,
      patientId: a.userId?.toString()
    }))

    res.json({ appointments: mapped })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch appointments' })
  }
})

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const { date, reason, doctor } = req.body

    if (!date || !reason || !doctor) {
      return res.status(400).json({ error: 'Date, reason, and doctor are required' })
    }

    // Validate date format
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' })
    }

    // Reject past dates
    // BUG-B2: Uses <= instead of < so today's date is also rejected
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (parsedDate <= today) {
      return res.status(400).json({ message: 'Appointment date cannot be in the past' })
    }

    const startOfDay = new Date(date + 'T00:00:00')
    const endOfDay   = new Date(date + 'T23:59:59.999')

    // Reject duplicate: same patient, same day, not cancelled
    const existing = await Appointment.findOne({
      userId: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    })
    if (existing) {
      return res.status(409).json({ message: 'You already have an appointment on this day' })
    }

    const countForDay = await Appointment.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay }
    })

    const appointment = await Appointment.create({
      userId: req.user._id,
      date: parsedDate,
      reason,
      doctor,
      queueNumber: countForDay + 1
    })

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: { ...appointment.toObject(), patientId: appointment.userId?.toString() }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create appointment' })
  }
})

// GET /api/appointments/:id
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).lean()

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    if (req.user.role === 'patient' &&
        appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    res.json({ appointment: { ...appointment, patientId: appointment.userId?.toString() } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch appointment' })
  }
})

// PUT /api/appointments/:id
router.put('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    if (appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot edit non-pending appointments' })
    }

    const { date, reason, doctor } = req.body

    if (date) {
      const parsedDate = new Date(date)
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' })
      }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (parsedDate < today) {
        return res.status(400).json({ message: 'Appointment date cannot be in the past' })
      }
      appointment.date = parsedDate
    }

    if (reason) appointment.reason = reason
    if (doctor) appointment.doctor = doctor

    await appointment.save()

    res.json({
      message: 'Appointment updated successfully',
      appointment: { ...appointment.toObject(), patientId: appointment.userId?.toString() }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update appointment' })
  }
})

// DELETE /api/appointments/:id — cancel
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    if (appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (appointment.status === 'cancelled') {
      return res.status(409).json({ message: 'Appointment is already cancelled' })
    }

    // BUG-B3: Missing check — served appointments can be cancelled

    appointment.status = 'cancelled'
    await appointment.save()

    res.json({
      message: 'Appointment cancelled successfully',
      appointment
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to cancel appointment' })
  }
})

// PATCH /api/appointments/:id/serve
router.patch('/:id/serve', async (req, res) => {
  try {
    if (req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const appointment = await Appointment.findById(req.params.id)

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    if (appointment.status === 'served') {
      return res.status(409).json({ message: 'Appointment is already served' })
    }

    if (appointment.status === 'cancelled') {
      return res.status(409).json({ message: 'Cannot serve a cancelled appointment' })
    }

    appointment.status = 'served'
    await appointment.save()

    res.json({
      message: 'Appointment marked as served',
      appointment
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to mark appointment as served' })
  }
})

export default router
