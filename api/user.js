const Boom = require('boom')
const bcrypt = require('bcrypt')
const Schemas = require('../Schemas')

exports.plugin = {
  name: 'user-api',
  version: '1.0.0',
  dependencies: ['hapi-mongodb', 'basic-authentication'],
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
      tags: ['api', 'user'],
      description: 'Create new User',
      validate: {
        query: false,
        payload: Schemas.user
          .requiredKeys(['email', 'password'])
          .forbiddenKeys(['_id']).label('RegistrationForm')
      },
      response: {status: {200: Schemas.user.forbiddenKeys(['password']), 403: Schemas.error}}
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
          delete insertResult.ops[0].password
          return insertResult.ops[0]
        })
        .catch(error => {
          return error
        })
    }
  })

  server.route({
    method: 'GET',
    path: '/api/user',
    options: {
      tags: ['api', 'user'],
      validate: {query: false, payload: false},
      response: {status: {200: Schemas.user.forbiddenKeys(['password'])}}
    },
    handler: (request, h) => {
      delete request.auth.credentials.password
      return request.auth.credentials
    }
  })

  server.route({
    method: 'PUT',
    path: '/api/user',
    options: {
      tags: ['api', 'user'],
      validate: {
        query: false,
        payload: Schemas.user.forbiddenKeys(['_id', 'password', 'email']).min(1)
      },
      response: {status: {200: Schemas.user.forbiddenKeys(['password'])}}
    },
    handler: async (request, h) => {
      await Users.findOneAndUpdate(
        {_id: request.auth.credentials._id},
        {$set: request.payload})
      return Users.findOne(
        {_id: request.auth.credentials._id},
        {password: 0}
      )
    }
  })

  server.route({
    method: 'DELETE',
    path: '/api/user',
    options: {
      tags: ['api', 'user'],
      validate: {query: false, payload: false},
      response: {emptyStatusCode: 204}
    },
    handler: async (request, h) => {
      Users.deleteOne({_id: request.auth.credentials._id})
      const response = h.response()
      response.statusCode = 204
      return response
    }
  })
}
