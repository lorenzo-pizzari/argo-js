const Boom = require('boom')
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
        payload: UserSchema
          .requiredKeys(['email', 'password'])
      },
      response: {modify: true}
    },
    handler: (request, h) => {
      return Users.findOne({email: request.payload.email})
        .then(userObject => {
          if (userObject) throw Boom.forbidden('User already exists')
          return Users.insertOne(request.payload)
        })
        .then(() => {
          return request.payload
        })
    }
  })
}
