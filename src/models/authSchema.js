const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const authSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  password: String,
  pin: String,
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
});

  userSchema.pre(
    'save',
    async function(next) {
      const user = this;
      const hash = await bcrypt.hash(this.password, 10);
  
      this.password = hash;
      next();
    }
  );
  
  userSchema.methods.isValidPassword = async function(password) {
    const user = this;
    const compare = await bcrypt.compare(password, user.password);
  
    return compare;
  }
  
  userSchema.methods.isEmailValid = async function(email) {
    const user = this;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
  
    return isValidEmail;
  };
  
  const Auth = mongoose.model('Auth', authSchema);
  
  module.exports = mongoose.model(Auth);

