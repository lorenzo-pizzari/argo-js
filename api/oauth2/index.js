const Joi = require('joi')
const randomstring = require('randomstring')
const Schemas = require('../../Schemas')

exports.plugin = {
  name: 'oauth2',
  version: '0.0.1',
  dependencies: ['hapi-mongodb', 'cookie-authentication'],
  register: OAuth2Module
}

async function OAuth2Module (server, options) {
  const db = server.mongo.db
  const ObjectID = server.mongo.ObjectID

  server.route({
    method: 'GET',
    path: '/api/oauth2/authorize',
    options: {
      auth: 'session',
      tags: ['api', 'oauth2'],
      validate: {
        payload: false,
        query: {
          response_type: Joi.string().allow(['code']).required(),
          client_id: Joi.reach(Schemas.client, '_id').required(),
          redirect_uri: Joi.reach(Schemas.client, 'redirect_uri').required(),
          scope: Joi.string(),
          state: Joi.string()
        },
        failAction: (request, h) => {
          const uri = request.query.redirect_uri
          return h.redirect((uri || '/') + '?error=invalid_request').takeover()
        }
      }
    },
    handler: async (request, h) => {
      switch (request.query.response_type) {
        case 'code':
          const client = await db.collection('clients').findOne({_id: new ObjectID(request.query.client_id)})
          if (!client) {
            let redirection = request.query.redirect_uri + '?error=invalid_request'
            if (request.query.state) redirection += '&state=' + request.query.state
            return h.redirect(redirection)
          }
          request.query.client = client
          if (client.redirect_uri !== request.query.redirect_uri) {
            let redirection = request.query.redirect_uri + '?error=invalid_request'
            if (request.query.state) redirection += '&state=' + request.query.state
            return h.redirect(redirection)
          }

          return h.view('oauth_decision', {query: request.query, credentials: request.auth.credentials})
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/api/oauth2/authorize',
    options: {
      auth: 'session',
      validate: {
        payload: {
          decision: Joi.string().allow(['accept', 'deny'])
        },
        query: {
          response_type: Joi.string().allow(['code']).required(),
          client_id: Joi.reach(Schemas.client, '_id').required(),
          redirect_uri: Joi.reach(Schemas.client, 'redirect_uri').required(),
          scope: Joi.string(),
          state: Joi.string()
        },
        failAction: (request, h) => {
          return h.redirect(request.query.redirect_uri + 'error=invalid_request').takeover()
        }
      }
    },
    handler: async (request, h) => {
      if (request.payload.decision === 'deny') {
        let redirection = request.query.redirect_uri + '?error=access_denied'
        if (request.query.state) redirection += '&state=' + request.query.state
        return h.redirect(redirection)
      }
      const code = randomstring()
      await request.server.app.cache.set(code, {
        client_id: new ObjectID(request.query.client_id),
        user_id: new ObjectID(request.auth.credentials._id)
      })
      let successUrl = request.query.redirect_uri + '?code=' + code
      if (request.query.state) successUrl += '&state=' + request.query.state
      return h.redirect(successUrl)
    }
  })
}
