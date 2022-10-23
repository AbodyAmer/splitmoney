require('dotenv').config()
const express = require('express')
const app = express()
const port = 3000

const User = require('./models/users')
const Expenses = require('./models/expenses')
const Group = require('./models/groups')
const mongoose = require('mongoose')
const users = require('./models/users')
const { sum, ap } = require('ramda')

app.get('/', (req, res) => {
  res.send('Give me my money!')
})

app.get('/expenses', async (req, res) => {
  try {
    const users = await User.find()

    const ex = [
      {
        group: "63516558ad85c014e228a50c",
        totalAmount: 129,
        paidBy: "635026696feb96318d93f875",
        split: [{
            useruid: "635026696feb96318d93f873", 
            splitAmount: 30
        },
        {
          useruid: "635026696feb96318d93f875", 
          splitAmount: 0
      },
      {
        useruid: "635026696feb96318d93f874", 
        splitAmount: 99
      }
      ],
        paymentType: 'SETTELUP'
      },
    ]

    const eee = await Expenses.insertMany(ex)
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
      console.log(m.shoulPay)
      console.log(m.didPay)
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
          console.log(Math.abs(remaining) , aboveZero[j].balance)
          if (Math.abs(remaining) > aboveZero[j].balance) {
            owe.push(`${belewZero[i].name} should pay ${Math.abs(aboveZero[j].balance)} to ${aboveZero[j].name}`)
            // owe.push({
            //   shoulPay: belewZero[i],
            //   shouldReceive: aboveZero[j],
            //   amount: Math.abs(aboveZero[j].balance)
            // })
            remaining = remaining + aboveZero[j].balance
            aboveZero[j].balance = 0
          } 
          else if (Math.abs(remaining) < aboveZero[j].balance) {
            owe.push(`${belewZero[i].name} should pay ${Math.abs(remaining)} to ${aboveZero[j].name}`)
            // owe.push({
            //   shoulPay: belewZero[i],
            //   shouldReceive: aboveZero[j],
            //   amount: Math.abs(remaining)
            // })
            aboveZero[j].balance = aboveZero[j].balance - Math.abs(remaining)
            remaining = 0
          } else {
            owe.push({
              shoulPay: belewZero[i],
              shouldReceive: aboveZero[j],
              amount: Math.abs(aboveZero[j].balance)
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