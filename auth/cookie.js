exports.plugin = {
  name: 'cookie-authentication',
  version: '0.0.1',
  dependencies: ['hapi-mongodb', 'inert', 'vision'],
  register: cookieAuthentication
}

async function cookieAuthentication (server, options) {
  await server.register(require('hapi-auth-cookie'))

  const cache = server.cache({segment: 'sessions', expiresIn: 3 * 24 * 60 * 60 * 1000})
  server.app.cache = cache

  server.auth.strategy('session', 'cookie', {
    password: 'password-should-be-32-characters',
    cookie: 'sid',
    redirectTo: '/login',
    isSecure: false,
    appendNext: true,
    validateFunc: async (request, session) => {
      const cached = await cache.get(session.sid)
      const out = {
        valid: !!cached
      }
      if (out.valid) {
        out.credentials = cached.credentials
      }

      return out
    }
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
        return h.redirect(request.query.next | '/')
      }
      return h.view('login', {title: '| Login', location: request.raw.req.url, status: request.query.status})
    }
  })

  server.route({
    method: 'POST',
    path: '/login',
    options: {
      auth: false,
      plugins: {'hapi-auth-cookie': {redirectTo: false}}
    },
    handler: async (request, h) => {
      // Check login
      const login = await require('./basic').validate(request, request.payload.email, request.payload.password)
      if (!login.isValid) {
        let status
        request.query.status ? status = '' : status = '&status=Unauthorized'
        return h.redirect(request.raw.req.url + status)
      } else {
        // Set chache/cookie stuff
        await request.server.app.cache.set(login.credentials._id.toString(), {credentials: login.credentials}, 0)
        request.cookieAuth.set({sid: login.credentials._id.toString()})
        // Decide where redirect user
        let landingTarget
        request.query.next ? landingTarget = request.query.next : landingTarget = '/'
        return h.redirect(landingTarget)
      }
    }
  })
}
