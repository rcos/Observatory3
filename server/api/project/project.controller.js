'use strict';

var _ = require('lodash');
var Project = require('./project.model');
var User = require('../user/user.model');
var multiparty = require('multiparty');
var fs = require('fs');
var mkdirp = require('mkdirp');
var async = require('async');
var config = require('../../config/environment');
var validUrl = require('valid-url');


// Get list of current projects
exports.index = function(req, res) {
  Project.find({active:true},function (err, projects) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(projects);
  });
};

// Gets various stats for projects
exports.stats = function(req, res) {
  async.parallel([
        // Count active projects
        function(callback) {
          Project.count({active:true}, function (err, aCount) {
            if (err) return callback(err);
            callback(null, aCount);
          });
        },
        // Count past projects
        function(callback) {
          Project.count({active:false}, function (err, pCount) {
            if (err) return callback(err);
            callback(null, pCount);
          });
        },
      ],
      function(err, results){
        if (err) {
          return res.send(400);
        }

        if (results == null) {
          return res.send(400);
        }

        //results contains [activeProjectCount, pastProjectCount]
        var stats = {};
        stats.activeProjects = results[0] || 0;
        stats.pastProjects = results[1] || 0;

        return res.status(200).send(stats);
  });
};

// Get list of default projects
exports.defaults = function(req, res) {
  Project.find({markedDefault: true}, function (err, projects) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(projects);
  });
};

// Get list of past projects
exports.indexOld = function(req, res) {
  Project.find({active:false},function (err, projects) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(projects);
  });
};

// Get a single project
exports.show = function(req, res) {
  if (req.params.username && req.params.project){
    Project.findOne({'githubUsername': req.params.username, 'githubProjectName': req.params.project }, function (err, project) {
      if(err) { return handleError(res, err); }
      if(!project) { return res.send(404); }
      return res.json(project);
    });
  }else if (req.params.id){
    Project.findById(req.params.id, function(err, project){
      if(err) { return handleError(res, err); }
      if(!project) { return res.send(404); }
      return res.json(project);
    });
  }
};

// Get authors on a project
exports.authors = function(req, res) {
    var projectId = req.params.id;
    User.find({projects: projectId}, 'name email', function(err, authors) {
        if (err) { return handleError(res, err); }
        return res.status(200).json(authors);
    });
}

// Creates a new project in the DB.
exports.create = function(req, res) {
  Project.create(req.body, function(err, project) {
    if(err) { return handleError(res, err); }

    //Add creator to any new project
    var userId = req.user._id;
    User.findById(userId, function(err, user){
      if (err){
        res.send(500, err);
      }else{
        if (!user.projects) user.projects = [];
        if (user.projects.indexOf(project) !== -1) return;
        user.projects.push(project);
        user.save(function(err) {
          if (err) return res.status(422).json(err);
          return res.status(201).json(project);
        });
      }
    });
  });
};

// Updates an existing project in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Project.findById(req.params.id, function (err, project) {
    if (err) { return handleError(res, err); }
    if(!project) { return res.send(404); }

    // Only mentors and project owners can update a project
    var userId = req.user._id;
    User.findById(userId, function(err, user) {
      if (err) { return handleError(res, err); }

      if (user.projects.indexOf(project._id) >= 0 || user.role === 'mentor' || user.role === 'admin'){

        var urls = req.body.repositories;

        // validate urls, change only if all urls are valid
        var valid = false;
        for (var i = 0; i < urls.length; i++) {
          if (validUrl.isUri(urls[i])) {
            valid = true;
          } else {
            valid = false;
          }
        }

        if (valid == true) {
          project.repositories = req.body.repositories;
        }

        var updated = _.merge(project, req.body);
        updated.save(function (err) {
          if (err) { return handleError(res, err); }
          return res.json(200, project);
        });
      } else {
        return handleError(res, err);
      }
    });
  });
};

//adds a tech bubble to the project
exports.addTechBubble = function(req, res){
	var projectId = req.params.id;
	var newTech = req.params.tech;
	Project.findById(projectId, function(err, project){
		if (err){
			res.send(500, err);
		}else{
			if (!project.tech) project.tech=[];
			project.tech.push(newTech);
			project.save(function(err){
				if (err) return validationError(res, err);
				res.send(200);
			});
		}
	});
};

exports.removeTech = function(req, res){
	var projectId = req.params.id;
	var oldTech = req.params.tech;
	Project.findById(projectId, function(err, project){
		if (err){
			res.send(500, err);
		}else{
			if (!project.tech) project.tech = [];
			project.tech.splice(project.tech.indexOf(oldTech), 1);
			project.save(function(err){
				if (err) return validationError(res, err);
				res.send(200);
			});
		}
	});
};

// Deletes a project from the DB.
exports.destroy = function(req, res) {
  Project.findById(req.params.id, function (err, project) {
    if(err) { return handleError(res, err); }
    if(!project) { return res.send(404); }
    project.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

exports.deletePhoto = function(req, res) {
    var photoName = req.params.photoName;
    var username = req.params.username;
    var project = req.params.project;
    var userId = req.user._id;
    var path = config.imageUploadPath;

    Project.findOne({'githubUsername': req.params.username, 'githubProjectName': req.params.project }, function (err, project) {
      if(err) { return handleError(res, err); }
      if(!project) { return res.send(404); }
      if(project.photos.length===10){
        var temp = project.photos.shift();
        var toRemove = path + '/' + temp;
        fs.unlinkSync(toRemove);
      }
      for (var i = 0; i < project.photos.length; i++){
          if (project.photos[i] === photoName){
            project.photos.splice(i, 1);
          }
      }
      project.save(function (err) {
        User.findById(userId, function(err, user) {
          if (err) { return handleError(res, err); }

          if (user.projects.indexOf(project._id) >= 0 || user.role === 'mentor' || user.role === 'admin'){
            var updated = _.merge(project, req.body);
            updated.save(function (err) {
            if (err) { return handleError(res, err); }
              return res.json(200, project);
            });
          } else {
            return handleError(res, err);
          }
        });
      });
    });
};

function handleError(res, err) {
  return res.send(500, err);
}

exports.markPast = function(req,res){

  var userId = req.user._id;
  Project.findById(req.params.id,function(err,project){
    if(err) { return handleError(res, err); }
    if(!project) { return res.send(404); }
    User.findById(userId, function(err, user) {
      if (err) { return handleError(res, err); }

      if (user.projects.indexOf(project._id) >= 0 || user.role === 'mentor' || user.role === 'admin'){
            project.update({ active: false }, function(err) {
              if(err) { return handleError(res, err); }
              return res.send(200);
            });
      } else {
        return handleError(res, err);
      }
    });
  });
};

exports.markActive = function(req,res){
  var userId = req.user._id;
  Project.findById(req.params.id,function(err,project){
    if(err) { return handleError(res, err); }
    if(!project) { return res.send(404); }
    User.findById(userId, function(err, user) {
      if (err) { return handleError(res, err); }

      if (user.projects.indexOf(project._id) >= 0 || user.role === 'mentor' || user.role === 'admin'){
            project.update({ active: true }, function(err) {
              if(err) { return handleError(res, err); }
              return res.send(200);
            });
      } else {
        return handleError(res, err);
      }
    });
  });
};

exports.markDefault = function(req, res) {
  Project.findById(req.params.id, function (err, project) {
    if(err) { return handleError(res, err); }
    if(!project) { return res.send(404); }
    project.update({ markedDefault: true }, function(err) {
      if(err) { return handleError(res, err); }
      return res.send(200);
    });
  });
};

exports.unmarkDefault = function(req, res) {
  Project.findById(req.params.id, function (err, project) {
    if(err) { return handleError(res, err); }
    if(!project) { return res.send(404); }
    project.update({ markedDefault: false }, function(err) {
      if(err) { return handleError(res, err); }
      return res.send(200);
    });
  });
};

exports.upload = function(req, res) {
  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {
    var file = files.file[0];
    var subDir = req.params.username + '/' + req.params.project + '/';
    var name = subDir + file.path.substring(file.path.lastIndexOf('/')).substring(1);
    var path = config.imageUploadPath;
    var destPath = path + name;
    if(!fs.existsSync(path+subDir)){
      mkdirp.sync(path+subDir);
    }
    // Copy file from temp to uploads folder with streams.
    // Allows upload across partitions unlike fs.renameSync
    var is = fs.createReadStream(file.path);
    var os = fs.createWriteStream(destPath);
    is.pipe(os);
    is.on('end', function() {
        fs.unlinkSync(file.path);
    });

    Project.findOne({'githubUsername': req.params.username, 'githubProjectName': req.params.project }, function (err, project) {
      if(err) { return handleError(res, err); }
      if(!project) { return res.send(404); }
      if(project.photos.length===10){
        var temp = project.photos.shift();
        var toRemove = path + '/' + temp;
        fs.unlinkSync(toRemove);
      }
      project.photos.push(name);
      project.save(function (err) {
          // TODO handle project saving error
      });
      return res.json(201, name);
    });
  });
};
