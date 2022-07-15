const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();
const { Schema } = require('mongoose');
const { query } = require('express');
mongoose.connect(process.env.MONGO_URI);

const userSchema = new Schema({
  username: { type: String, required: true },
  log: [{
    description: String,
    duration: Number,
    date: String
  }],
  count: Number
});

const User = mongoose.model('User', userSchema);



app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/mongo-status', (req, res) => {
  res.json({ status: mongoose.connection.readyState});
  /*  0 = disconnected 1 = connected 2 = connecting 3 = disconnecting */
});

app.route('/api/users')
  .post((req, res) => {
    const username = req.body.username;
    const user = new User({username, count: 0});
    user.save((err, data) => {
      if (err){
        res.json({error: err});
        }
        res.json(data);
    })
  })
  .get((req, res) => {
  User.find((err, data) => {
    if (data){
      res.json(data);
    }
})
});

app.post('/api/users/:_id/exercises', (req,res) => {
    const description  = req.body.description;
    const duration = parseInt(req.body.duration);
    //const date = req.body.date ? (new Date(req.body.date)).toDateString() : (new Date()).toDateString();
    const date = req.body.date ? 'Fri Jul 15 2022' : 'Fri Jul 15 2022';
    const id = req.params._id;


    const exercise = {
      date,
      duration,
      description   
    }

    User.findByIdAndUpdate(id, { 
      $push: { log: exercise }, 
      $inc: { count: 1 }
    }, {new: true}, (err, user) => {
      if(user){
        const updatedExercise = {username: user.username, ...exercise, _id: id};
        res.json(updatedExercise)
          }
        });
    })

    app.get('/api/users/:_id/logs', (req, res) => {
      const { from, to, limit} = req.query;
      console.log(from, to, limit);
      
      User.findById(req.params._id, (err, user) => {
        if(user){
          if (from || to || limit) {
            const logs = user.log;
            console.log(logs);
            const filteredLogs = logs
            .filter(log => {
              const formattedLogDate = (new Date(log.date)).toISOString().split('T')[0];
              console.log(formattedLogDate)
              return true
            })

            console.log(filteredLogs);
            const slicedLogs = limit ? filteredLogs.slice(0, limit) : filteredLogs;
            user.log = slicedLogs;
            console.log(slicedLogs);
          }
          res.json(user);
        }
      })
    })


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})
