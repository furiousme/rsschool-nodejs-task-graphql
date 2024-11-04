import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql } from 'graphql';
import { rootSchema } from './root-schema.js';
import depthLimit from 'graphql-depth-limit';
import { validate, specifiedRules, parse } from 'graphql'

const allValidationRules = [
  ...specifiedRules,
  depthLimit(5),
];

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const validationErrors = validate(rootSchema, parse(req.body.query), allValidationRules);

      if (validationErrors.length > 0) {
        return { errors: validationErrors }
      }

      const { data, errors } = await graphql({
        schema: rootSchema,
        source: req.body.query,
        variableValues: req.body.variables,
        contextValue: { db: prisma }
      });

      return { data, errors }
    },
  });
};

export default plugin;
