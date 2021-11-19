const express = require('express');
const cors = require('cors');
require('dotenv').config();
const moment = require('moment');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const app = express();

//momgoose
const mongoUrl = process.env.MONGOURL;
mongoose.connect(mongoUrl, () => console.log('connected to mongo'));

//mongoose schema
const userSchema = new mongoose.Schema({
	username: String
});
const exerciseSchema = new mongoose.Schema({
	userId: String,
	description: String,
	duration: Number,
	date: Number
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
				username: user
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
		const all = await userModel.find();
		res.json(all);
	} catch (error) {
		res.json(error);
	}
});

//post exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
	const id = req.params._id;
	const description = req.body.description;
	const duration = parseInt(req.body.duration);
	const dateBody = new Date(req.body.date);
	const dateUnix = dateBody.getTime();
	const currentTime = new Date().getTime();
	try {
		//check if there is a user
		const exists = await userModel.findById(id);
		if (exists) {
			if (dateUnix) {
				const exercise = new exerciseModel({
					userId: id,
					description,
					duration,
					date: dateUnix
				});
				exercise.save();
				res.json({
					_id: id,
					username: exists.username,
					date: moment(
						new Date(dateUnix).toUTCString().split(',').join('').slice(0, 15),
						'ddd DD MMM YYYY'
					).format('ddd MMM DD YYYY'),
					duration,
					description
				});
			} else {
				const exercise = new exerciseModel({
					userId: id,
					description,
					duration,
					date: currentTime
				});
				exercise.save();
				res.json({
					_id: id,
					username: exists.username,
					date: moment(
						new Date(currentTime).toUTCString().split(',').join('').slice(0, 15),
						'ddd DD MMM YYYY'
					).format('ddd MMM DD YYYY'),
					duration,
					description
				});
			}
		} else {
			res.json('User not found');
		}
	} catch (error) {
		res.json(error);
	}
});

//get logs
app.get('/api/users/:_id/logs', async (req, res) => {
	const id = req.params._id;
	const fromBody = new Date(req.query.from);
	const fromUnix = fromBody.getTime();
	const toBody = new Date(req.query.to);
	const toUnix = toBody.getTime();
	const limit = req.query.limit ? parseInt(req.query.limit) : '';
	try {
		//check if user exists
		const user = await userModel.findById(id);
		if (user) {
			if (req.query.from && req.query.to) {
				const exercises = await exerciseModel
					.find(
						{
							$and: [{ userId: id }, { date: { $gte: fromUnix, $lte: toUnix } }]
						},
						{ __v: 0, _id: 0 }
					)
					.limit(limit);
				const exercisesString = exercises.map(
					(el) =>
						(el = {
							description: el.description,
							duration: el.duration,
							date: moment(
								new Date(el.date).toUTCString().split(',').join('').slice(0, 15),
								'ddd DD MMM YYYY'
							).format('ddd MMM DD YYYY')
						})
				);
				res.json({
					username: user.username,
					count: exercises.length,
					_id: user._id,
					log: exercisesString
				});
			} else {
				const exercises = await exerciseModel
					.find({ userId: id }, { __v: 0, _id: 0 })
					.limit(limit);
				const exercisesString = exercises.map(
					(el) =>
						(el = {
							description: el.description,
							duration: el.duration,
							date: moment(
								new Date(el.date).toUTCString().split(',').join('').slice(0, 15),
								'ddd DD MMM YYYY'
							).format('ddd MMM DD YYYY')
						})
				);
				res.json({
					_id: user._id,
					username: user.username,
					count: exercises.length,
					log: exercisesString
				});
			}
		} else {
			res.json('no user');
		}
	} catch (error) {
		res.json(error);
	}
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
});
