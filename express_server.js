const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
// app.use(express.urlencoded()); // better version of bodyparser?? get more info
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

const users = {
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

const generateRandomString = () => {
  const charArr = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"; // length is 62
  let randString = '';
  for (let i = 0; i < 6; i++) {
    randString += charArr[(Math.floor(Math.random() * 62))]; // adds random letter from charArr
  }
  return randString;
};

// returns shortURL key for a given longURL value in the database. Returns false if not found.
const fetchShortURL = (longURL, database = urlDatabase) => {
  for (const shortURL in database) {
    if (database[shortURL].longURL === longURL) {
      return shortURL;
    }
  }
  return false;
};
// returns array of shortURLs whose id properties match the id parameter
const urlsForUser = (id, database = urlDatabase) => {
  const userURLs = [];
  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      userURLs.push(shortURL);
    }
  }
  return userURLs;
};


// returns userId for enterred email in database (Default db is users). Returns false if not found
const fetchUserId = (email, database = users) => {
  for (const user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return false;
};

app.get("/", (req, res) => {
  res.redirect('/login');
});

app.get("/urls", (req, res) => { // homepage/url-list
  const userID = req.cookies['user_id'];
  if (!userID) {
    res.redirect('/login');
    return;
  }
  const userURLs = urlsForUser(userID);
  const userObj = {};
  for (const url of userURLs) {
    userObj[url] = urlDatabase[url];
  }
  const templateVars = { urls: userObj, user: users[userID]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => { // user sends request to generate shortened url
  const longURL = req.body.longURL;
  if (fetchShortURL(longURL)) {
    const shortURL = fetchShortURL(longURL);
    res.redirect(`/urls/${shortURL}`);
    return;
  }
  const userID = req.cookies['user_id'];
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].id) {
    res.sendStatus(403); // 403 if authentication fails
    return;
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  if (!(req.cookies["user_id"])) {
    res.redirect('/login');
    return;
  }
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies['user_id'];
  if (userID !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(403); // 403 if authentication fails
    return;
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[userID] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body.updatedLongURL;
  const shortURL = req.params.shortURL;
  // if longURL already exists in database, deletes existing record
  if (fetchShortURL(longURL)) {
    const origShortURL = fetchShortURL(longURL);
    delete urlDatabase[origShortURL];
  }
  const userID = req.cookies['user_id']
  urlDatabase[shortURL] = { longURL, userID }
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], error: false };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email === '' || password === '') {
    // res.sendStatus(400).send('Email or password fields cannot be left blank');
    const templateVars = { user: users[req.cookies["user_id"]], error: 'Email or password fields cannot be left blank'};
    res.render("register", templateVars);
    return;
  }
  if (fetchUserId(email)) {
    // res.sendStatus(400).send(`Email ${email} is already registered`);
    const templateVars = { user: users[req.cookies["user_id"]], error: `Email ${email} is already registered` };
    res.render("register", templateVars);
    return;
  }
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = { id, email, password: hashedPassword };
  console.log(users[id]);
  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], error: false };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === '' || password === '') {
    // res.status(400).send('Email/password fields cannot be empty');
    const templateVars = { user: users[req.cookies["user_id"]], error: 'Email or password fields cannot be blank' };
    res.render("login", templateVars);
    return;
  }
  const userId = fetchUserId(email);
  if (!fetchUserId(email)) { // validates if email exists in database
    // res.status(403).send(`Email ${email} not found`);
    const templateVars = { user: users[req.cookies["user_id"]], error: 'Email not found' };
    res.render("login", templateVars);
    return;
  }
  if (bcrypt.compareSync(password, users[userId].password)) { // passwords match
    // res.status(403).send('Password incorrect');
    res.cookie('user_id', userId);
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: users[req.cookies["user_id"]], error: 'Password incorrect' };
  res.render("login", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});