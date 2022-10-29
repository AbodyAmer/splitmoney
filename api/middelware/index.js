import User from '../../models/users.js'
import Session from '../../models/sessions.js'
import jwt from 'jsonwebtoken'


export const isLogged = async (req, res, next) => {
    try {
        const { authorization } = req.headers
        if (!authorization) return res.status(401).end()
        const sessionToken = jwt.verify(authorization, process.env.JWT_SECRET)
        const session = await Session.findOne({ _id: sessionToken.sessionuid, status: 'ACTIVE' })
        if (!session) return res.status(401).end()

        const user = await User.findOne({ _id: session.useruid }).lean()
        if (!user) return res.status(401).end()
        delete user.hash
        delete user.salt
        req.user = user
        next()
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' })
    }
}
