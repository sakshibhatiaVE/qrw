/*
 * @file: otp-login.js
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
 * /api/v1/user/sendOtp:
 *  post:
 *   tags: ["User"]
 *   summary: user login api
 *   description: api used to login users
 *   parameters:
 *      - in: body
 *        name: user
 *        description: user login api
 *        schema:
 *         type: object
 *         required:
 *          - user phone number
 *         properties:
 *           phone:
 *             type: string
 *           build_type:
 *             type: string
 *           phone_suffix:
 *             type: string
 *           std_code:
 *             type: string
 *           version_code:
 *             type: number
 *   responses:
 *    '200':
 *      description: success
 *    '400':
 *      description: fail
 */

/*
* Joi validation on input data
*/
const userSchema = Joi.object({
  phone: Joi.string()
    .optional()
    .allow("")
    .label("Phone number with country code"),
  build_type: Joi.string()
    .optional()
    .allow("")
    .label("type of build"),
  phone_suffix: Joi.string()
    .optional()
    .allow("")
    .label("phone number without country code"),
  std_code: Joi.string()
    .optional()
    .allow("")
    .label("Country code"),
  version_code: Joi.number()
    .optional()
    .allow("")
    .label("Version code of the app")
});

/*
* api call to function
*/
app.post(
  "/user/sendOtp",
  validator.body(userSchema, {
    joi: { convert: true, allowUnknown: false }
  }),
  login
);

export default app;
