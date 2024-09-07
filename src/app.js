const express = require('express');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const bodyParser = require('body-parser');
const auth = passport.authenticate('jwt', { session: false });
const errorHandler = require('./config/actions-runner/errorHandler');
require('dotenv').config();

const userController = require('./controllers/userController');
const authController = require('./controllers/authController');
const personaController = require('./controllers/personaController');
const paisController = require('./controllers/paisController');

const port = process.env.PORT || 3001;
const cors  = require('cors');

const app = express();
app.use(express.json()); 
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(cors())

function verifyToken(req, res, next) {
  const header = req.header("Authorization") || "";
  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not provied" });
  }
  try {
    const payload = jwt.verify(token, secretKey);
    req.username = payload.username;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token not valid" });
  }
}

app.get("/protected", verifyToken, (req, res) => {
  return res.status(200).json({ message: "You have access" });
});

passport.use(
  'oauth2',
  new OAuth2Strategy({
    authorizationURL: process.env.AUTHORIZATION_URL,
    tokenURL: process.env.TOKEN_URL,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
},

function(accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
}));

app.get('/auth/callback', 
  passport.authenticate('oauth2', { failureRedirect: '/' }),
  function(req, res) {
      res.redirect('/dashboard');
  }

);

app.use(errorHandler);

// Routes


app.use('/auth/provider', passport.authenticate('oauth2'));
app.use('/user', userController);
app.get('/', (req, res) => res.send('Easyapp Backend!'));
app.use('/auth', authController);
app.use('/persona', personaController);
app.use('/pais', paisController);

app.get('/', (req, res) => res.send('Easyapp Backend!'));
app.get('/user', userController);

app.use((err, req, res, next) => {
  console.error(err.stack); // Log errors
  res.status(err.status || 500).json({ message: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;

