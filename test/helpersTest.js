const { assert } = require('chai');

const { fetchUserId, urlsForUser } = require('../helpers.js');

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

const testDatabase = {
'urlOne': { longURL: 'http://google.ca', userID: 'imuser1'},
'urlTwo': { longURL: 'http://wikipedia.org', userID: 'imuser1'},
'urlThree': { longURL: 'http://google.ca', userID: 'imuser2'},
'urlFour': { longURL: 'http://example.com', userID: 'imuser1'},
'urlFive': { longURL: 'http://google.com', userID: 'imuser3'},
'urlSix': { longURL: 'http://github.com', userID: 'imuser2'},
};

describe('fetchuserId', () => {
  it('should return a user with valid email', () => {
    const user = fetchUserId("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    assert.equal(user, expectedOutput);
  });
  it('should return undefined with an invalid email', () => {
    const user = fetchUserId("doesNotExist@example.com", testUsers)
    assert.isUndefined(user);
  });
});

describe('urlsForUser', () => {
  it('should return an array of shortURL strings whose userID properties match the id parameter', () => {
    const urlArray = urlsForUser("imuser2", testDatabase)
    const expectedOutput = ['urlThree', 'urlSix'];
    assert.deepEqual(urlArray, expectedOutput);
  });
  it('should return an empty list for a user with no URLs in the database', () => {
    const urlArray = urlsForUser("imuser8", testDatabase)
    assert.deepEqual(urlArray, []);
  });
});