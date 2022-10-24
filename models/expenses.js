const { Schema, model } = require('../config/mongodb')

const expensesSchema = new Schema({
    totalAmount: { type: Number, required: true },
    group: { type: Schema.ObjectId, ref: 'Group', required: true },
    paidBy: { type: Schema.ObjectId, ref: 'User', required: true },
    split: [{
        useruid: { type: Schema.ObjectId, ref: 'User', required: true }, 
        splitAmount: { type: Number, required: true }
    }],
    paymentType: { 
        type: String,
        enum : ['SETTELUP','EQUAL', 'UNEQUAL', 'PERCENTAGE']
    },
    createdBy: { type: Schema.ObjectId, ref: 'User', required: true },
    modifiedBy: { type: Schema.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

module.exports = model('expenses', expensesSchema)