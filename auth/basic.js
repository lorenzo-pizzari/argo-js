const bcrypt = require('bcryptjs')
const Boom = require('boom')
const Basic = require('hapi-auth-basic')

exports.plugin = {
  name: 'basic-authentication',
  version: '1.0.0',
  dependencies: ['hapi-mongodb'],
  register: basicAuthentication
}

async function basicAuthentication (server, options) {
  await server.register(Basic)

  server.auth.strategy('basic', 'basic', {validate})
  server.auth.default('basic')
}

async function validate (request, username, password) {
  const usersColl = request.mongo.db.collection('users')
  let credentials
  return usersColl.findOne({email: username})
    .then(user => {
      if (!user) throw Boom.unauthorized()
      credentials = user
      return bcrypt.compare(password, user.password)
    })
    .then(isValid => {
      return {isValid, credentials}
    })
    .catch(() => {
      return {isValid: false}
    })
}

exports.validate = validate
