define({ "api": [
  {
    "type": "GET",
    "url": "/api/commit/",
    "title": "Index",
    "name": "Index",
    "group": "Commit_Controller",
    "description": "<p>Gets list of commits by using the Commit.find function. Send an error if it doesn't work, otherwise return json file of commits.</p>",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "index",
            "description": "<p>File with list of commits</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error": [
          {
            "group": "Error",
            "optional": false,
            "field": "500",
            "description": "<p>Internal server error</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./commit.controller.js",
    "groupTitle": "Commit_Controller"
  },
  {
    "type": "GET",
    "url": "/api/commit/",
    "title": "Show",
    "name": "Show",
    "group": "Commit_Controller",
    "description": "<p>Shows a single commit.</p>",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "show",
            "description": "<p>file with one commit</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error": [
          {
            "group": "Error",
            "optional": false,
            "field": "404",
            "description": "<p>no commits found</p>"
          },
          {
            "group": "Error",
            "optional": false,
            "field": "500",
            "description": "<p>Internal server error</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./commit.controller.js",
    "groupTitle": "Commit_Controller"
  },
  {
    "type": "GET",
    "url": "/api/commit/",
    "title": "showProjectCommits",
    "name": "showProjectCommits",
    "group": "Commit_Controller",
    "description": "<p>Shows a list of a project's commits</p>",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "showProjectCommits",
            "description": "<p>File with a list of commits</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error": [
          {
            "group": "Error",
            "optional": false,
            "field": "404",
            "description": "<p>no commits found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./commit.controller.js",
    "groupTitle": "Commit_Controller"
  },
  {
    "type": "GET",
    "url": "/api/commit/",
    "title": "showUserCommits",
    "name": "showUserCommits",
    "group": "Commit_Controller",
    "description": "<p>Shows a list of commits by a user within a certain timeperiod</p>",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "showUserCommits",
            "description": "<p>File with a list of commits</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./commit.controller.js",
    "groupTitle": "Commit_Controller"
  }
] });