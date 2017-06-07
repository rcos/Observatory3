'use strict';

angular.module('observatory3App')
.controller('blogEditController', function($scope, $location, $http, $uibModalInstance, Auth, editBlog, projectId, notify){
  $scope.blog = {};
  $scope.editing = false;
  $scope.projectId = projectId;

  if (editBlog) {
    $scope.blog = editBlog;
    $scope.editing = true;
  }else{
    $scope.blog.tags = [];
  }
  $scope.submit = function(form) {
    $scope.submitted = true;

    if(form.$valid) {
      if (!$scope.editing){
        $scope.blog.projectId = $scope.projectId;

        $http.post('/api/posts' , $scope.blog ).then(function(){
          notify('Post created!');
          $uibModalInstance.close($scope.project);

        },function(err){
          err = err.data;
          $scope.errors = {};

          // Update validity of form fields that match the mongoose errors
          angular.forEach(err.errors, function(error, field) {
            form[field].$setValidity('mongoose', false);
            $scope.errors[field] = error.message;
          });

        });

      }
      else{
        $http.put('/api/posts/' + $scope.blog._id, {
          'title': $scope.blog.title,
          'content': $scope.blog.content,
          'tags' : $scope.blog.tags
        }).then(function(){
          notify('Post updated!');
          $uibModalInstance.close($scope.project);

        },function(err){
          err = err.data;
          $scope.errors = {};

          // Update validity of form fields that match the mongoose errors
          angular.forEach(err.errors, function(error, field) {
            form[field].$setValidity('mongoose', false);
            $scope.errors[field] = error.message;
          });

        });
      }

    }
  };
  $scope.close = function(){
    // $uibModalInstance.close($scope.event);
    $uibModalInstance.dismiss('cancel');
  };

  $scope.canEdit = function(){
    return true;
  };

});
