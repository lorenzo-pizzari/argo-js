const Boom = require('boom')
const Joi = require('joi')
const randomstring = require('randomstring')
const Schemas = require('../Schemas')

exports.plugin = {
  name: 'client-api',
  version: '0.1.0',
  dependencies: ['hapi-mongodb', 'basic-authentication'],
  register: clientModule
}

async function clientModule (server, options) {
  const db = server.mongo.db
  const ObjectID = server.mongo.ObjectID
  const clients = db.collection('clients')

  server.route({
    method: 'POST',
    path: '/api/client',
    options: {
      tags: ['api', 'client'],
      description: 'Create new client',
      validate: {
        query: false,
        payload: Schemas.client
          .requiredKeys(['name', 'redirect_uri'])
          .forbiddenKeys(['_id', 'user_id', 'secret']).label('ClientSubmit')
      },
      response: {status: {200: Schemas.client, 403: Schemas.error}}
    },
    handler: (request, h) => {
      return clients.findOne({name: request.payload.name})
        .then(clientObject => {
          if (clientObject) throw Boom.forbidden('client already exists')
          else {
            request.payload.user_id = request.auth.credentials._id
            request.payload.secret = randomstring.generate()
            return clients.insertOne(request.payload)
          }
        })
        .then((insertResult) => {
          return insertResult.ops[0]
        })
        .catch(error => {
          return error
        })
    }
  })

  server.route({
    method: 'GET',
    path: '/api/client',
    options: {
      tags: ['api', 'client'],
      validate: {query: false, payload: false},
      response: {status: {200: Joi.array().items(Schemas.client)}}
    },
    handler: async (request, h) => {
      return clients.find({user_id: request.auth.credentials._id}).toArray()
    }
  })

  server.route({
    method: 'DELETE',
    path: '/api/client',
    options: {
      tags: ['api', 'client'],
      validate: {query: false, payload: {_id: Joi.string().hex().length(24)}},
      response: {emptyStatusCode: 204}
    },
    handler: async (request, h) => {
      clients.deleteOne({_id: new ObjectID(request.payload._id)})
      const response = h.response()
      response.statusCode = 204
      return response
    }
  })
}
