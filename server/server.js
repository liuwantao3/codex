import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Configuration, OpenAIApi } from 'openai';
import { MongoClient } from 'mongodb';
import Chat from './chat.js';
import { createUser, authUser } from './user.js';

dotenv.config();

const chat = new(Chat);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

// Set up MongoDB client
export const mongoClient = new MongoClient(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoClient.connect();

// Define JWT secret
export const jwtSecret = process.env.JWT_SECRET;

// Middleware to authenticate user using JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Route to insert a new user
app.post('/users', createUser);

// Route to authenticate user and return JWT token
app.post('/auth', authUser);

// Route to update user profile
app.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username } = req.user;
    const { name, email } = req.body;
    // Update user profile in the database
    const db = mongoClient.db('mydb');
    const collection = db.collection('users');
    const result = await collection.updateOne({ username: username }, { $set: { name: name, email: email } });
    console.log(result);
    if (result.modifiedCount === 1) {
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error || 'Something went wrong');
  }
});

// Route to get user profile
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { username } = req.user;
    // Get user profile from the database
    const db = mongoClient.db('mydb');
    const collection = db.collection('users');
    const user = await collection.findOne({ username: username }, { projection: { _id: 0, password: 0 } });
    if (user) {
      res.json(user);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error || 'Something went wrong');
  }
});

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from CodeX!'
  })
})

app.post('/', authenticateToken, chat.createChatCompletion);

app.listen(5000, () => console.log('AI server started on http://localhost:5000'));