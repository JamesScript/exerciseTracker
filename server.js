const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const shortid = require('shortid');

const cors = require('cors');

const mongoose = require('mongoose');
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' );

const UserSchema = new mongoose.Schema({
  username: String,
  id: String,
  exercises: Array
});

const User = mongoose.model('User', UserSchema);

const isValidDate = d => d instanceof Date && !isNaN(d);

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/api/exercise/users", (req, res) => {
  User.find((err, data) => {
    if (err) return console.error(err);
    res.json(data);
  });
});

app.get("/api/exercise/log", (req, res) => {
  const Q = req.query;
  User.find({id: Q.userId}, (err, data) => {
    if (err) return console.error(err);
    let output = {username: data[0].username, id: data[0].id, exercises: data[0].exercises.slice()};
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
    res.send(output);
  });
});

// Post requests
// Post new user
app.post("/api/exercise/new-user/", (req, res) => {
  User.find({username: req.body.username}, (err, data) => {
    if (err) return console.error(err);
    if (data.length > 0) {
      res.send("Username already taken. Your ID is: " + data[0].id);
    } else {
      const _id = shortid.generate();
      const userObj = {
        username: req.body.username, 
        id: _id,
        exercises: []
      };
      const userToAdd = new User(userObj);
      userToAdd.save((err, data) => {
        if (err) return console.error(err);
        res.send(userObj);
      });
    };
  });
});

// Post exercises for existing user
app.post("/api/exercise/add/", (req, res) => {
  const _id = req.body.userId;
  User.find({id: _id}, (err, data) => {
    if (err) return console.error(err);
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
    User.findOneAndUpdate({id: _id}, {exercises: exArr}, {new: true}, (err, data) => {
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