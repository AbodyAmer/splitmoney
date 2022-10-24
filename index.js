require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 3000

const User = require('./models/users')
const Expenses = require('./models/expenses')
const Group = require('./models/groups')
const mongoose = require('mongoose')
const users = require('./models/users')
const UserRoute = require('./api/users')
const { sum } = require('ramda')

app.use(bodyParser.json())
app.use('/users', UserRoute)

app.get('/', (req, res) => {
  res.send('Give me my money!')
})
// Users
// Expenses
app.post('/addExpenses', async (req, res) => {
  try {
    const { groupId, paidBy, paymentType, split } = req.body
    const totalAmount = Number(req.body.totalAmount)
    if (!totalAmount) return res.status(400).json({ message: 'Please enter valid totalAmount' })
    const group = await Group.findOne({ _id: mongoose.Types.ObjectId(groupId) }).lean()
    if (!group) return res.status(400).json({ message: 'Group not found' })

    const validPaidBy = group.members.every(m => m.toString() !== paidBy.toString())
    if (validPaidBy) return res.status(400).json({ message: 'Invalid paid by id'})

    const validMembers = split.some((member) => group.members.every(m => m.toString() !== member.useruid.toString()))
    if (validMembers) return res.status(400).json({ message: 'Invalid split user id'})

    if (totalAmount !== parseFloat(sum(split.map(m => Number(m.splitAmount))).toFixed(2))) {
      return res.status(400).json({ message: 'Wrong split amount'})
    }
    const ex = [
      {
        group: groupId,
        totalAmount,
        paidBy,
        split,
        paymentType
      },
    ]

    const eee = await Expenses.insertMany(ex)
    res.json(eee)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
})

app.post('/editExpenses', async (req, res) => {
  try {
    const { groupId, expensesId, paidBy, paymentType, split } = req.body
    const totalAmount = Number(req.body.totalAmount)
    if (!totalAmount) return res.status(400).json({ message: 'Please enter valid totalAmount' })
    const group = await Group.findOne({ _id: mongoose.Types.ObjectId(groupId) }).lean()
    if (!group) return res.status(400).json({ message: 'Group not found' })
  
    const validPaidBy = group.members.every(m => m.toString() !== paidBy.toString())
    if (validPaidBy) return res.status(400).json({ message: 'Invalid paid by id'})
  
    const validMembers = split.some((member) => group.members.every(m => m.toString() !== member.useruid.toString()))
    if (validMembers) return res.status(400).json({ message: 'Invalid split user id'})
  
    if (totalAmount !== parseFloat(sum(split.map(m => Number(m.splitAmount))).toFixed(2))) {
      return res.status(400).json({ message: 'Wrong split amount'})
    }
    const ex = 
      {
        totalAmount,
        paidBy,
        split,
        paymentType
      }
  
    const eee = await Expenses.updateOne({ _id: mongoose.Types.ObjectId(expensesId), group: groupId }, ex)
    res.json(eee)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
})

app.get('/calculate', async (req, res) => {
  try {
    const { groupId } = req.query
    const members = await Group.findOne({ _id: mongoose.Types.ObjectId(groupId) }).populate({
      path: 'members',
      select: 'name'
    }).lean()
    const totalPayments = await Expenses.aggregate([
      {
        $match: {
          group: mongoose.Types.ObjectId("63516558ad85c014e228a50c")
        }
      },
      { $facet:
        {
           shoulPay: [ 
            {
              $unwind: 
                  '$split'
              
            },
               {
                   $group: {
                       _id: {
                           shouldPay: '$split.useruid'
                       },
                       shouldPay: { $sum: '$split.splitAmount'}
               }
               },
               {
                   $lookup: {
                   from: "users",
                  localField: "_id.shouldPay",
                  foreignField: "_id",
                  as: "user"
                   }
               }, {
                   $unwind: '$user'
               }
            ],
            didPay: [
            {
               $group: {
                  _id: { didPay: '$paidBy' }
               ,
               didPay: { $sum: '$totalAmount'}
               }
            },
                         {
                   $lookup: {
                   from: "users",
                  localField: "_id.didPay",
                  foreignField: "_id",
                  as: "user"
                   }
               }, {
                   $unwind: '$user'
               }
            ]
        }
     }
    ])
  
  
    const report = totalPayments[0]
    members.members.forEach(m => {
      m.shoulPay = sum(report.shoulPay.filter(sp => sp.user._id.toString() === m._id.toString()).map(sp => sp.shouldPay))
      m.didPay = sum(report.didPay.filter(sp => sp.user._id.toString() === m._id.toString()).map(sp => sp.didPay))
      m.balance = m.didPay - m.shoulPay
      m.balanceBeforeSettle = m.balance
      return m
    })
  
    const belewZero = members.members.filter(a => a.balance < 0)
    const aboveZero = members.members.filter(a => a.balance > 0)
    const justZero = members.members.filter(a => a.balance === 0)
    const owe = []
    for (let i = 0; i < belewZero.length; i++) {
      let remaining = belewZero[i].balance
      for (let j = 0; j < aboveZero.length; j++) {
        if (remaining === 0) {
          continue
        } else {
          if (Math.abs(remaining) > aboveZero[j].balance) {
            //owe.push(`${belewZero[i].name} should pay ${Math.abs(aboveZero[j].balance)} to ${aboveZero[j].name}`)
            owe.push({
              shoulPay: {
                _id: belewZero[i]._id,
                name: belewZero[i].name
              },
              shouldReceive: {
                _id: aboveZero[j]._id,
                name: aboveZero[j].name
              },
              amount: parseFloat(Math.abs(aboveZero[j].balance).toFixed(2))
            })
            remaining = remaining + aboveZero[j].balance
            aboveZero[j].balance = 0
          } 
          else if (Math.abs(remaining) < aboveZero[j].balance) {
            // owe.push(`${belewZero[i].name} should pay ${Math.abs(remaining)} to ${aboveZero[j].name}`)
            owe.push({
              shoulPay: {
                _id: belewZero[i]._id,
                name: belewZero[i].name
              },
              shouldReceive: {
                _id: aboveZero[j]._id,
                name: aboveZero[j].name
              },
              amount: parseFloat(Math.abs(remaining).toFixed(2))
            })
            aboveZero[j].balance = aboveZero[j].balance - parseFloat(Math.abs(remaining).toFixed(2))
            remaining = 0
          } else {
            owe.push({
              shoulPay: {
                _id: belewZero[i]._id,
                name: belewZero[i].name
              },
              shouldReceive: {
                _id: aboveZero[j]._id,
                name: aboveZero[j].name
              },
              amount: parseFloat(Math.abs(aboveZero[j].balance).toFixed(2))
            })
            remaining = 0
            aboveZero[j].balance = 0
          }
        }
        belewZero[i].balance = 0
      }
    }
    res.json({
      owe
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'INTERNAL SERVER ERROR'})
  }
})

app.get('/group', async (req, res) => {
  const group = new Group({
    name: 'East lake',
    members: [
      "635026696feb96318d93f873",
      "635026696feb96318d93f874",
      "635026696feb96318d93f875"
    ]
  })
  await group.save()
  res.end('ok')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})