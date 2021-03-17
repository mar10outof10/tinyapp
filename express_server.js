const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
// app.use(express.urlencoded()); // better version of bodyparser?? get more info
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

const getKeyByValue = (value, object = urlDatabase) => {
  return Object.keys(object).find(key => object[key] === value);
};

// returns userId for enterred email in database (Default db is users). Returns false if not found
const fetchEmail = (email, database = users) => {
  for (const user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return false;
}

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls", (req, res) => { // homepage/url-list
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => { // user sends request to generate shortened url
  const longURL = req.body.longURL;
  if (Object.values(urlDatabase).indexOf((longURL)) > -1) {
    const shortURL = getKeyByValue(longURL);
    res.redirect(`/urls/${shortURL}`);
    return;
  } 
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const updatedLongURL = req.body.updatedLongURL;
  let shortURL = req.params.shortURL;
  // if updatedLongURL already exists in database, deletes existing record
  if (Object.values(urlDatabase).indexOf((updatedLongURL)) > -1) {
    const origShortURL = getKeyByValue(updatedLongURL);
    delete urlDatabase[origShortURL];
  }
  urlDatabase[shortURL] = updatedLongURL;
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
    res.status(400);
    res.send('nooooo');
    return;
  }
  if (fetchEmail(email)) {
      const templateVars = { user: users[req.cookies["user_id"]], error: true };
      res.status(400);
      res.render("register", templateVars);
      return;
    }
  const id = generateRandomString();
  users[id] = { id, email, password };
  res.cookie('user_id', id);
  res.redirect('/urls');

});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], error: false };
  res.render("login", templateVars);
})

app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});