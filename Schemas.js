const Joi = require('joi')

const user = Joi.object({
  id: Joi.number(),
  email: Joi.string().email(),
  password: Joi.string().strip()
})

const client = Joi.object({
  id: Joi.string().length(16),
  secret: Joi.string().length(32),
  name: Joi.string(),
  user_id: Joi.reach(user, 'id'),
  redirect_uri: Joi.string().uri({scheme: ['http', 'https']})
})

const code = Joi.object({
  id: Joi.string(),
  value: Joi.string().length(16),
  user_id: Joi.reach(user, 'id'),
  client_id: Joi.reach(client, 'id')
})

const token = Joi.object({
  id: Joi.string(),
  value: Joi.string(),
  user_id: Joi.reach(user, 'id'),
  client_id: Joi.reach(client, 'id')
})

exports.Schemas = {
  user: user,
  client: client,
  code: code,
  token: token
}
