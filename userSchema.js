const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    user_id: {type:String, required: true, unique: true},
    user_mail: {type:String, required: true, unique: true},
    user_name: {type:String, required: true, unique: true},
    user_password:{type:String, required: true},
    user_rol: {type:String, required: true}
});

userSchema.pre('save', async function() {
    if (!this.isModified('user_password')) return;
    const salt = await bcrypt.genSalt(10);
    this.user_password = await bcrypt.hash(this.user_password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.user_password);
};

module.exports = mongoose.model('User', userSchema, 'users');