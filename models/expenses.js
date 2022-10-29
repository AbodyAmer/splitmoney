import { model, Schema } from '../config/mongodb.js'

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
    isRemoved: { type: Boolean, default: false },
    createdBy: { type: Schema.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

export default model('expenses', expensesSchema)