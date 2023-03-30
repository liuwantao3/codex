import jwt from 'jsonwebtoken';
import { mongoClient, jwtSecret } from './server.js';

export async function createUser(req, res) {
  try {
    const { username, password } = req.body;
    // Insert the new user into the database
    const db = mongoClient.db('mydb');

    const collection = db.collection('users');
    const result = await collection.insertOne({ username: username, password: password });
    
    if (result.acknowledged) {
      const accessToken = jwt.sign({ username: username }, jwtSecret, {expiresIn: '1h'});
      console.log(accessToken);
      res.json({ accessToken: accessToken });
    } else {
      res.sendStatus(500);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error || 'Something went wrong');
  }
}

export async function authUser(req, res) {
    try {
      const { username, password } = req.body;
      console.log(req.body);
      // Check if user exists in the database and password is correct
      const db = mongoClient.db('mydb');
      const collection = db.collection('users');
      const user = await collection.findOne({ username: username });
      if (user && user.password === password) {
        const accessToken = jwt.sign({ username: username }, jwtSecret, {expiresIn: '1h'});
        console.log(accessToken);
        res.json({ accessToken: accessToken });
      } else {
        res.sendStatus(401);
      }
    } catch (error) {
      console.error(error);
      res.status(500).send(error || 'Something went wrong');
    }
  }
  