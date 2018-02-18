const Boom = require('boom')
const UserSchema = require('../Schemas').user

exports.plugin = {
  name: 'User API',
  version: '0.1.0',
  register: userModule
}
let users = {}

async function userModule (server, options) {
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
      if (users[request.payload.email]) {
        return Boom.forbidden('Email already registered!')
      } else {
        users[request.payload.email] = request.payload
        return request.payload
      }
    }
  })
}
