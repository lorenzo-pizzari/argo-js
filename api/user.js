const Boom = require('boom')
const bcrypt = require('bcryptjs')
const Schemas = require('../Schemas')

exports.plugin = {
  name: 'user-api',
  version: '0.1.0',
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
        payload: Schemas.user.forbiddenKeys(['_id', 'password']).min(1)
      },
      response: {status: {200: Schemas.user.forbiddenKeys(['password'])}}
    },
    handler: async (request, h) => {
      const updateResult = await Users.findOneAndUpdate(
        {_id: request.auth.credentials._id},
        {$set: request.payload},
        {projection: {password: 0}})
      return updateResult.value
    }
  })

  server.route({
    method: 'DELETE',
    path: '/api/user',
    options: {
      tags: ['api', 'user'],
      validate: {query: false, payload: false}
    },
    handler: async (request, h) => {
      Users.deleteOne({_id: request.auth.credentials._id})
      const response = h.response()
      response.statusCode = 204
      return response
    }
  })
}
