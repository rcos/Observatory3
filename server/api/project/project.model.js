'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ProjectSchema = new Schema({
  name: String,
  description: String,
  // Where is the project hosted? Github, Google Code, etc.
  repositoryType: {type: String, default: 'github'},
  repositories: [String],
  websiteUrl: String,
  githubUsername: {type: String, index: true},
  githubProjectName: {type: String, index: true},
  lastChecked: {type: Date},
  authors: [String],
  photos: [String],
  mentor: String,
  active: {type: Boolean, default: true},
  markedDefault: {type: Boolean, default: false},
  tech: [String]
});

module.exports = mongoose.model('Project', ProjectSchema);
