'use strict'

const Hapi = require('hapi')
const Path = require('path')

let hapiOptions = {
  host: '0.0.0.0',
  port: 8000,
  routes: {
    response: {
      modify: true,
      options: {
        abortEarly: false
      }
    }
  }
}

if (process.env.NODE_ENV === 'debug') {
  hapiOptions.debug = {
    request: ['error']
  }
}

if (process.env.NODE_ENV === 'test') {
  hapiOptions.port = 8080
}

// Create a server with a host and port
const server = Hapi.server(hapiOptions)

// Add the route
server.route({
  method: 'GET',
  path: '/healthCheck',
  options: {
    auth: false
  },
  handler: function (request, h) {
    return {status: 'ok'}
  }
})

// Start the server
async function start () {
  try {
    await server.register([
      {
        plugin: require('hapi-mongodb'),
        options: {url: 'mongodb://localhost:27017/argo', decorate: true}
      },
      {
        plugin: require('good'),
        options: {
          reporters: {
            ConsoleReporter: [{
              module: 'good-squeeze',
              name: 'Squeeze',
              args: [{log: '*', response: '*'}]
            }, {
              module: 'good-console',
              args: [{format: 'YYYY-MM-DDTHH:mm:ssZ'}]
            }, 'stdout']
          }
        }
      },
      require('inert'),
      require('vision'),
      {
        plugin: require('hapi-swagger'),
        options: {
          pathPrefixSize: 2,
          info: {
            title: 'Argo.js Identity Provider',
            version: require('./package').version
          }
        }
      },
      require('./auth/basic'),
      require('./auth/cookie')
    ])
    await server.register([
      require('./api/user'),
      require('./api/client'),
      require('./api/oauth2')
    ])
    server.views({
      engines: {
        html: require('handlebars')
      },
      defaultExtension: 'html',
      relativeTo: __dirname,
      path: 'views',
      layoutPath: 'views/layout',
      layout: 'default'
    })
    server.path(Path.join(__dirname, 'public'))
    server.route({
      method: 'GET',
      path: '/{param*}',
      options: {auth: false},
      handler: {
        directory: {
          path: '.',
          redirectToSlash: true,
          index: true
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/',
      options: {
        auth: 'session'
      },
      handler: function (request, h) {
        return h.view('index', {title: '| Home', name: request.auth.credentials.name})
      }
    })
    await server.start()
  } catch (err) {
    console.log(err)
    process.exit(1)
  }

  console.log('Server running at:', server.info.uri)
}

start()

exports.server = server
