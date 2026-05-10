const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  // official: uploaded by coordinator; personal: uploaded by any faculty
  type: {
    type: String,
    enum: ['official', 'personal'],
    default: 'personal'
  },
  files: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number
  }],
  tags: [String],
  // AI-generated summary placeholder
  summary: {
    type: String,
    default: null
  },
  summaryGeneratedAt: {
    type: Date
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

noteSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Note', noteSchema);
