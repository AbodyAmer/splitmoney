import { Schema, model } from '../config/mongodb.js'
import isEmail from 'validator/lib/isEmail.js'
import crypto from 'crypto'

const userSchema = new Schema({
    name: String,
    loginMethod: { type: String, enum: ['PASSWORD', 'GOOGLE'] },
    email: { 
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: 'Email address is required',
        validate: [isEmail, 'Please fill a valid email address'],
     },
     hash: String, 
     salt: String
}, { timestamps: true })

userSchema.methods.setPassword = function(password) { 
    // Creating a unique salt for a particular user 
       this.salt = crypto.randomBytes(16).toString('hex'); 
       // Hashing user's salt and password with 1000 iterations, 
       this.hash = crypto.pbkdf2Sync(password, this.salt,  
       1000, 64, `sha512`).toString(`hex`); 
   }; 
   // Method to check the entered password is correct or not 
userSchema.methods.validPassword = function(password) { 
    var hash = crypto.pbkdf2Sync(password,  
    this.salt, 1000, 64, `sha512`).toString(`hex`); 
    return this.hash === hash; 
}; 

export default model('User', userSchema)
