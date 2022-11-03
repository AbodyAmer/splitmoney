import User from '../../models/users.js'
import express from 'express'
import isEmail from 'validator/lib/isEmail.js'
import Session from '../../models/sessions.js'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator';

const router = express.Router()

router.post('/register',
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').notEmpty()
    , async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { password, name } = req.body
            const email = req.body.email?.trim().toLowerCase()
            const isExist = await User.findOne({ email }).lean()
            if (isExist) return res.status(500).json({ message: 'User exist. Please try to login' })

            if (!isEmail(email)) return res.status(500).json({ message: 'Please enter a valid email' })

            const newUser = new User();
            newUser.name = name,
                newUser.email = email,
                newUser.password = password
            newUser.setPassword(req.body.password);
            await newUser.save()
            const session = new Session()
            session.useruid = user._id
            const newSession = await session.save()
            const token = jwt.sign({
                email: email,
                name: name,
                sessionuid: newSession._id.toString()
            }, process.env.JWT_SECRET);
            return res.json({ token })
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: error.message })
        }
    })

router.post('/passwordLogin',
    body('email').isEmail(),
    body('password').notEmpty(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { password } = req.body
            const email = req.body.email?.trim().toLowerCase()
            const user = await User.findOne({ email })
            if (!user) return res.status(401).json({ message: 'User not found' })
            if (!user.validPassword(password)) return res.status(401).json({ message: 'Wrong password' })

            const session = new Session()
            session.useruid = user._id
            const newSession = await session.save()
            const token = jwt.sign({
                email: user.email,
                name: user.name,
                sessionuid: newSession._id.toString()
            }, process.env.JWT_SECRET);
            return res.json({ token })
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: error.message })
        }
    })

router.get('/logout', async (req, res) => {
    try {
        const { authorization } = req.headers
        if (!authorization) return res.status(401).end()
        const session = jwt.verify(authorization, process.env.JWT_SECRET)
        const updateSession = await Session.updateOne({ _id: session.sessionuid, status: 'ACTIVE' }, { status: 'INACTVIE' })
        if (updateSession.modifiedCount) return res.end('OK')
        return res.status(401).end()
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
})

export default router
