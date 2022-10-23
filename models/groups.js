const { Schema, model } = require('../config/mongodb')

const groupSchema = new Schema({
    name: { type: String, required: true },
    members: [{         
        type: Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    }]
})

module.exports = model('Group', groupSchema)
