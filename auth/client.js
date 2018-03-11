const Boom = require('boom')

exports.plugin = {
  name: 'client-authentication',
  version: '1.0.0',
  dependencies: ['hapi-mongodb'],
  register: basicAuthentication
}

async function basicAuthentication (server, options) {
  server.auth.strategy('client-basic', 'basic', {validate})
}

async function validate (request, username, password) {
  const clientsColl = request.mongo.db.collection('clients')
  const ObjectID = request.mongo.ObjectID
  let credentials
  return clientsColl.findOne({_id: new ObjectID(username)})
    .then(client => {
      if (!client) throw Boom.unauthorized()
      credentials = client
      return password === client.secret
    })
    .then(isValid => {
      return {isValid, credentials: isValid ? credentials : undefined}
    })
    .catch(() => {
      return {isValid: false}
    })
}

exports.validate = validate
