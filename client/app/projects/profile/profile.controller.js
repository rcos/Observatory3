/*jshint multistr: true */
'use strict';

angular.module('observatory3App')
.controller('ProjectsProfileCtrl', function ($scope, $http, $modal, Auth, $stateParams, Project, RSSService, Upload, notify) {
    $scope.userOnProject = false;
    var updateProject = function(){
        Project.getProject($stateParams.username, $stateParams.project).then(function(result) {
            $scope.project = result.data;
            initializeSlides($scope.project.photos);
            getAuthors();
            if ($scope.project.blogType === 'RSS') {
                RSSService.parseFeed($scope.project.blogUrl).then(function(data) {
                    if (data && data.data && data.data.responseData && data.data.responseData.feed) {
                        $scope.project.feed = data.data.responseData.feed;
                    }
                });
            }

            Auth.isLoggedInAsync(function(loggedIn){
                if (loggedIn){
                    var user = Auth.getCurrentUser();
                    $scope.user = user;
                    $scope.checkUserProject();
                }
            });
        });
    };
    updateProject();

    var getAuthors = function() {
        var project = $scope.project;
        $http.get('/api/projects/' + project._id + '/authors')
            .success(function(authors){
                $scope.authors = authors;
            });
    }

    $scope.getPic = function(user) {

        if (! ('avatar' in user)){
            user.avatar = "http://www.gravatar.com/avatar/00000000000000000000000000000000?d=monsterid";
            $http.get('/api/users/' + user._id + '/avatar')            .success(function(avatar){
                user.avatar = avatar;
            })
        }
        return user.avatar
    }

    var initializeSlides = function(photos) {
        var slides = [];
        for (var i = 0; i < photos.length; i++){
            slides.push({
                active: false,
                src: photos[i]
            });
            if (i === 0) {
                slides[0].active = true;
            }
        }
        $scope.slides = slides;
    }

    var setActiveSlide = function(photoName){
        for (var i = 0; i < $scope.slides.length; i++){
            if ($scope.slides[i].src === photoName){
                $scope.slides[i].active = true;
            } else {
                $scope.slides[i].active = false;
            }
        }
    };
    updateProject();

    var getAuthors = function() {
        var project = $scope.project;
        $http.get('/api/projects/' + project._id + '/authors')
        .success(function(authors){
            $scope.authors = authors;
        });
    };

    var initializeSlides = function(photos) {
        var slides = [];
        for (var i = 0; i < photos.length; i++){
            slides.push({
                active: false,
                src: photos[i]
            });
            if (i === 0) {
                slides[0].active = true;
            }
        }
        $scope.slides = slides;
    };

    var setActiveSlide = function(photoName){
        for (var i = 0; i < $scope.slides.length; i++){
            if ($scope.slides[i].src === photoName){
                $scope.slides[i].active = true;
            } else {
                $scope.slides[i].active = false;
            }
        }
    };

    var addSlide = function(photoName){
        $scope.slides.push({
            active: false,
            src: photoName
        });
        setActiveSlide(photoName);
    };

    var removeSlide = function(photoName){
        for (var i = 0; i < $scope.slides.length; i++){
            if ($scope.slides[i].src === photoName){
                $scope.slides.splice(i, 1);
            }
        }
    };


    $scope.imgPrefix = '/uploads/' + $stateParams.username + '/' + $stateParams.project + '/';
    $scope.isLoggedIn = Auth.isLoggedIn;

    $scope.editProjectDetails = function() {
        var modal = $modal.open({
            templateUrl: '/app/projects/editProjectModal.html',
            controller: function($scope, $modalInstance, project) {
                $scope.project = project;
                $scope.blogTypes = [
                    {
                        label: 'RSS',
                        value: 'RSS'
                    },
                    {
                        label: 'External',
                        value: 'EXTERNAL'
                    }
                ];
            },
            resolve: {
                project: function() {
                    return $scope.project;
                }
            }
        });

        modal.result.then(function(projectInfo) {
            $scope.newProject = projectInfo;
            return $http.put('/api/projects/' + $scope.project._id, $scope.project);
        }).then(function() {;
            notify('Project updated');
            $scope.project = _.clone(newProject);
        });
    };

    $scope.hasRSSFeed = function(){
        return $scope.project && !!$scope.project.blogUrl
                && $scope.project.blogType === 'RSS';
    };

    $scope.joinProject = function(){
        $http.put('/api/users/' + $scope.user._id + '/project',{
            'project': $scope.project._id
        }).success(function(){
            notify({ message: "You are now on this project!"  });
            $scope.userOnProject = true;
            $scope.user.projects.push($scope.project._id);
            getAuthors();
        }).error(function(){
            notify({message: 'Error adding user to project!', classes: ["alert-danger"]});
        });
    };

    $scope.leaveProject = function(){
        var loggedInUser = Auth.getCurrentUser();
        $http.delete('/api/users/' + loggedInUser._id + '/project',
        {
            'project': $scope.project._id
        }).success(function(){
            notify({message: "You are now off this project!", classes: []});
            $scope.user.projects.splice($scope.user.projects.indexOf($scope.project._id), 1);
            $scope.userOnProject = false;
            getAuthors();
        }).error(function(){
            notify({message: 'Error removing user from project!', classes: ["alert-danger"]});
        });
    };

    $scope.checkUserProject = function() {
        $scope.userOnProject = $scope.user.projects.indexOf($scope.project._id) !== -1;
    };

    $scope.upload = function($file) {
        Upload.upload({
            url: 'api/projects/'+$stateParams.username+'/'+$stateParams.project+'/upload',
            data: {file: $file}
        }).success(function (data) {
            addSlide(data);
            updateProject();
        }).error(function (data, status) {
            console.log('error status: ' + status);
        });
    };

    $scope.deletePhoto = function(){
        var username = $scope.project.githubUsername;
        var projectName = $scope.project.githubProjectName;
        var activePhoto = $scope.slides.filter(function (s) { return s.active; })[0];
        if (activePhoto){
            $http.delete('/api/projects/' +  username + '/' + projectName + '/' + activePhoto.src)
            .success(function(){
                removeSlide(activePhoto.src);
            });
        }
    };
});