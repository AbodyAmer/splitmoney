const User = require('../../models/users')
const router = require('express').Router()
const isEmail = require('validator/lib/isEmail')

router.post('/register', async (req, res) => {
    try {
        const { password, name } = req.body
        const email = req.body.email?.trim().toLowerCase()
        const isExist = await User.findOne({ email }).lean()
        if (isExist) return res.status(500).json({ message: 'User exsited. Please try to login' })

        if (!isEmail(email)) return res.status(500).json({ message: 'Please enter a valid email' })

        const newUser = new User(); 
        newUser.name = name, 
        newUser.email = email,
        newUser.password = password
        newUser.setPassword(req.body.password);
        await newUser.save()
        return res.json({ message: 'Success' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
})

module.exports = router
