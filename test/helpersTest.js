const { assert } = require('chai');

const { fetchUserId } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('fetchuserId', function() {
  it('should return a user with valid email', function() {
    const user = fetchUserId("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    assert.equal(user, expectedOutput);
  });
  it('should return undefined with an invalid email', function() {
    const user = fetchUserId("doesNotExist@example.com", testUsers)
    assert.isUndefined(user);
  });
});