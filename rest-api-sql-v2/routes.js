'use strict';

const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

const User  = require('./models');

const router = express.Router();

// Code and comments for this Authentication middleware was taken from a tutorial 
// at teamtreehouse.com
const authenticateUser = async (req, res, next) => {
    let message = null;
    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req);

    // If the user's credentials are available...
    if (credentials) {
        // Attempt to retrieve the user from the database
        // by their email (i.e. the user's "key"
        // from the Authorization header).

        try {
            const user = await User.findOne({ where: { emailAddress: credentials.name } });
        }
        catch(error) {
            throw error;
        }

        // If a user was successfully retrieved from the database...
        if (user) {
            // Use the bcryptjs npm package to compare the user's password
            // (from the Authorization header) to the user's password
            // that was retrieved from the database.
            const authenticated = bcryptjs.compareSync(credentials.pass, user.password);

            // If the passwords match...
            if (authenticated) {
                // Then store the retrieved user object on the request object
                // so any middleware functions that follow this middleware function
                // will have access to the user's information.
                req.currentUser = user;
            }
            else {
                message = `Authentication failure for username: ${user.username}`;
            }
        }
        else {
            message = `User not found for username: ${credentials.name}`;
        }
    }
    else {
        message = 'Auth header not found';
    }

    // If user authentication failed...
    if (message) {
        console.warn(message);

        // Return a response with a 401 Unauthorized HTTP status code.
        res.status(401).json({ message: 'Access Denied'});
    }
    else {
        // Or if user authentication succeeded...
        // Call the next() method.
        next();
    }
};

// Returns the currently authenticated user
router.get('/users', authenticateUser, async (req, res) => {
    const user = req.currentUser;
    console.log(user);
  
    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.emailAddress,
    });
});

// Creates a new user
router.post('/users', async (req, res) => {
    console.log(req);
    // Get the user from the request body
    const user = req.body;
    // console.log(user);

    user.password = bcryptjs.hashSync(user.password);

    // Add the user to the database
    await User.create({
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
        password: user.password,
    })
});

module.exports = router;