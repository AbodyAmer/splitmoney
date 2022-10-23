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
    }
})

module.exports = model('expenses', expensesSchema)