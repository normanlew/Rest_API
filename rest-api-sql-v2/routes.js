'use strict';

const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');


const { User, Course } = require('./models');
// const { User } = db;

// const User  = require('./models');
// console.log(User);

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
        catch(error) {
            throw error;
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
    // console.log(user);
  
    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.emailAddress,
      userId: user.id
    });
});

// Creates a new user
router.post('/users', async (req, res) => {
    // console.log(req);
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
    });

    // Set the status to 201 and end the response
    res.status(201).end();
});

// Returns a list of courses (including the user that owns each course)
router.get('/courses', async(req, res) => {
    const courses = await Course.findAll({
        include: [
          {
            model: User
          },
        ],
      });
      res.status(200).json(courses);
});

// Returns the course (including the user that owns the course) for the provided course ID
router.get('/courses/:id', async(req, res) => {
    // const project = await Project.findOne({ where: { title: 'My Title' } });
    // console.log(req.params.id);
    const course = await Course.findOne({
        where: { id: req.params.id},

        include: [
          {
            model: User
          },
        ],
      });
      res.status(200).json(course);
});

// Creates a course, sets the Location header to the URI for the course, and returns no content
router.post('/courses', async (req, res) => {
    // console.log(req);
    // Get the course from the request body
    const course = req.body;
    // console.log(course);


    // Add the course to the database
    const newCourse = await Course.create({
        title: course.title,
        description: course.description,
        estimatedTime: course.estimatedTime,
        materialsNeeded: course.materialsNeeded,
        userId: course.userId,
    });

    console.log(newCourse);

    // Set the status to 201 and end the response
    res.status(201).location("/" + newCourse.id).end();
});

// Updates a course and returns no content
router.put('/courses/:id', async (req, res) => { 
    const course = await Course.findOne({
        where: { id: req.params.id},
      });
      if (course) {
        course.title = req.body.title;
        course.description = req.body.description;

        await course.save();
        res.status(204).end();
    }
    else {
        res.status(404).json({message: "Couese not found."});
    }
});

// Deletes a course and returns no content
router.delete('/courses/:id', async(req, res) => {
    try {
        const course = await Course.findOne({where: { id: req.params.id}});
        if (course) {
            await course.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({message: "Course not found."});
        }
 

    } catch(err) {
        res.status(404).json({message: err.message});
    }
})

module.exports = router;