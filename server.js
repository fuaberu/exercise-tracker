const express = require('express');
var bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();

//momgoose
const mongoUrl = process.env.MONGOURL;
mongoose.connect(mongoUrl, () => console.log('connected to mongo'));

//mongoose schema
const userSchema = new mongoose.Schema({
	username: String,
});
const exerciseSchema = new mongoose.Schema({
	userId: String,
	description: String,
	duration: Number,
	date: Date,
});

//mongoose model
const userModel = mongoose.model('users', userSchema);
const exerciseModel = mongoose.model('exercises', exerciseSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html');
});
//add user
app.post('/api/users', async (req, res) => {
	const user = req.body.username;
	try {
		//check if user exists
		const exists = await userModel.find({ username: user }, { __v: 0 });
		if (exists.length === 0) {
			//add user
			const newUser = new userModel({
				username: user,
			});
			newUser.save();
			res.json(newUser);
		} else {
			res.json(exists[0]);
		}
	} catch (error) {
		res.json(error);
	}
});

//get all users
app.get('/api/users', async (req, res) => {
	try {
		//check if user exists
		const all = await userModel.find();
		res.json(all);
	} catch (error) {
		res.json(error);
	}
});

//post exercise
app.post('/api/users/:_id/exercises', (req, res) => {
	const id = req.params._id;
	const description = req.body.description;
	const duration = parseInt(req.body.duration);
	const date = req.body.date;
	if (!date) {
		const exercise = new exerciseModel({
			userId: id,
			description: description,
			duration: duration,
			date: Date.now(),
		});
		exercise.save();
		res.json(exercise);
	} else {
		const exercise = new exerciseModel({
			userId: id,
			description: description,
			duration: duration,
			date: date,
		});
		exercise.save();
		res.json(exercise);
	}
});

//get logs
app.get('/api/users/:_id/logs', async (req, res) => {
	const id = req.params._id;
	const from = req.query.from;
	const to = req.query.to;
	const limit = req.query.limit;
	try {
		//check if user exists
		const user = await userModel.find({ _id: id });
		if (user.length !== 0) {
			const exercises = await exerciseModel.find({ userId: id });

			res.json({
				username: user[0].username,
				count: exercises.length,
				_id: user[0]._id,
				log: exercises,
			});
		}
	} catch (error) {
		res.json(error);
	}
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
});
