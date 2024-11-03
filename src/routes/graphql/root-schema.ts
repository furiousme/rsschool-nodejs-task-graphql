import { MemberType, Post, PrismaClient, Profile, User } from "@prisma/client";
import { GraphQLFloat, GraphQLInt, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLList, GraphQLBoolean, GraphQLEnumType } from "graphql";
import { UUIDType } from "./types/uuid.js";

const MemberTypeIdType = new GraphQLEnumType({
	name: "MemberTypeId",
	values: {
		BASIC: { value: "BASIC" },
		BUSINESS: { value: "BUSINESS" },
	}
})

const MemberTypeType = new GraphQLObjectType({
  name: "MemberType",
  fields: () => ({
    id: {type: MemberTypeIdType},
    discount: {type: GraphQLFloat},
    postsLimitPerMonth: {type: GraphQLInt},
  })
})

const PostType = new GraphQLObjectType({
	name: "Post",
	fields: () => ({
		id: {type: UUIDType},
		title: {type: GraphQLString},
		content: {type: GraphQLString},
	})
})

const UserType = new GraphQLObjectType({
	name: "User",
	fields: () => ({
		id: {type: UUIDType},
		name: { type: GraphQLString },
		balance: { type: GraphQLFloat },
		profile: {
			type: ProfileType, 
			resolve: ({id}: {id: string}, _, {db}: {db: PrismaClient}): Promise<Profile | null> => {
				return db.profile.findUnique({where: {userId: id}})
			}
		},
		posts: {
			type: new GraphQLList(PostType),
			resolve: ({id}: {id: string}, _, {db}: {db: PrismaClient}): Promise<Post[]> => {
				return db.post.findMany({where: {authorId: id}})
			}
		},
		userSubscribedTo: {
			type: new GraphQLList(UserType),
			resolve: ({id}: {id: string}, _, {db}: {db: PrismaClient}): Promise<User[]> => {
				return db.user.findMany({
					where: {
						subscribedToUser: {
							some: {
								subscriberId: id,
						},
					},
				},
			});
		}},
		subscribedToUser: { 
			type: new GraphQLList(UserType), 
			resolve: ({id}: {id: string}, _, {db}: {db: PrismaClient}): Promise<User[]> => {
				return db.user.findMany({
					where: {
						userSubscribedTo: {
							some: {
								authorId: id,
							},
						},
					},
				})
			},
		}
	})
})

const ProfileType = new GraphQLObjectType({
	name: "Profile",
	fields: () => ({
		id: { type: UUIDType },
		isMale: { type: GraphQLBoolean },
		yearOfBirth: { type: GraphQLInt },
		memberTypeId: { type: GraphQLString },
		memberType: { type: MemberTypeType, resolve: async ({memberTypeId}: {memberTypeId: string}, _, {db}: {db: PrismaClient}) => {
				return await db.memberType.findUnique({where: {id: memberTypeId}})
			},
		}
	})
})

const SubscriberOnAuthorsType = new GraphQLObjectType({
	name: "SubscriberOnAuthors",
	fields: () => ({
		id: { type: UUIDType },
		subscriberId: { type: GraphQLString },
		authorId: { type: GraphQLString },
	})
})

export const rootSchema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: "RootQueryType",
		fields: {
			memberType: {
				type: MemberTypeType,
				args: {id: {type: MemberTypeIdType},},
				resolve: async (_, {id}: {id: string}, {db}: {db: PrismaClient}): Promise<MemberType | null> => {
					return await db.memberType.findUnique({ where: { id: id}});
				}
			},
			memberTypes: {
				type: new GraphQLList(MemberTypeType),
				resolve: async (_, __, {db}: {db: PrismaClient}): Promise<MemberType[]> => {
					return await db.memberType.findMany();
				}
			},
			posts: {
				type: new GraphQLList(PostType),
				resolve: async (_, __, {db}: {db: PrismaClient}): Promise<Post[]> => {
					return await db.post.findMany();
				}
			},
			post: {
				type: PostType,
				args: {id: {type: UUIDType},},
				resolve: async (_, {id}: {id: string}, {db}: {db: PrismaClient}): Promise<Post | null> => {
					return await db.post.findUnique({ where: { id: id}});
				}
			},
			users: {
				type: new GraphQLList(UserType),
				resolve: async (_, __, {db}: {db: PrismaClient}): Promise<User[]> => {
					return await db.user.findMany();
				}
			},
			user: {
				type: UserType,
				args: {id: {type: UUIDType}},
				resolve: async (_, {id}: {id: string}, {db}: {db: PrismaClient}): Promise<User | null> => {
					return await db.user.findUnique({ where: { id: id}});
				}
			},
			profiles: {
				type: new GraphQLList(ProfileType),
				resolve: async (_, __, {db}: {db: PrismaClient}): Promise<Profile[]> => {
					return await db.profile.findMany();
				}
			},
			profile: {
				type: ProfileType,
				args: {id: {type: UUIDType}},
				resolve: async (_, {id}: {id: string}, {db}: {db: PrismaClient}): Promise<Profile | null> => {
					return await db.profile.findUnique({ where: {id: id}});
				}
			}
		}
	}),
	mutation: new GraphQLObjectType({
		name: "Mutation",
		fields: {
			subscribeTo: {
				type: SubscriberOnAuthorsType,
				args: {
					userId: {type: GraphQLString},
					authorId: {type: GraphQLString},
				},
				resolve: async (_, {userId, authorId}: {userId: string, authorId: string}, {db}: {db: PrismaClient}) => {
					const res = await db.subscribersOnAuthors.create({
						data: {
						  subscriberId: userId,
						  authorId: authorId,
						},
					});

					console.log({res})
				}
			},
			unsubscribeFrom: {
				type: SubscriberOnAuthorsType,
				args: {
					subscriberId: {type: GraphQLString},
					authorId: {type: GraphQLString},
				},
				resolve: async (_, {userId, authorId}: {userId: string, authorId: string}, {db}: {db: PrismaClient}) => {
					const res = await db.subscribersOnAuthors.delete({
						where: {
							subscriberId_authorId: {
								subscriberId: userId,
								authorId: authorId,
							}
						}
					});

					console.log({res})
				}
			}
		}
	})
})