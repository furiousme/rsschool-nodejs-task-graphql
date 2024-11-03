import { MemberType, PrismaClient } from "@prisma/client";
import { GraphQLFloat, GraphQLInt, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLList } from "graphql";

const memberTypeObj = new GraphQLObjectType({
  name: "MemberType",
  fields: () => ({
    id: {type: GraphQLString},
    discount: {type: GraphQLFloat},
    postsLimitPerMonth: {type: GraphQLInt},
  })
})

export const rootSchema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: "RootQueryType",
		fields: {
			memberType: {
				type: memberTypeObj,
				args: {id: {type: GraphQLString},},
				resolve: async (_, {id}: {id: string}, {db}: {db: PrismaClient}): Promise<MemberType | null> => {
					return await db.memberType.findUnique({ where: { id: id}});
				}
			},
			memberTypes: {
				type: new GraphQLList(memberTypeObj),
				resolve: async (_, __, {db}: {db: PrismaClient}): Promise<MemberType[]> => {
					return await db.memberType.findMany();
				}
			}
		}
	})
})