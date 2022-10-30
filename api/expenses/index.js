import express from 'express'
import Group from '../../models/groups.js'
import Expenses from '../../models/expenses.js'
import mongoose from 'mongoose'
import { isLogged } from '../middelware/index.js'
const router = express.Router()

router.post('/addExpenses', isLogged, async (req, res) => {
    try {
      const { groupId, paidBy, paymentType, split } = req.body
      const totalAmount = Number(req.body.totalAmount)
      if (!totalAmount) return res.status(400).json({ message: 'Please enter valid totalAmount' })
      const group = await Group.findOne({ _id: mongoose.Types.ObjectId(groupId), members: { $in: [mongoose.Types.ObjectId(paidBy), mongoose.Types.ObjectId(req.user._id)]} }).lean()
      if (!group) return res.status(400).json({ message: 'Group not found' })
  
      const validMembers = split.some((member) => group.members.every(m => m.toString() !== member.useruid.toString()))
      if (validMembers) return res.status(400).json({ message: 'Invalid split user id' })
  
      if (totalAmount !== parseFloat(sum(split.map(m => Number(m.splitAmount))).toFixed(2))) {
        return res.status(400).json({ message: 'Wrong split amount' })
      }
      const ex = [
        {
          group: groupId,
          totalAmount,
          paidBy,
          split,
          paymentType,
          createdBy: req.user._id,
          updatedBy: req.user._id
        },
      ]
  
      const eee = await Expenses.insertMany(ex)
      res.json(eee)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  })
  
router.post('/editExpenses', isLogged, async (req, res) => {
    try {
      const { groupId, expensesId, paidBy, paymentType, split } = req.body
      const totalAmount = Number(req.body.totalAmount)
      if (!totalAmount) return res.status(400).json({ message: 'Please enter valid totalAmount' })
      const group = await Group.findOne({ _id: mongoose.Types.ObjectId(groupId), members: { $in: [mongoose.Types.ObjectId(paidBy), mongoose.Types.ObjectId(req.user._id)]} }).lean()
      if (!group) return res.status(400).json({ message: 'Group not found' })
  
      const validMembers = split.some((member) => group.members.every(m => m.toString() !== member.useruid.toString()))
      if (validMembers) return res.status(400).json({ message: 'Invalid split user id' })
  
      if (totalAmount !== parseFloat(sum(split.map(m => Number(m.splitAmount))).toFixed(2))) {
        return res.status(400).json({ message: 'Wrong split amount' })
      }
      const ex =
      {
        totalAmount,
        paidBy,
        split,
        paymentType
      }
  
      const eee = await Expenses.updateOne({
        _id: mongoose.Types.ObjectId(expensesId), 
        group: groupId,
        isRemoved: { $ne: true },
      },
        ex)
      res.json(eee)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  })
  
router.post('/deleteExpenses', isLogged, async (req, res) => {
    try {
    const { groupId, expensesId } = req.body
    const group = await Group.findOne({ _id: mongoose.Types.ObjectId(groupId), members: { $in: [mongoose.Types.ObjectId(req.user._id)]} }).lean()
    if (!group) return res.status(400).json({ message: 'Group not found' })
    const response = await Expenses.updateOne({ 
        _id: mongoose.Types.ObjectId(expensesId),
        group: mongoose.Types.ObjectId(groupId)
    }, {
        isRemoved: true,
        updatedBy: req.user._id
    })
    return res.json(response)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  })

export default router
