'use strict'

const Hapi = require('hapi')

// Create a server with a host and port
const server = Hapi.server({
  host: 'localhost',
  port: 8000
})

// Add the route
server.route({
  method: 'GET',
  path: '/healthCheck',
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
