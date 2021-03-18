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

// must initialize empty databases
const urlDatabase = {};
const users = {};

app.get("/", (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  }
  res.redirect('/login');
});

// list of URLs
app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  if (!userID) { // redirects to /login if not logged in
    res.redirect('/login');
    return;
  }
  const userURLs = urlsForUser(userID, urlDatabase); // returns array of shortURL strings matching userID
  const userObj = {};
  for (const url of userURLs) { // populates userObj with shortURL objects matching userID
    userObj[url] = urlDatabase[url];
  }
  const templateVars = { urls: userObj, user: users[userID]};
  res.render("urls_index", templateVars);
});

// user sends request to generate shortened url
app.post("/urls", (req, res) => {
  const userID = req.session.userID;
  const longURL = req.body.longURL;
  if (!userID) { // no user logged in
    res.sendStatus(401);
  }
  const shortURL = generateRandomString(); // 6 character random string to be used as shortURL
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

// page with form to make new URL
app.get("/urls/new", (req, res) => {
  const userID = req.session.userID;
  if (!userID) { // no user logged in
    res.redirect('/login');
    return;
  }
  const templateVars = { user: users[userID] };
  res.render("urls_new", templateVars);
});

// page with shortURL info and form to edit associated longURL
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.userID;
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.sendStatus(404); // 404 if shortURL doesn't exist in database
    return;
  }
  if (userID !== urlDatabase[shortURL].userID) {
    res.sendStatus(403); // 403 if authentication fails
    return;
  }
  const templateVars = { shortURL, longURL: urlDatabase[shortURL].longURL, user: users[userID] };
  res.render("urls_show", templateVars);
});

// request edits longURL for target shortURL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.userID;
  if (urlDatabase[shortURL].userID !== userID) {
    res.sendStatus(403); // 403 if logged in user did not create this shortURL
    return;
  }
  const longURL = req.body.updatedLongURL;
  urlDatabase[shortURL] = { longURL }; // updates shortURL already in database with new longURL
  res.redirect(`/urls/${shortURL}`);
});

// deletes shortURL from database if logged in user created shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.userID !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(403); // 403 if authentication fails
    return;
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// redirects to longURL being shortened
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.sendStatus(404); // shortURL does not exist in database
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// page with form to register new user
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.userID], error: false };
  res.render("register", templateVars);
});

// submits registration request, redirects to /urls if valid
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email === '' || password === '') { // either field is left blank
    const templateVars = { user: users[req.session.userID], error: 'Email or password fields cannot be left blank'};
    res.render("register", templateVars);
    return;
  }
  if (fetchUserId(email, users)) { // email exists in database already
    const templateVars = { user: users[req.session.userID], error: `Email ${email} is already registered` };
    res.render("register", templateVars);
    return;
  }
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = { id, email, password: hashedPassword };
  req.session.userID = id;
  res.redirect('/urls');
});

// page with login form
app.get("/login", (req, res) => {
  if (req.session.userID) { // if logged in already, redirects
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: users[req.session.userID], error: false };
  res.render("login", templateVars);
});

// submits login request, redirects to /urls if valid login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === '' || password === '') { // either field left blank
    const templateVars = { user: users[req.session.userID], error: 'Email or password fields cannot be blank' };
    res.render("login", templateVars);
    return;
  }
  const userID = fetchUserId(email,users);
  if (!fetchUserId(email, users)) { // validates if email exists in database
    const templateVars = { user: users[req.session.userID], error: 'Email not found' };
    res.render("login", templateVars);
    return;
  }
  if (bcrypt.compareSync(password, users[userID].password)) { // passwords match
    req.session.userID = userID;
    res.redirect('/urls');
    return;
  }
  // reaches end only if username is in database but password does not match
  const templateVars = { user: users[req.session.userID], error: 'Password incorrect' };
  res.render("login", templateVars);
});

// clears login cookies
app.post("/logout", (req, res) => {
  req.session.userID = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});