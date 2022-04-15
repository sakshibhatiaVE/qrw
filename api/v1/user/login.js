/*
 * @file: login.js
 * @description: It Contain login router/api.
 * @author: Sakshi Bhatia
 */
import express from "express";
import { createValidator } from "express-joi-validation";
import Joi from "@hapi/joi";
import { login } from "../../../controllers/user";
const app = express();
const validator = createValidator({ passError: true });
// https://swagger.io/docs/specification/2-0/describing-parameters

/**
 * @swagger
 * /api/v1/login:
 *  post:
 *   tags: ["User"]
 *   summary: user login api
 *   description: api used to login admin and users
 *   parameters:
 *      - in: body
 *        name: login
 *        description: User login.
 *        schema:
 *         type: object
 *         required:
 *          - user login
 *         properties:
 *           email:
 *             type: string
 *             required: true
 *           password:
 *             type: string
 *             required: true
 *   responses:
 *    '200':
 *      description: success
 *    '400':
 *      description: fail
 */

/*
* Joi validation on input data
*/
const adminSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .label("Email"),
  password: Joi.string()
    .trim()
    .required()
    .label("Password")
});

/*
* api call to function
*/
app.post(
  "/login",
  validator.body(adminSchema, {
    joi: { convert: true, allowUnknown: false }
  }),
  login
);

export default app;
