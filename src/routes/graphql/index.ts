import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql } from 'graphql';
import { rootSchema } from './root-schema.js';


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
