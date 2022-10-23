const mongoose = require('mongoose')

console.log("process.env.DB_URL", process.env.DB_URL)
mongoose.connect(process.env.DB_URL).then(res => console.log('Mongo is connected')).catch(e => console.log(e))

module.exports = mongoose
