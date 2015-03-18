'use strict';

var User = require('./user.model');
var Commit = require('../commit/commit.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var md5 = require('MD5');

var validationError = function(res, err) {
  return res.json(422, err);
};

/**
 * Get list of users
 * restriction: 'admin'
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
 */
exports.stats = function(req, res) {
  // Only return users who are active and have a github login
  User.find({active: true, 'github.login': {$exists: true}}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);

    var twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate()-14);

    var count = users.length;
    var data = [];

    for (var i = 0; i < users.length; i++){
        (function(user){
          Commit
          .find()
          .where('userId').equals(String(user._id))
          .where('date').gt(twoWeeks)
          .exec(function(err, commits){
              if (err) return res.send(500, err);
              var userInfo = {};
              userInfo = JSON.parse(JSON.stringify(user));
              userInfo.attendance = 0;
              userInfo.commits = commits;
              data.push(userInfo);

              count--;
              if (count === 0){
                res.json(200, data);
              }

          });
        })(users[i]);
    };
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
  newUser.avatar = makeAvatar(newUser.email);
  newUser.save(function(err, user) {
    if (err) return validationError(res, err);
    var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
    res.json({ token: token });
  });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.json(user.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.send(500, err);
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
 * Deactivates a user
 */
exports.deactivate = function(req, res, next) {
  var userId = String(req.params.id);


  User.findOne({ '_id': userId}, function(err, user){
    if (err) return res.send(500, err);

    user.active = false;
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
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.json(401);
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
    }, function(err){
        res.send({"success":(err !== 0)});
    });
};

/**
* Get gravatar url
*
* @return {String}
* @api public
*/
var makeAvatar = function(email) {
  if (email){
    return 'http://www.gravatar.com/avatar/'+md5(email.trim().toLowerCase());
  }
  return  'http://www.gravatar.com/avatar/00000000000000000000000000000000';

};
