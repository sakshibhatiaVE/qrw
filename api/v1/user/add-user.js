/*
 * @file: register.js
 * @description: It Contain register User  router/api.
 * @author: Sakshi Bhatia
 */
import express from "express";
import { addUser } from "../../../controllers/user";
import { checkTokenAdmin , checkUserPermissions } from "../../../utilities/universal";

import { createValidator } from "express-joi-validation";
import Joi from "@hapi/joi";
const app = express();
const validator = createValidator({ passError: true });

/**
 * @swagger
 * /api/v1/user/add-user:
 *  post:
 *   tags: ["User"]
 *   summary: add user api
 *   description: api used to add user
 *   parameters:
 *      - in: header
 *        name: Authorization
 *        type: string
 *        required: true
 *      - in: body
 *        name: user
 *        description: The user to create.
 *        schema:
 *         type: object
 *         required:
 *          - user register
 *         properties:
 *           fname_en:
 *             type: string
 *             required:
 *           lname_en:
 *             type: string
 *             required:
 *           phone:
 *             type: string
 *             required:
 *           email:
 *             type: string
 *             required:
 *           password:
 *             type: string
 *             required:
 *           std_code:
 *             type: string
 *             required:
 *           role:
 *             type: number
 *             required:
 *           city:
 *             type: string
 *           state:
 *             type: string
 *           zipcode:
 *             type: string
 *           address:
 *             type: string
 *           gender:
 *             type: string
 *           dob:
 *             type: date
 *   responses:
 *    '200':
 *      description: success
 *    '400':
 *      description: fail
 */

/*
* Joi validation on input data
*/
const Schema = Joi.object({
  fname_en: Joi.string()
    .required()
    .label("First name"),
  lname_en: Joi.string()
    .optional()
    .allow("")
    .label("Last name"),
  std_code: Joi.string()
    .optional()
    .allow(""),
  phone: Joi.string()
    .required()
    .label(" Phone"),
  email: Joi.string()
    .email()
    .required()
    .label("Email"),
  password: Joi.string()
    .trim()
    .required()
    .label("Password"),
  role: Joi.number()
    .required()
    .label("Role"),
  dob: Joi.string()
    .optional()
    .allow("")
    .label("Date of birth"),
  address: Joi.string()
    .optional()
    .allow("")
    .label("Address"),
  city: Joi.string()
    .optional()
    .allow("")
    .label("City"),
  state: Joi.string()
    .optional()
    .allow("")
    .label("State"),
  zipcode: Joi.string()
    .optional()
    .allow("")
    .label("Zipcode"),
  gender_en: Joi.string()
    .optional()
    .allow("")
    .label("Gender")
});

/*
* api call to function
*/
app.post(
  "/user/add-user",
  validator.body(Schema, {
    joi: { convert: true, allowUnknown: false }
  }),
  checkTokenAdmin,
  //checkUserPermissions,
  addUser
);

export default app;
