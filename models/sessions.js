import { Schema, model } from '../config/mongodb.js'

const sessionsSchema = new Schema({
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    useruid: { type: Schema.ObjectId, ref: 'User', required: true }
})

export default model('Session', sessionsSchema)
