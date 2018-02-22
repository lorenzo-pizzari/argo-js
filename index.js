'use strict'

const Hapi = require('hapi')

let hapiOptions = {
  host: 'localhost',
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
              args: [{format: 'YY/MM/DD-HH:mm:ss.SSS'}]
            }, 'stdout']
          }
        }
      },
      require('./auth/basic')
    ])
    await server.register(require('./api/user'))
    await server.start()
  } catch (err) {
    console.log(err)
    process.exit(1)
  }

  console.log('Server running at:', server.info.uri)
}

start()

console.log(process.env.NODE_ENV)

exports.server = server
