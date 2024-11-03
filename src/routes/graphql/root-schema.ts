import { MemberType, Post, PrismaClient } from "@prisma/client";
import { GraphQLFloat, GraphQLInt, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLList } from "graphql";
import { UUIDType } from "./types/uuid.js";

const memberTypeObj = new GraphQLObjectType({
  name: "MemberType",
  fields: () => ({
    id: {type: GraphQLString},
    discount: {type: GraphQLFloat},
    postsLimitPerMonth: {type: GraphQLInt},
  })
})

const post = new GraphQLObjectType({
	name: "Post",
	fields: () => ({
		id: {type: UUIDType},
		title: {type: GraphQLString},
		content: {type: GraphQLString},
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
			},
			posts: {
				type: new GraphQLList(post),
				resolve: async (_, __, {db}: {db: PrismaClient}): Promise<Post[]> => {
					return await db.post.findMany();
				}
			},
			post: {
				type: post,
				args: {id: {type: UUIDType},},
				resolve: async (_, {id}: {id: string}, {db}: {db: PrismaClient}): Promise<Post | null> => {
					return await db.post.findUnique({ where: { id: id}});
				}
			},
		}
	})
})