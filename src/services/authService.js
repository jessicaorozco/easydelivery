const passport = require("passport");
const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");

require("dotenv").config();

const LocalStrategy = require("passport-local").Strategy;
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const userService = require('../services/userService');
const userSchema = require('../models/userSchema');
// function generateRandomToken(length = 3) {
//   return crypto.randomBytes(length).toString("hex");
// }

// const generateToken = async (req, res) => {
//   try {
//     const token = generateRandomToken(3);
//     // console.log(token);
//     res.status(200).json(token);
//   } catch (err) {
//     res.status(500).send({
//       message: err.message || "Error al realizar la búsqueda",
//     });
//   }
// };

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const loginLocal = async (req, res) => {
  passport.use(
    'oauth2',
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        const client = await MongoClient.connect(process.env.URI);
        try {
          const correo = req.body.email;
          const clave = req.body.password;
          const db = client.db("easyDb");
          const collection = db.collection("user");
          const filter = { email: correo, password: clave };
          const user = await collection.findOne(filter);

          if (!user) {
            return done(null, false, { message: "User not found" });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect password" });
          }

          return done(null, user);
        } catch (error) {
          console.error("Error fetching iso:", error);
          res.status(500).json({ error: "Internal server error" });
        } finally {
          await client?.close();
        }
      }
    )
  );
};

const getTokenJwt = async (req, res) => {
  try {
    const payload = {
      _id: req.body._id,
      email: req.body.email,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); 
    console.log(token);
    res.status(200).json(token);
    await sendEmail();
  } catch (error) {
    console.error("Error generating JWT:", error);
    throw error; 
  }
};

const sendEmail = async (token, correo) => {
  try {
     const mailOptions = {
      from: "jnorozcostore@gmail.com",
      to:  correo,
      subject: "Login Token for Your Account",

      html: `Click the link below to access your account:<br />
              <a href="http://your-app-domain/login?token=${token}">Login Link</a><br />
              This token is valid for 1 hour.`,
    };
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const loginOther = async(req, res)=> {
  try {
    const user= await userService.getEmail(req, res);
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      const token = await getTokenJwt();
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const receipJwt = async(req, res) => {
  const bearerHeader = req.headers["authorization"];

  if (!bearerHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.status(200).json(req.body);
  })(req, res);
};

// const generateToken = async(req, res) => {
// const opts = {};
// opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
// opts.secretOrKey = process.env.JWT_SECRET; 
// payload = {
//   _id: req.body._id,
//   password: req.body.password,
//   email: req.body.email,
// };
// passport.use(
//   new JwtStrategy(opts, (payload, done) => {
//     userService.findById(payload._id)
//       .then(user => {
//         if (user) {
//           return done(null, user);

//         } else {
//           return done(null, false);
//         }
//       })
//       .catch(err => {
//         console.error('Error al buscar usuario:', err);
//         return done(err, false);
//       });
//   })
// );
// }

const generateToken = async (req, res) => {
  try {
    const { email, password } = req.body; 

    const user = userService.findByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' }); 
    }

    if (!await userSchema.methods.isEmailValid(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!await userSchema.isValidPassword(password)) {
      return res.status(401).json({ message: 'Invalid credentials' }); 
    }


    const payload = { _id: user._id };


    const opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = process.env.JWT_SECRET;

    passport.use(
      new JwtStrategy(opts, (jwt_payload, done) => {
        userService.findById(jwt_payload._id)   

          .then(user => {
            if (user) {
              return done(null, user);
            } else {
              return done(null, false);
            }
          })
          .catch(err => {
            console.error('Error al buscar usuario:', err);
            return done(err, false);
          });
      })
    );

    const token = await signToken(payload, opts.secretOrKey); 

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const signToken = async (payload, secret) => {
  return jwt.sign(payload, secret, { expiresIn: '1h' }); 
};


module.exports = {
  passport,
  generateToken,
  sendEmail,
  loginOther,
  receipJwt,
  loginLocal,
  getTokenJwt
};
