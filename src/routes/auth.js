// src/routes/auth.js
const express = require('express')
const bcrypt = require('bcryptjs')

const { User } = require('../models')

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  try {
    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hash })

    res.status(201).json({ id: user.id, name: user.name, email: user.email })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({ where: { email } })

    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.password)

    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    res.json({ id: user.id, name: user.name, email: user.email })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Password Reset (request)
router.post('/reset', async (req, res) => {
  const { email, newPassword } = req.body

  try {
    const user = await User.findOne({ where: { email } })

    if (!user) return res.status(404).json({ error: 'User not found' })
    const hash = await bcrypt.hash(newPassword, 10)

    await user.update({ password: hash })
    res.json({ message: 'Password updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
