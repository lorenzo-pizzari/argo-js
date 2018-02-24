const Joi = require('joi')

const user = Joi.object({
  _id: [Joi.string().regex(/^[0-9a-fA-F]{24}$/), Joi.object()],
  email: Joi.string().email(),
  password: Joi.string().strip(),
  name: Joi.string(),
  surname: Joi.string()
}).label('User')

const client = Joi.object({
  id: Joi.string().length(16),
  secret: Joi.string().length(32),
  name: Joi.string(),
  user_email: Joi.reach(user, 'email'),
  redirect_uri: Joi.string().uri({scheme: ['http', 'https']})
})

const code = Joi.object({
  id: Joi.string(),
  value: Joi.string().length(16),
  client_id: Joi.reach(client, 'id')
})

const token = Joi.object({
  id: Joi.string(),
  value: Joi.string(),
  user_email: Joi.reach(user, 'email'),
  client_id: Joi.reach(client, 'id')
})

const error = Joi.object({
  'statusCode': Joi.number(),
  'error': Joi.string(),
  'message': Joi.string()
}).label('Error')

exports.user = user
exports.client = client
exports.code = code
exports.token = token
exports.error = error
