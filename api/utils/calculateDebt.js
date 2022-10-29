import Group from "../../models/groups.js"
import Expenses from "../../models/expenses.js"
import mongoose from "mongoose"
import { sum } from 'ramda'

const calculateDebt = async (groupId) => {
    const group = await Group.findById(groupId)
    const totalPayments = await Expenses.aggregate([
        {
          $match: {
            group: mongoose.Types.ObjectId(groupId),
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
      group.members.forEach(m => {
        m.shoulPay = sum(report.shoulPay.filter(sp => sp.user._id.toString() === m._id.toString()).map(sp => sp.shouldPay))
        m.didPay = sum(report.didPay.filter(sp => sp.user._id.toString() === m._id.toString()).map(sp => sp.didPay))
        m.balance = m.didPay - m.shoulPay
        m.balanceBeforeSettle = m.balance
        return m
      })
  
      const belewZero = group.members.filter(a => a.balance < 0)
      const aboveZero = group.members.filter(a => a.balance > 0)
      const justZero = group.members.filter(a => a.balance === 0)
      return {
        belewZero,
        aboveZero,
        justZero
      }
}

export default calculateDebt
