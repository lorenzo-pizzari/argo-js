const Joi = require('joi')
const URLSearchParams = require('url').URLSearchParams

exports.plugin = {
  name: 'cookie-authentication',
  version: '0.0.1',
  dependencies: ['hapi-mongodb', 'inert', 'vision'],
  register: cookieAuthentication
}

async function cookieAuthentication (server, options) {
  await server.register(require('hapi-auth-cookie'))

  server.app.cache = server.cache({segment: 'sessions', expiresIn: 3 * 24 * 60 * 60 * 1000})

  server.auth.strategy('session', 'cookie', {
    password: 'bpiSlGrKnR9qHSZ41PbC6gITRwnAR4A2',
    cookie: 'sid',
    redirectTo: '/login',
    isSecure: false,
    appendNext: true,
    validateFunc: validate
  })

  server.route({
    method: 'GET',
    path: '/login',
    options: {
      auth: {mode: 'try', strategy: 'session'},
      plugins: {'hapi-auth-cookie': {redirectTo: false}}
    },
    handler: (request, h) => {
      if (request.auth.isAuthenticated) {
        return h.redirect(request.query.next || '/')
      }
      return h.view('login', {title: '| Login', location: request.raw.req.url, status: request.query.status})
    }
  })

  server.route({
    method: 'POST',
    path: '/login',
    options: {
      auth: false,
      plugins: {'hapi-auth-cookie': {redirectTo: false}},
      validate: {
        payload: {
          email: Joi.string().email().required(),
          password: Joi.string().required()
        }
      }
    },
    handler: async (request, h) => {
      // Check login
      const login = await require('./basic').validate(request, request.payload.email, request.payload.password)
      if (!login.isValid) {
        const redirectURL = new URLSearchParams(request.url.search)
        if (!redirectURL.get('status')) redirectURL.append('status', 'Unauthorized')
        return h.redirect(request.url.pathname + '?' + redirectURL.toString())
      } else {
        // Set chache/cookie stuff
        await request.server.app.cache.set(login.credentials._id.toString(), {credentials: login.credentials}, 0)
        request.cookieAuth.set({sid: login.credentials._id.toString()})
        return h.redirect(request.query.next || '/')
      }
    }
  })
}

async function validate (request, session) {
  const cached = await request.server.app.cache.get(session.sid)
  const out = {
    valid: !!cached
  }
  if (out.valid) {
    out.credentials = cached.credentials
  }

  return out
}

exports.validate = validate
