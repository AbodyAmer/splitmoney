const { Schema, model } = require('../config/mongodb')

const userSchema = new Schema({
    name: String
})

module.exports = model('User', userSchema)
