'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var Commit = require('../commit/commit.model');
var mongoose = require('mongoose');
var request = require('request');


var validationError = function(res, err) {
  return res.json(422, err);
};

/**
 * Get list of users
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);
    res.json(200, users);
  });
};

/**
 * Get list of users with stats including last commits
 * in previous 2 weeks
 * restriction: 'admin'
 */
exports.stats = function(req, res) {
  // Only return users who are active and have a github login
  User.find({active: true, 'github.login': {$exists: true}}, '-salt -hashedPassword' ).exec(function (err, users) {
    if(err) return res.send(500, err);
    var twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate()-14);
    var userInfo = [];
    var count = users.length;

    var getCommits = function(user){
      Commit.find()
            .where('author.login').equals(String(user.github.login))
            .where('date').gt(twoWeeks)
            .exec(function(err, commits){
                var commitList = [];
                commits.forEach(function (c){
                    commitList.push(c.toObject());
                  }
                )
                user.commits = commitList ;
                count--;
                userInfo.push(user);
                if (count === 0){
                  res.json(200, userInfo);
                }
            });
    }

    for (var i = 0; i < users.length; i++){
      var u = users[i].stats;
      getCommits(u);
      }
    });
};

/**
* Get list of all users with stats including last commits
* in previous 2 weeks including inactive
* restriction: 'admin'
 */
exports.allStats = function(req, res) {
  // Only return users who are active and have a github login
  User.find({'github.login': {$exists: true}}, '-salt -hashedPassword' ).exec(function (err, users) {
    if(err) return res.send(500, err);
    var twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate()-14);
    var userInfo = [];
    var count = users.length;

    var getCommits = function(user){
      Commit.find()
            .where('author.login').equals(String(user.github.login))
            .where('date').gt(twoWeeks)
            .exec(function(err, commits){
                if(err){
                    user.commits = [] ;
                    count--;
                    userInfo.push(user);
                    if (count === 0){
                      res.json(200, userInfo);
                    }
                }
                else{
                    var commitList = [];
                    commits.forEach(function (c){
                        commitList.push(c.toObject());
                      }
                    )
                    user.commits = commitList ;
                    count--;
                    userInfo.push(user);
                    if (count === 0){
                      res.json(200, userInfo);
                    }
                }

            });
    }

    for (var i = 0; i < users.length; i++){
      var u = users[i].stats;
      getCommits(u);
      }
    });
};

/**
 * Get list of active users
 */
exports.list = function(req, res) {
  // Only return users who are active and have a github login
  User.find({active: true, 'github.login': {$exists: true}}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);
    var userInfo = [];

    for (var i = 0; i < users.length; i++){
      userInfo.push(users[i].listInfo);
    }
    res.json(200, userInfo);
  });
};

/**
 * Get list of all past users
 */
exports.past = function(req, res) {
  User.find({active: false}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);
      var userInfo = [];

      for (var i = 0; i < users.length; i++){
        userInfo.push(users[i].listInfo);
      }
      res.json(200, userInfo);
  });
};

/**
 * Get a list of all the recent RCOS commits for a user
 */
exports.commits = function(req, res) {
  var userId = String(req.params.id);

  Commit.find({ userId: userId}, function(err, commits){
    if (err) return res.send(500, err);
    res.json(200, commits);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.github.profile_url = 'https://github.com/'+newUser.github.login
  request(newUser.github.profile_url, function (error, response, body) { //TODO Switch to github api
    if (!error && response.statusCode == 200) {
      newUser.save(function(err, user) {
        if (err) return validationError(res, err);
        var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
        res.json({ token: token });
      });
    }
    else{
      return validationError(res, "Invalid Github Username");
    }
  })

};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user){ return UserNotFoundError(res);}
    res.json(user.profile);
  });
};


/**
 * Get a single user by github name or id
 */
exports.showByName = function (req, res, next) {
  var param = req.params.url.toLowerCase();
  User.findOne({'github.login':param}, function (err, userByName) {

    if (err) return next(err);
    if (!userByName){
      try{
        var id = mongoose.Types.ObjectId(param);
        User.findById(mongoose.Types.ObjectId(param), function (err, userById) {
          if (err) return next(err);
          if (!userById){ return UserNotFoundError(res);}
          res.json(userById.profile);
        });
      }
      catch(tryErr){
        return UserNotFoundError(res);
      }

    }
    else{
      res.json(userByName.profile);

    }
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.send(500, err);
    if(!user) {return UserNotFoundError(res);}
    return res.send(204);
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if (err) return res.send(500, err);
    if (!user){return UserNotFoundError(res);}
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
};

/**
 * Changes a user's bio
 */
exports.changeBio = function(req,res){
    var userId = req.user._id;
    var newBio = String(req.body.bio);

    User.findById(userId, function(err,user){
        if (err) return res.send(500, err);
        if (!user){return UserNotFoundError(res);}
        user.bio = newBio;
        if (err) return res.send(500, err);

        user.save(function(err){
            if (err) return validationError(res,err);
            res.send(200);
        })
    });
};

/**
 * Deactivates a user
 */
exports.deactivate = function(req, res, next) {
  var userId = String(req.params.id);

  User.findById(userId, function(err, user){
    if (err) return res.send(500, err);
    if (!user){return UserNotFoundError(res);}

    user.active = false;
    user.save(function(err){
    if (err) return res.send(500, err);
      res.json(200, {success: true});
    })
  });
};

/**
 * Activates a user
 */
exports.activate = function(req, res, next) {
  var userId = String(req.params.id);


  User.findById(userId, function(err, user){
    if (err) return res.send(500, err);
    if (!user){return UserNotFoundError(res);}

    user.active = true;
    user.save(function(err){
    if (err) return res.send(500, err);
      res.json(200, {success: true});
    })
  });
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findById(userId, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user){return UserNotFoundError(res);}
    res.json(user);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

/**
 * Mark attendance for specified user
 */
exports.attendance = function(req,res){
    var userId = req.params.id;
    var result = User.update({
        _id: userId
    },{
        $push: {
            attendance: new Date()
        }
    }, function(err, user){
        if (err) return res.send(500, err);
        if (!user){return UserNotFoundError(res);}

        res.send({"success":(err !== 0)});
    });
};

/**
 * Add an item to the tech array for a user
 */
exports.addTech = function(req,res){
    var userId = req.params.id;
    var newTech = req.body.tech;
    User.findById(userId, function(err,user){
        if (err){ res.send(500, err);}
        else if (!user){return UserNotFoundError(res);}

        else{
            if (!user.tech) user.tech = [];
            user.tech.push(newTech);
            user.save(function(err) {
                if (err) return validationError(res, err);
                res.send(200);
            });
        }
    });
};

/**
 * Remove an item from the tech array for a user
 */
exports.removeTech = function(req,res){
    var userId = req.params.id;
    var tech = req.body.tech;
    User.findById(userId, function(err,user){
        if (err){ res.send(500, err);}
        else if (!user){return UserNotFoundError(res);}
        else{
            if (!user.tech) user.tech = [];
            user.tech.splice(user.tech.indexOf(tech), 1);
            user.save(function(err) {
                if (err) return validationError(res, err);
                res.send(200);
            });
        }
    });
};
function UserNotFoundError(res) {
  return res.status(404).send("User not found");
}
