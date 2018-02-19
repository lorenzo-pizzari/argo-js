const Boom = require('boom')
const Joi = require('joi')
const bcrypt = require('bcryptjs')
const UserSchema = require('../Schemas').user

exports.plugin = {
  name: 'User API',
  version: '0.1.0',
  dependencies: ['hapi-mongodb'],
  register: userModule
}

async function userModule (server, options) {
  const db = server.mongo.db
  const Users = db.collection('users')
  server.route({
    method: 'POST',
    path: '/api/user',
    options: {
      auth: false,
      description: 'Create new User',
      validate: {
        query: false,
        payload: {
          email: Joi.string().email().required(),
          password: Joi.string().required(),
          name: Joi.string(),
          surname: Joi.string()
        }
      },
      response: {
        schema: UserSchema
      }
    },
    handler: (request, h) => {
      return Users.findOne({email: request.payload.email})
        .then(userObject => {
          if (userObject) throw Boom.forbidden('User already exists')
          return bcrypt.genSalt(10)
        }).then((salt) => {
          return bcrypt.hash(request.payload.password, salt)
        }).then((hash) => {
          request.payload.password = hash
          return Users.insertOne(request.payload)
        })
        .then((insertResult) => {
          return insertResult.ops[0]
        })
        .catch(error => {
          return error
        })
    }
  })
}
