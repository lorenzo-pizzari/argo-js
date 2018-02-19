'use strict'

const Hapi = require('hapi')

// Create a server with a host and port
const server = Hapi.server({
  host: 'localhost',
  port: 8000,
  debug: {
    request: ['error']
  },
  routes: {
    response: {
      modify: true,
      options: {
        abortEarly: false
      }
    }
  }
})

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
              args: [{format: 'YY/MM/DD-HH:mm:ss.SSS'}]
            }, 'stdout']
          }
        }
      },
      require('./auth/basic'),
      require('./api/user')
    ])
    await server.start()
  } catch (err) {
    console.log(err)
    process.exit(1)
  }

  console.log('Server running at:', server.info.uri)
}

start()
