import "dotenv/config.js";
import express from 'express'
import bodyParser from 'body-parser'
const app = express()
const port = process.env.PORT || 3000

import UserRoute from './api/users/index.js'
import GroupRoute from './api/group/index.js'
import ExpensesRoute from './api/expenses/index.js'

app.use(bodyParser.json())
app.use('/users', UserRoute)
app.use('/groups', GroupRoute)
app.use('/expenses', ExpensesRoute)

app.get('/', (req, res) => {
  res.send('Give me my money!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})