'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ProjectSchema = new Schema({
  name: String,
  description: String,
  // Where is the project hosted? Github, Google Code, etc.
  repositoryType: {type: String, default: 'github'},
  repositoryUrl: String,
  websiteUrl: String,
  githubUsername: {type: String, index: true},
  githubProjectName: {type: String, index: true},
  lastChecked: {type: Date},
  authors: [{type : Schema.Types.ObjectId, ref: 'User'}],
  photos: [String],
  mentor: {type : Schema.Types.ObjectId, ref: 'User'},
  active: {type: Boolean, default: true}
});

module.exports = mongoose.model('Project', ProjectSchema);
