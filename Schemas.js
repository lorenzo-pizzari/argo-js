const Joi = require('joi')

const user = Joi.object({
  email: Joi.string().email(),
  password: Joi.string()
})

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

exports.user = user
exports.client = client
exports.code = code
exports.token = token
