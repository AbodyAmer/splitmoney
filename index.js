import "dotenv/config.js";
// import * as dotenv from 'dotenv'
// dotenv.config()
import express from 'express'
import bodyParser from 'body-parser'
const app = express()
const port = process.env.PORT || 3000

import Expenses from './models/expenses.js'
import Group from './models/groups.js'
import mongoose from 'mongoose'
import UserRoute from './api/users/index.js'
import GroupRoute from './api/group/index.js'
import ExpensesRoute from './api/expenses/index.js'
import { sum } from 'ramda'

app.use(bodyParser.json())
app.use('/users', UserRoute)
app.use('/groups', GroupRoute)
app.use('/expenses', ExpensesRoute)

app.get('/', (req, res) => {
  res.send('Give me my money!')
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
          group: mongoose.Types.ObjectId("63516558ad85c014e228a50c"),
          isRemoved: { $ne: true }
        }
      },
      {
        $facet:
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
                shouldPay: { $sum: '$split.splitAmount' }
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
                didPay: { $sum: '$totalAmount' }
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
    res.status(500).json({ message: 'INTERNAL SERVER ERROR' })
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})