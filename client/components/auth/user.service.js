'use strict';
(function() {

function UserResource($resource) {
  return $resource('/api/users/:id/:controller', {
    id: '@_id'
  }, {
    pastUser: {
      method: 'PUT',
      params: {
        controller:'deactivate'
      }
    },
    currentUser: {
      method: 'PUT',
      params: {
        controller:'activate'
      }
    },
    changePassword: {
      method: 'PUT',
      params: {
        controller:'password'
      }
    },
    get: {
      method: 'GET',
      params: {
        id:'me'
      }
    },
    update: {
      method: 'PUT',
    },
    info: {
      method: 'GET',
    },
    past: {
      method: 'GET',
      params: {
        id:'past'
      },
      isArray:true
    },
    stats: {
      method: 'GET',
      params: {
        controller:'stats'
      },
    },
    smallgroup: {
      method: 'GET',
      params: {
        controller:'smallgroup'
      },
    },

    allstats: {
      method: 'GET',
      params: {
        controller:'adminstats'
      },
      isArray:true
    },
    privateInfo: {
      method: 'GET',
      params: {
        controller:'private'
      }
    },
    favoriteProjects: {
      method: 'GET',
      params: {
        controller:'favoriteProjects'
      },
      isArray:true
    }
  });
}

angular.module('observatory3App.auth')
  .factory('User', UserResource);

})();
