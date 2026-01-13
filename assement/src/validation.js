const Joi = require('joi');

const truckSchema = Joi.object({
  id: Joi.string().required(),
  max_weight_lbs: Joi.number().integer().positive().required(),
  max_volume_cuft: Joi.number().integer().positive().required()
});

const orderSchema = Joi.object({
  id: Joi.string().required(),
  payout_cents: Joi.number().integer().min(0).required(),
  weight_lbs: Joi.number().integer().positive().required(),
  volume_cuft: Joi.number().integer().positive().required(),
  origin: Joi.string().required(),
  destination: Joi.string().required(),
  pickup_date: Joi.date().iso().required(),
  delivery_date: Joi.date().iso().greater(Joi.ref('pickup_date')).required(),
  is_hazmat: Joi.boolean().required()
});

const optimizeSchema = Joi.object({
  truck: truckSchema.required(),
  orders: Joi.array().items(orderSchema).min(0).max(25).required() // Cap slightly above 22 for safety
});

module.exports = { optimizeSchema };