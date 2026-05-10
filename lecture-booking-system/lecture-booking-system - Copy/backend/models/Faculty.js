const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const facultySchema = new mongoose.Schema({
  facultyId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  department: {
    type: String,
    required: true
  },
  dob: {
    type: Date
  },
  contact: {
    phone: String,
    address: String
  },
  photo: {
    type: String,
    default: null
  },
  // is_coordinator: faculty who can upload official notes and create assignments
  is_coordinator: {
    type: Boolean,
    default: false
  },
  // isAdmin: faculty with facultyId = -1
  isAdmin: {
    type: Boolean,
    default: false
  },
  specialization: {
    type: String
  },
  designation: {
    type: String,
    default: 'Assistant Professor'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

facultySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

facultySchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

facultySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Faculty', facultySchema);
