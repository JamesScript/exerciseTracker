const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const shortid = require('shortid');
const hash = require('object-hash');

const cors = require('cors');

const mongoose = require('mongoose');
mongoose.connect(process.env.MLAB_URI);

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  id: String,
  exercises: Array
});

const User = mongoose.model('User', UserSchema);

const isValidDate = d => d instanceof Date && !isNaN(d);

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static('public'));
app.use(express.static('scripts'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/api/exercise/users", (req, res) => {
  User.find((err, data) => {
    if (err) return console.error(err);
    res.json(data.map(d => d.username));
  });
});

app.get("/api/exercise/all", (req, res) => {
  User.find((err, data) => {
    if (err) return console.error(err);
    res.json(data.map(d => {
      return { 
        username: d.username,
        exercises: d.exercises
      };
    }));
  });
});

app.get("/api/exercise/log", (req, res) => {
  const Q = req.query;
  User.find({id: Q.userId}, (err, data) => {
    if (err) return console.error(err);
    let output = {username: data[0].username, exercises: data[0].exercises.slice()};
    if (Q.from) {
      const fromDate = new Date(Q.from);
      if (!isValidDate(fromDate)) return res.send("Invalid Date");
      output.exercises = output.exercises.filter(datum => (new Date(datum.date)) >= fromDate);
    }
    if (Q.to) {
      const toDate = new Date(Q.to);
      if (!isValidDate(toDate)) return res.send("Invalid Date");
      output.exercises = output.exercises.filter(datum => (new Date(datum.date)) <= toDate);
    }
    if (Q.limit && output.exercises.length > Q.limit) {
      const excess = output.exercises.length - Q.limit;
      for (let i = 0 ; i < excess; i++) {
        output.exercises.pop();
      }
    }
    res.json(output);
  });
});

// Post requests
// Post new user
app.post("/api/exercise/new-user/", (req, res) => {
  const _user = req.body.username;
  const _pw = hash(req.body.password + process.env.SALT);
  User.find({username: _user}, (err, data) => {
    if (err) return console.error(err);
    if (data.length > 0) {
      res.send("Username already taken. <br> Your ID is: " 
               + data[0].id
               + "<br><a href='https://jc-fcc-exercise-tracker.glitch.me/'>Back</a>"
              );
    } else {
      if (req.body.password.length < 1) return res.send("Please enter a password");
      const _id = shortid.generate();
      const userObj = {
        username: _user, 
        password: _pw,
        id: _id,
        exercises: []
      };
      const userToAdd = new User(userObj);
      userToAdd.save((err, data) => {
        if (err) return console.error(err);
        res.send("Success! Your user ID is " + userObj.id + ". Please write this down somewhere");
      });
    };
  });
});

// Post exercises for existing user
app.post("/api/exercise/add/", (req, res) => {
  const _id = req.body.userId;
  const _pw = hash(req.body.password + process.env.SALT);
  // Prior to this, user used ID to sign in, now it's their username
  User.find({username: _id}, (err, data) => {
    if (err) return console.error(err);
    if (!data.length) return res.send("Username not found.");
    if (_pw !== data[0].password) return res.send("Incorrect Password. I don't know how to do password resets yet. Tough luck mate!");
    let exArr = data[0].exercises.slice();
    const d = req.body.date;
    if (!isValidDate(new Date(d))) return res.send("Invalid Date");
    const date = d === "" ? new Date() : new Date(d);
    const exercise = {
      description: req.body.description,
      duration: req.body.duration,
      date: date
    };
    exArr.push(exercise);
    User.findOneAndUpdate({username: _id}, {exercises: exArr}, {new: true}, (err, data) => {
      if (err) return console.error(err);
      const resObj = {
        username: data.username,
        id: data.id,
        exercises: data.exercises
      }
      res.json(resObj); 
    });
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'});
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || 'Internal Server Error';
  }
  res.status(errCode)
    .type('txt')
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});