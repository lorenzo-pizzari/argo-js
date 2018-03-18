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
  let credentials, client
  try {
    client = await clientsColl.findOne({_id: new ObjectID(username)})
  } catch (err) {
    return {isValid: false}
  }
  if (!client) return {isValid: false}
  credentials = client
  const isValid = password === client.secret
  return {isValid, credentials: isValid ? credentials : undefined}
}

exports.validate = validate
