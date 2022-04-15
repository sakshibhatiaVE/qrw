/*
 * @file: swagger-config.js
 * @description: It Contain swagger configrations.
 * @author: Sakshi Bhatia
 */
import swaggerJsDocs from "swagger-jsdoc";
import config from 'config';
const { swaggerURL, swaggerPort } = config.get('app');

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "TransportTv project apis",
      version: "1.0",
      description: "All api end points",
      contact: {
        name: "Sakshi Bhatia"
      },
      servers: [`${swaggerURL}`]
    },
    produces: ["application/json"],
    host: `${swaggerPort}`
  },
  apis: [
    "./api/*/*/*.js",
    "./api/v1/user/*.js",
    "./api/v1/common/*.js",
    "./api/v1/roles/*.js",
    "./api/v1/permissions/*.js"
  ],
  layout: "AugmentingLayout"
};
export default swaggerJsDocs(swaggerOptions);
