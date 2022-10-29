import Group from '../../models/groups.js'
import express from 'express'
import { isLogged } from '../middelware/index.js'
import mongoose from 'mongoose'
import { sum } from 'ramda'
import calculateDebt from '../utils/calculateDebt.js'

const router = express.Router()

router.post('/createGroup', isLogged, async (req, res) => {
    try {
        const { name } = req.body
        if (!name) return res.status(400).json({ message: 'Please enter group name' })
        const group = new Group({
            name,
            members: [req.user._id],
            createdBy: req.user._id,
            updatedBy: req.user._id
        })
        const newGroup = await group.save()
        return res.json(newGroup)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error '})
    }
})

router.post('/join/:inviteLink', isLogged, async (req, res) => {
    try {
        const { inviteLink } = req.params
        const group = await Group.findOne({ inviteLink }).lean()
        if (!group) return res.status(500).json({ message: 'Invalid link' })
        const isExist = group.members.find(m => m.toString() === req.user._id.toString())
        if (!isExist) {
            const members = group.members
            members.push(req.user._id)
            await Group.updateOne({ _id: group._id }, { members })
        }
        res.json({ message: 'OK' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
})

router.post('/deleteMember', isLogged, async (req, res) => {
    try {
        const { groupId, memberId } = req.body
        const group = await Group.findOne({ _id: mongoose.Types.ObjectId(groupId), members: { $in: [mongoose.Types.ObjectId(req.user._id), mongoose.Types.ObjectId(memberId)]} }).lean()
        if (!group) return res.status(400).json({ message: 'Group or member not found'})
        const { justZero } = await calculateDebt(groupId)
          if (justZero.find(m => m.toString() === memberId)) {
            const members = group.members.filter(m => m.toString() !== memberId)
            await Group.updateOne({ _id: group._id }, { members })
            return res.json({ message: 'OK' })
          }

          return res.status(400).json({ message: 'Clear your debt before leaving the group' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

router.post('/delete', isLogged, async (req, res) => {
    try {
        const { groupId } = req.body
        const group = await Group.findOne({ _id: mongoose.Types.ObjectId(groupId), members: { $in: [mongoose.Types.ObjectId(req.user._id)]} }).lean()
        if (!group) return res.status(400).json({ message: 'Group or member not found'})
        const { justZero } = await calculateDebt(groupId)
        const everyoneDone = group.members.every(member => justZero.find(m => m.toString() === member.toString()))
        if (!everyoneDone) {
            return res.status(400).json({ message: 'Clear group debt before deleting the group' })  
        }
        await Group.updateOne({ _id: mongoose.Types.ObjectId(groupId) }, { isRemoved: true })
        return res.json({ message: 'OK' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' })
    }
})
export default router
