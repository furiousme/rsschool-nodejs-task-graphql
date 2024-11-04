/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { MemberType, Post, PrismaClient, Profile, User } from "@prisma/client";
import { GraphQLFloat, GraphQLInt, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLList, GraphQLBoolean, GraphQLEnumType, GraphQLInputObjectType } from "graphql";
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

const CreateUserInput = new GraphQLInputObjectType({
	name: "CreateUserInput",
	fields: () => ({
		name: { type: GraphQLString },
		balance: { type: GraphQLFloat },
	})
})

const CreateProfileInput = new GraphQLInputObjectType({
	name: "CreateProfileInput",
	fields: () => ({
		userId: { type: GraphQLString },
		isMale: { type: GraphQLBoolean },
		yearOfBirth: { type: GraphQLInt },
		memberTypeId: { type: GraphQLString },
	})
})

const CreatePostInput = new GraphQLInputObjectType({
	name: "CreatePostInput",
	fields: () => ({
		authorId: { type: GraphQLString },
		title: { type: GraphQLString },
		content: { type: GraphQLString },
	})
})

const ChangeUserInput = new GraphQLInputObjectType({
	name: "ChangeUserInput",
	fields: () => ({
		name: { type: GraphQLString },
		balance: { type: GraphQLFloat },
	})
})

const ChangeProfileInput = new GraphQLInputObjectType({
	name: "ChangeProfileInput",
	fields: () => ({
		isMale: { type: GraphQLBoolean },
		yearOfBirth: { type: GraphQLInt },
		memberTypeId: { type: MemberTypeIdType },
	})
})

const ChangePostInput = new GraphQLInputObjectType({
	name: "ChangePostInput",
	fields: () => ({
		title: { type: GraphQLString },
		content: { type: GraphQLString },
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
			createUser: {
				type: UserType,
				args: { dto: { type: CreateUserInput }},
				resolve: async (_, {dto}: {dto: {name: string, balance: number}}, {db}: {db: PrismaClient}) => {
					return await db.user.create({
						data: {
							name: dto.name,
							balance: dto.balance,
						}
					});
				}
			},
			createProfile: {
				type: ProfileType,
				args: { dto: { type: CreateProfileInput }},
				resolve: async (_, {dto}: {dto: {userId: string, isMale: boolean, yearOfBirth: number, memberTypeId: string}}, {db}: {db: PrismaClient}) => {
					return await db.profile.create({
						data: {
							userId: dto.userId,
							isMale: dto.isMale,
							yearOfBirth: dto.yearOfBirth,
							memberTypeId: dto.memberTypeId,
						}
					});
				}
			},
			createPost:	{
				type: PostType,
				args: { dto: { type: CreatePostInput}},
				resolve: async (_, {dto}: {dto: {authorId: string, title: string, content: string}}, {db}: {db: PrismaClient}) => {
					return await db.post.create({
						data: {
							authorId: dto.authorId,
							title: dto.title,
							content: dto.content,
						}
					});
				}
		},
			changeUser: {
				type: UserType,
				args: { dto: { type: ChangeUserInput }, id: { type: UUIDType}},
				resolve: async (_, args: { dto: {name: string, balance: number}, id: string}, {db}: {db: PrismaClient}): Promise<User | null> => {
					const {dto, id} = args;
					const {name, balance} = dto;
					return await db.user.update({
						where: {
							id: id,
						},
						data: {
							name: name,
							balance: balance,
						}
					});
				}
			},
			changeProfile: {
				type: ProfileType,
				args: { dto: { type: ChangeProfileInput }, id: { type: UUIDType }},
				resolve: async (_, args: {dto: {isMale: boolean, yearOfBirth: number, memberTypeId: string}, id: string}, {db}: {db: PrismaClient}) => {
					const {dto, id} = args;
					const {isMale, yearOfBirth, memberTypeId} = dto;

					return await db.profile.update({
						where: {
							id: id,
						},
						data: {
							isMale: isMale,
							yearOfBirth: yearOfBirth,
							memberTypeId: memberTypeId,
						}
					});
				}
			},
			changePost: {
				type: PostType,
				args: { dto: { type: ChangePostInput }, id: { type: UUIDType }},
				resolve: async (_, args: {dto: {id: string, title: string, content: string}, id: string}, {db}: {db: PrismaClient}) => {
					const {dto, id} = args;
					const {title, content} = dto;

					return await db.post.update({
						where: {
							id: id,
						},
						data: {
							title: title,
							content: content,
						}
					});
				}
			},
			deleteUser: {
				type: GraphQLString,
				args: {
					id: {type: UUIDType},
				},
				resolve: async (_, {id}: {id: string}, {db}: {db: PrismaClient}) => {
					await db.user.delete({
						where: {
							id: id,
						}
					});
					return id;
				}
			},
			deleteProfile: {
				type: GraphQLString,
				args: {
					id: {type: UUIDType},
				},
				resolve: async (_, {id}: {id: string}, {db}: {db: PrismaClient}) => {
					await db.profile.delete({
						where: {
							id: id,
						}
					});
					return id;
				}
			},
			deletePost: {
				type: GraphQLString,
				args: {
					id: {type: UUIDType},
				},
				resolve: async (_, {id}: {id: string}, {db}: {db: PrismaClient}) => {
					await db.post.delete({
						where: {
							id: id,
						}
					});
					return id;
				}
			},
			subscribeTo: {
				type: GraphQLString,
				args: {
					userId: {type: UUIDType},
					authorId: {type: UUIDType},
				},
				resolve: async (_, {userId, authorId}: {userId: string, authorId: string}, {db}: {db: PrismaClient}) => {
					await db.subscribersOnAuthors.create({
						data: {
						  subscriberId: userId,
						  authorId: authorId,
						},
					});
					return authorId;
				}
			},
			unsubscribeFrom: {
				type: GraphQLString,
				args: {
					userId: {type: UUIDType},
					authorId: {type: UUIDType},
				},
				resolve: async (_, {userId, authorId}: {userId: string, authorId: string}, {db}: {db: PrismaClient}) => {
					await db.subscribersOnAuthors.delete({
						where: {
							subscriberId_authorId: {
								subscriberId: userId,
								authorId: authorId,
							}
						}
					});
					return authorId;
				}
			}
		}
	})
})