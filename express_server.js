const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const { generateRandomString, urlsForUser, fetchUserId } = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.set("view engine", "ejs");

const urlDatabase = {};

const users = {};

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  res.redirect('/login');
});

app.get("/urls", (req, res) => { // homepage/url-list
  const userID = req.session.user_id;
  if (!userID) {
    res.redirect('/login');
    return;
  }
  const userURLs = urlsForUser(userID, urlDatabase);
  const userObj = {};
  for (const url of userURLs) {
    userObj[url] = urlDatabase[url];
  }
  const templateVars = { urls: userObj, user: users[userID]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => { // user sends request to generate shortened url
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  if (!userID) {
    res.sendStatus(401);
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  if (!(req.session.user_id)) {
    res.redirect('/login');
    return;
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.sendStatus(404);
    return;
  }
  if (userID !== urlDatabase[shortURL].userID) {
    res.sendStatus(403); // 403 if authentication fails
    return;
  }
  const templateVars = { shortURL, longURL: urlDatabase[shortURL].longURL, user: users[userID] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  if (urlDatabase[shortURL].userID !== userID) {
    res.sendStatus(403);
    return;
  }
  const longURL = req.body.updatedLongURL;
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(403); // 403 if authentication fails
    return;
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.sendStatus(404);
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id], error: false };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email === '' || password === '') {
    const templateVars = { user: users[req.session.user_id], error: 'Email or password fields cannot be left blank'};
    res.render("register", templateVars);
    return;
  }
  if (fetchUserId(email, users)) {
    const templateVars = { user: users[req.session.user_id], error: `Email ${email} is already registered` };
    res.render("register", templateVars);
    return;
  }
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = { id, email, password: hashedPassword };
  req.session.user_id = id;
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  if (req.session.user_id) { // if logged in already, redirects
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: users[req.session.user_id], error: false };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === '' || password === '') {
    const templateVars = { user: users[req.session.user_id], error: 'Email or password fields cannot be blank' };
    res.render("login", templateVars);
    return;
  }
  const userId = fetchUserId(email,users);
  if (!fetchUserId(email, users)) { // validates if email exists in database
    const templateVars = { user: users[req.session.user_id], error: 'Email not found' };
    res.render("login", templateVars);
    return;
  }
  if (bcrypt.compareSync(password, users[userId].password)) { // passwords match
    req.session.user_id = userId;
    res.redirect('/urls');
    return;
  }
  // reaches end only if username is in database but password does not match
  const templateVars = { user: users[req.session.user_id], error: 'Password incorrect' };
  res.render("login", templateVars);
});

app.post("/logout", (req, res) => { // clears login cookies
  req.session.user_id = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});