// generates random 6 character string
const generateRandomString = () => {
  const charArr = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"; // length is 62
  let randString = '';
  for (let i = 0; i < 6; i++) {
    randString += charArr[(Math.floor(Math.random() * 62))]; // adds random letter from charArr
  }
  return randString;
};

// returns array of shortURLs whose id properties match the id parameter
const urlsForUser = (id, database) => {
  const userURLs = [];
  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      userURLs.push(shortURL);
    }
  }
  return userURLs;
};

// returns userId for enterred email in database. Returns undefined if not found
const fetchUserId = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return;
};

module.exports = { generateRandomString, urlsForUser, fetchUserId };