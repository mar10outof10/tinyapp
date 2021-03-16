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

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls", (req, res) => { // homepage/url-list
  const templateVars = { urls: urlDatabase, username: req.cookies["username"]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => { // user sends request to generate shortened url
  const longURL = req.body.longURL;
  if (Object.values(urlDatabase).indexOf((longURL)) > -1) {
    const shortURL = getKeyByValue(longURL);
    res.redirect(`/urls/${shortURL}`);
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
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const updatedLongURL = req.body.updatedLongURL;
  let shortURL = req.params.shortURL;
  // if updatedLongURL already exists in database, deletes shortURL being edited and redirects to existing shortURL
  if (Object.values(urlDatabase).indexOf((updatedLongURL)) > -1) {
    delete urlDatabase[shortURL];
    shortURL = getKeyByValue(updatedLongURL);
    res.redirect(`/urls/${shortURL}`);
  } else {
    urlDatabase[shortURL] = updatedLongURL;
    res.redirect(`/urls/${shortURL}`);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
})


app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});