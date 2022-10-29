import { model, Schema } from '../config/mongodb.js'
import { nanoid } from 'nanoid'

const groupSchema = new Schema({
    name: { type: String, required: true },
    members: [{         
        type: Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    }],
    inviteLink: { type: String, unique: true, require: true.valueOf, default: nanoid(18) },
    isRemoved: { type: Boolean, default: false },
    createdBy: { type: Schema.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

export default model('Group', groupSchema)
