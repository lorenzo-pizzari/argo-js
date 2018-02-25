const Joi = require('joi')

const user = Joi.object({
  _id: [Joi.string().hex().length(24), Joi.object()],
  email: Joi.string().email(),
  password: Joi.string(),
  name: Joi.string(),
  surname: Joi.string()
}).label('User')

const client = Joi.object({
  _id: [Joi.string().hex().length(24), Joi.object()],
  secret: Joi.string().length(32),
  name: Joi.string(),
  user_id: Joi.reach(user, '_id'),
  redirect_uri: Joi.string().uri({scheme: ['http', 'https']})
}).label('Client')

const code = Joi.object({
  id: Joi.string(),
  value: Joi.string().length(16),
  client_id: Joi.reach(client, '_id')
})

const token = Joi.object({
  id: Joi.string(),
  value: Joi.string(),
  user_email: Joi.reach(user, 'email'),
  client_id: Joi.reach(client, '_id')
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
