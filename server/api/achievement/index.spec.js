'use strict';
import {seed} from '../../config/seed';
import {getSessionFor} from '../../auth/util.integration';
import Achievement from '../achievement/achievement.model';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

describe('GET /api/achievements', function() {

  it('should respond with JSON array', function(done) {
    request(app)
      .get('/api/achievements')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Array);
        done();
      });
  });
});

describe('POST /api/achievements', function() {
    before(seed);
    var adminSession;
    var id;
    before(() => getSessionFor('admin').then(session => adminSession = session));

    it('should create an achievement', done => {
       adminSession
        .post('/api/achievements')
        .send({
          title: "Created first project",
          description: "RCOS' first project! yay!"
        })
        .end((err, res) => {
          expect(res.status).to.equal(201);
          done(err);
        });
    });

    it('should delete an acheivement', done => {
      var test_id = "000000000000000000000010"
      adminSession
        .delete('/api/achievements/'+test_id)
        .end((err, res) => {
          expect(res.status).to.equal(204);
          done(err);
        });
    });
  });
