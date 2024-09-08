const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  userStatusId: { type: Number, required: true },
  address: { type: String, required: true },
  userType: { type: Number, required: true },
  usersLocationsId: { type: Number, required: true },
  jobTitle: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Email should be unique
  login: { type: String, required: true },
  password: { type: String, required: true }, // Store password securely using hashing
  ipRestrictions: { type: Boolean, required: true },
  loginActive: { type: Boolean, required: true },
  outOffice: { type: Boolean, required: true }
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


module.exports = mongoose.model('User', userSchema);
