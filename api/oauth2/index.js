const Joi = require('joi')
const randomstring = require('randomstring').generate
const URLSearchParams = require('url').URLSearchParams
const URL = require('url').URL
const Schemas = require('../../Schemas')

exports.plugin = {
  name: 'oauth2',
  version: '0.0.1',
  dependencies: ['hapi-mongodb', 'cookie-authentication'],
  register: OAuth2Module
}

async function oauthFailAction (request, h) {
  console.log('Payload:', request.payload)
  console.log('Query', request.query)
  const responseQuery = new URLSearchParams(request.query)
  responseQuery.append('error', 'invalid_request')
  const uri = request.query.redirect_uri
  return h.redirect((uri || '/') + '?' + responseQuery.toString()).takeover()
}

async function OAuth2Module (server, options) {
  const db = server.mongo.db
  const ObjectID = server.mongo.ObjectID

  /**
   * Function for generating and persist access_token
   * @param {String} clientId
   * @param {String} userId
   * @returns {Promise<*>}
   */
  async function tokenHandler (clientId, userId) {
    return db.collection('tokens').insertOne({
      token: randomstring(),
      client_id: new ObjectID(clientId),
      user_id: new ObjectID(userId),
      createdAt: new Date(),
      lastRefresh: new Date()
    })
  }

  const authorizationQueryValidation = {
    response_type: Joi.string().only(['code', 'token']).required(),
    client_id: Joi.reach(Schemas.client, '_id').required(),
    redirect_uri: Joi.reach(Schemas.client, 'redirect_uri').required(),
    scope: Joi.string(),
    state: Joi.string()
  }

  server.route({
    method: 'GET',
    path: '/api/oauth2/authorize',
    options: {
      auth: 'session',
      tags: ['api', 'oauth2'],
      validate: {
        payload: false,
        query: authorizationQueryValidation,
        failAction: oauthFailAction
      }
    },
    handler: async (request, h) => {
      const client = await db.collection('clients').findOne({_id: new ObjectID(request.query.client_id)})
      if (!client) {
        let redirection = new URL(request.query.redirect_uri)
        redirection.searchParams.append('error', 'invalid_request')
        if (request.query.state) redirection.searchParams.append('state', request.query.state)
        return h.redirect(redirection.toString())
      }
      if (client.redirect_uri !== request.query.redirect_uri) {
        let redirection = new URL(request.query.redirect_uri)
        redirection.searchParams.append('error', 'invalid_request')
        if (request.query.state) redirection.searchParams.append('state', request.query.state)
        return h.redirect(redirection.toString())
      }
      return h.view('oauth_decision', {query: request.query, credentials: request.auth.credentials, client: client})
    }
  })

  server.route({
    method: 'POST',
    path: '/api/oauth2/authorize',
    options: {
      auth: 'session',
      validate: {
        payload: {
          decision: Joi.string().only(['allow', 'deny'])
        },
        query: authorizationQueryValidation,
        failAction: oauthFailAction
      }
    },
    handler: async (request, h) => {
      if (request.payload.decision === 'deny') {
        let redirection = new URL(request.query.redirect_uri)
        redirection.searchParams.append('error', 'access_denied')
        if (request.query.state) redirection.searchParams.append('state', request.query.state)
        return h.redirect(redirection.toString())
      }
      const client = await db.collection('clients').findOne({_id: new ObjectID(request.query.client_id)})
      if (!client) {
        let redirection = new URL(request.query.redirect_uri)
        redirection.searchParams.append('error', 'invalid_request')
        if (request.query.state) redirection.searchParams.append('state', request.query.state)
        return h.redirect(redirection.toString())
      }
      let successUrl = new URL(request.query.redirect_uri)
      switch (request.query.response_type) {
        case 'code':
          const code = randomstring()
          await request.server.app.cache.set(code, {
            client_id: request.query.client_id,
            user_id: request.auth.credentials._id
          })
          successUrl.searchParams.set('code', code)
          break
        case 'token':
          const tokenInsertResult = await tokenHandler(request.query.client_id, request.auth.credentials._id)
          successUrl.searchParams.set('token', tokenInsertResult.ops[0].token)
          break
      }
      if (request.query.state) successUrl.searchParams.set('state', request.query.state)
      return h.redirect(successUrl.toString())
    }
  })

  server.route({
    method: 'POST',
    path: '/api/oauth2/token',
    options: {
      auth: 'client-basic',
      tags: ['api', 'oauth2'],
      validate: {
        query: false,
        payload: Joi.alternatives().when(Joi.object({grant_type: 'authorization_code'}).unknown(), {
          then: Joi.object({
            grant_type: Joi.string().only(['authorization_code']).required(),
            code: Joi.string().required(),
            redirect_uri: Joi.reach(Schemas.client, 'redirect_uri').required(),
            client_id: Joi.reach(Schemas.client, '_id').required()
          }),
          otherwise: Joi.object({
            grant_type: Joi.string().only(['password']).required(),
            username: Joi.reach(Schemas.user, 'email').required(),
            password: Joi.reach(Schemas.user, 'password').required()
          })
        }),
        failAction: (request, h) => {
          let error = 'invalid_request'
          if (request.payload.grant_type !== 'authorization_code' &&
            request.payload.grant_type !== 'password') error = 'unsupported_grant_type'
          const response = h.response({error: error})
          response.statusCode = 400
          return response.takeover()
        }
      }
    },
    handler: async (request, h) => {
      if (request.payload.redirect_uri !== request.auth.credentials.redirect_uri) {
        const response = h.response({error: 'invalid_request'})
        response.statusCode = 400
        return response
      }
      let tokenInsertResult
      switch (request.payload.grant_type) {
        case 'authorization_code':
          let code = await request.server.app.cache.get(request.payload.code)
          if (!code || code.client_id !== request.auth.credentials._id.toString()) {
            const response = h.response({error: 'invalid_grant'})
            response.statusCode = 400
            return response
          }
          tokenInsertResult = await tokenHandler(code.client_id, code.user_id)
          break
        case 'password':
          // TODO Check username and password
          // TODO Call tokenHandler w/ user._id as client_id
          break
      }
      // TODO Set Token Expire
      return {access_token: tokenInsertResult.ops[0].token, token_type: 'bearer', expires_in: 0}
    }
  })
}
