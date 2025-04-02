import { env } from "@/env";
import type { AppType } from "@/server";
import { useQueryClient } from "@tanstack/react-query";
import { hc, InferRequestType } from "hono/client";
import { toast } from "sonner";

export const client = hc<AppType>(env.VITE_API_URL, {
	init: {
		credentials: "include",
	},
});

export const userLearnerId = client.api.user.learners[":id"];
export const course = client.api.courses[":id"];
export const courseLearner = client.api.courses[":id"].learners[":learnerId"];
export const key = client.api.keys[":id"];
export const courseModule = client.api.courses[":id"].modules[":moduleId"];
export const collection = client.api.collections[":id"];
export const collectionCourse =
	client.api.collections[":id"].courses[":courseId"];

export const fetchFile = async (fileUrl: string): Promise<File | ""> => {
	const response = await fetch(fileUrl);
	if (!response.ok) {
		return "";
	}
	const blob = await response.blob();
	const filename = fileUrl.split("/").pop(); // Extract filename from URL
	return new File([blob], filename!, { type: blob.type });
};

export const queryOptions = {
	user: {
		me: {
			queryKey: ["user", "me"],
			queryFn: async () => {
				const res = await client.api.user.me.$get();
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		},
		teams: {
			queryKey: ["user", "teams"],
			queryFn: async () => {
				const res = await client.api.user.teams.$get();
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		},
		preferences: {
			queryKey: ["user", "preferences"],
			queryFn: async () => {
				const res = await client.api.user.preferences.$get();
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		},
		i18n: {
			queryKey: ["i18n"],
			queryFn: async () => {
				const res = await client.api.user.i18n.$get();
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		},
		learners: {
			queryKey: ["user.learners"],
			queryFn: async () => {
				const res = await client.api.user.learners.$get();
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		},
		learnerId: (param: InferRequestType<typeof userLearnerId.$get>) => ({
			queryKey: ["user.learnerId"],
			queryFn: async () => {
				const res = await userLearnerId.$get(param);
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		}),
	},
	team: {
		me: (input: InferRequestType<typeof client.api.team.$get>) => ({
			queryKey: ["team.me", input],
			queryFn: async () => {
				const res = await client.api.team.$get(input);
				return await res.json();
			},
		}),
		members: {
			queryKey: ["members"],
			queryFn: async () => {
				const res = await client.api.team.members.$get();
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		},
		stats: {
			queryKey: ["stats"],
			queryFn: async () => {
				const res = await client.api.team.stats.$get();
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		},
	},
	courses: {
		id: (input: InferRequestType<typeof course.$get>) => ({
			queryKey: ["courses", input],
			queryFn: async () => {
				const res = await course.$get(input);
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		}),
		all: {
			queryKey: ["courses"],
			queryFn: async () => {
				const res = await client.api.courses.$get();
				if (!res.ok) {
					throw new Error(await res.text());
				}
				const courses = await res.json();
				return courses.map((course) => ({
					...course,
					createdAt: new Date(course.createdAt),
					updatedAt: new Date(course.updatedAt),
				}));
			},
		},
		learners: (input: InferRequestType<typeof course.learners.$get>) => ({
			queryKey: ["learners", input],
			queryFn: async () => {
				const res = await course.learners.$get(input);
				if (!res.ok) {
					throw new Error(await res.text());
				}
				const learners = await res.json();
				return learners.map((l) => ({
					...l,
					createdAt: new Date(l.createdAt),
					updatedAt: new Date(l.updatedAt),
					completedAt: l.completedAt ? new Date(l.completedAt) : null,
					startedAt: l.startedAt ? new Date(l.startedAt) : null,
					module: l.module
						? {
								...l.module,
								createdAt: new Date(l.module.createdAt),
								updatedAt: new Date(l.module.updatedAt),
							}
						: null,
				}));
			},
		}),
	},
	collections: {
		id: (input: InferRequestType<typeof collection.$get>) => ({
			queryKey: ["collections", input],
			queryFn: async () => {
				const res = await collection.$get(input);
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		}),
		all: {
			queryKey: ["collections"],
			queryFn: async () => {
				const res = await client.api.collections.$get();
				if (!res.ok) {
					throw new Error(await res.text());
				}
				const collections = await res.json();
				return collections.map((collection) => ({
					...collection,
					createdAt: new Date(collection.createdAt),
					updatedAt: new Date(collection.updatedAt),
				}));
			},
		},
		learners: (
			input: InferRequestType<typeof collection.learners.$get>,
		) => ({
			queryKey: ["collections.learners.$get", input],
			queryFn: async () => {
				const res = await collection.learners.$get(input);
				if (!res.ok) {
					throw new Error(await res.text());
				}
				const learners = await res.json();
				return learners.map((l) => ({
					...l,
					createdAt: new Date(l.createdAt),
					updatedAt: new Date(l.updatedAt),
					completedAt: l.completedAt ? new Date(l.completedAt) : null,
					startedAt: l.startedAt ? new Date(l.startedAt) : null,
					module: l.module
						? {
								...l.module,
								createdAt: new Date(l.module.createdAt),
								updatedAt: new Date(l.module.updatedAt),
							}
						: null,
				}));
			},
		}),
		courses: (input: InferRequestType<typeof collection.courses.$get>) => ({
			queryKey: ["collections.courses.$get", input],
			queryFn: async () => {
				const res = await collection.courses.$get(input);
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		}),
	},
	modules: {
		all: (input: InferRequestType<typeof course.modules.$get>) => ({
			queryKey: ["modules", input],
			queryFn: async () => {
				const res = await course.modules.$get(input);
				if (!res.ok) {
					throw new Error(await res.text());
				}
				const modules = await res.json();
				return modules.map((m) => ({
					...m,
					createdAt: new Date(m.createdAt),
					updatedAt: new Date(m.updatedAt),
				}));
			},
		}),
	},
	keys: {
		all: {
			queryKey: ["keys"],
			queryFn: async () => {
				const res = await client.api.keys.$get();
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		},
	},
	learners: {
		id: (input: InferRequestType<typeof courseLearner.$get>) => ({
			queryKey: ["learners", input],
			queryFn: async () => {
				const res = await courseLearner.$get(input);
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		}),
		play: (input: InferRequestType<typeof courseLearner.play.$get>) => ({
			queryKey: ["learners", input],
			queryFn: async () => {
				const res = await courseLearner.play.$get(input);
				if (!res.ok) {
					throw new Error(await res.text());
				}
				const play = await res.json();
				return {
					...play,
					learner: {
						...play.learner,
						createdAt: new Date(play.learner.createdAt),
						updatedAt: new Date(play.learner.updatedAt),
					},
				};
			},
		}),
		certificate: (
			input: InferRequestType<typeof courseLearner.certificate.$get>,
		) => ({
			queryKey: ["learners", input],
			queryFn: async () => {
				const res = await courseLearner.certificate.$get(input);
				if (!res.ok) {
					throw new Error(await res.text());
				}
				const { team, course, learner } = await res.json();
				return {
					team,
					course,
					learner: {
						...learner,
						createdAt: new Date(learner.createdAt),
						updatedAt: new Date(learner.updatedAt),
					},
				};
			},
		}),
	},
};

export const useMutationOptions = () => {
	const queryClient = useQueryClient();

	return {
		collections: {
			create: {
				mutationFn: async (
					input: InferRequestType<
						typeof client.api.collections.$post
					>,
				) => {
					const res = await client.api.collections.$post(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
					return await res.json();
				},
				onSuccess: () => {
					toast.success("Collection created successfully");
					queryClient.invalidateQueries({
						queryKey: queryOptions.collections.all.queryKey,
					});
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
			update: {
				mutationFn: async (
					input: InferRequestType<typeof collection.$put>,
				) => {
					const res = await collection.$put(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
				},
				onSuccess: (_: any, variables: any) => {
					toast.success("Collection updated successfully");
					queryClient.invalidateQueries({
						queryKey: queryOptions.collections.id({
							param: {
								id: variables.param.id,
							},
						}).queryKey,
					});
					queryClient.invalidateQueries({
						queryKey: queryOptions.collections.all.queryKey,
					});
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
			delete: {
				mutationFn: async (
					input: InferRequestType<typeof collection.$delete>,
				) => {
					const res = await collection.$delete(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
				},
				onSuccess: () => {
					toast.success("Collection deleted successfully");
					queryClient.invalidateQueries({
						queryKey: queryOptions.collections.all.queryKey,
					});
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
			learners: {
				create: {
					mutationFn: async (
						input: InferRequestType<typeof collection.invite.$post>,
					) => {
						const res = await collection.invite.$post(input);
						if (!res.ok) {
							throw new Error(await res.text());
						}
						return await res.json();
					},
					onSuccess: (_: any, input: any) => {
						queryClient.invalidateQueries({
							queryKey: queryOptions.collections.learners({
								param: {
									id: input.param.id,
								},
							}).queryKey,
						});
						toast.success("Learners created successfully");
					},
					onError: (error: Error) => {
						toast.error(error.message);
					},
				},
			},
			courses: {
				add: {
					mutationFn: async (
						input: InferRequestType<
							typeof collection.courses.$post
						>,
					) => {
						const res = await collection.courses.$post(input);
						if (!res.ok) {
							throw new Error(await res.text());
						}
						return await res.json();
					},
					onSuccess: (_: any, input: any) => {
						queryClient.invalidateQueries({
							queryKey: queryOptions.collections.courses({
								param: {
									id: input.param.id,
								},
							}).queryKey,
						});
						toast.success("Courses added successfully");
					},
					onError: (error: Error) => {
						toast.error(error.message);
					},
				},
				delete: {
					mutationFn: async (
						input: InferRequestType<
							typeof collectionCourse.$delete
						>,
					) => {
						const res = await collectionCourse.$delete(input);
						if (!res.ok) {
							throw new Error(await res.text());
						}
						return await res.json();
					},
					onSuccess: (_: any, input: any) => {
						queryClient.invalidateQueries({
							queryKey: queryOptions.collections.courses({
								param: {
									id: input.param.id,
								},
							}).queryKey,
						});
						toast.success("Course deleted successfully");
					},
					onError: (error: Error) => {
						toast.error(error.message);
					},
				},
			},
		},
		keys: {
			create: {
				mutationFn: async (
					input: InferRequestType<typeof client.api.keys.$post>,
				) => {
					const res = await client.api.keys.$post(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
				},
				onSuccess: () => {
					toast.success("Key created successfully");
					queryClient.invalidateQueries({
						queryKey: queryOptions.keys.all.queryKey,
					});
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
			delete: {
				mutationFn: async (
					input: InferRequestType<typeof key.$delete>,
				) => {
					const res = await key.$delete(input);
					if (!res.ok) {
						const text = await res.text();
						throw new Error(text);
					}
				},
				onSuccess: () => {
					toast.success("Key deleted successfully");
					queryClient.invalidateQueries({
						queryKey: queryOptions.keys.all.queryKey,
					});
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
		},
		course: {
			join: {
				mutationFn: async (
					input: InferRequestType<typeof course.join.$post>,
				) => {
					const res = await course.join.$post(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
					return await res.json();
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
			create: {
				mutationFn: async (
					input: InferRequestType<typeof client.api.courses.$post>,
				) => {
					const res = await client.api.courses.$post(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
					return await res.json();
				},
				onSuccess: () => {
					toast.success("Course created successfully");
					queryClient.invalidateQueries({
						queryKey: queryOptions.courses.all.queryKey,
					});
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
			update: {
				mutationFn: async (
					input: InferRequestType<typeof course.$put>,
				) => {
					const res = await course.$put(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
				},
				onSuccess: async (_: any, variables: any) => {
					queryClient.invalidateQueries({
						queryKey: queryOptions.courses.id({
							param: {
								id: variables.param.id,
							},
						}).queryKey,
					});
					queryClient.invalidateQueries({
						queryKey: queryOptions.courses.all.queryKey,
					});
					toast.success("Course updated successfully");
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
			delete: {
				mutationFn: async (
					input: InferRequestType<typeof course.$delete>,
				) => {
					const res = await course.$delete(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
				},
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: queryOptions.courses.all.queryKey,
					});
					toast.success("Course deleted successfully");
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
			learners: {
				create: {
					mutationFn: async (
						input: InferRequestType<typeof course.invite.$post>,
					) => {
						const res = await course.invite.$post(input);
						if (!res.ok) {
							throw new Error(await res.text());
						}
						return await res.json();
					},
					onSuccess: (_: any, input: any) => {
						queryClient.invalidateQueries({
							queryKey: queryOptions.courses.learners({
								param: {
									id: input.param.id,
								},
							}).queryKey,
						});
						toast.success("Learner created successfully");
					},
					onError: (error: Error) => {
						toast.error(error.message);
					},
				},
				update: {
					mutationFn: async (
						input: InferRequestType<typeof courseLearner.$put>,
					) => {
						const res = await courseLearner.$put(input);
						if (!res.ok) {
							throw new Error(await res.text());
						}
						return await res.json();
					},
					onError: (error: Error) => {
						toast.error(error.message);
					},
				},
				delete: {
					mutationFn: async (
						input: InferRequestType<typeof courseLearner.$delete>,
					) => {
						const res = await courseLearner.$delete(input);
						if (!res.ok) {
							throw new Error(await res.text());
						}
						return await res.json();
					},
					onSuccess: (_: any, input: any) => {
						queryClient.invalidateQueries({
							queryKey: queryOptions.courses.learners({
								param: {
									id: input.param.id,
								},
							}).queryKey,
						});
					},
					onError: (error: Error) => {
						toast.error(error.message);
					},
				},
			},
			modules: {
				create: {
					mutationFn: async (
						input: InferRequestType<typeof course.modules.$post>,
					) => {
						const res = await course.modules.$post(input);
						if (!res.ok) {
							throw new Error(await res.text());
						}
						return await res.json();
					},
					onSuccess: (_: any, input: any) => {
						queryClient.invalidateQueries({
							queryKey: queryOptions.modules.all({
								param: {
									id: input.param.id,
								},
							}).queryKey,
						});
						toast.success("Module created successfully");
					},
					onError: (error: Error) => {
						toast.error(error.message);
					},
				},
				delete: {
					mutationFn: async (
						input: InferRequestType<typeof courseModule.$delete>,
					) => {
						const res = await courseModule.$delete(input);
						if (!res.ok) {
							throw new Error(await res.text());
						}
						return await res.json();
					},
					onSuccess: (_: any, input: any) => {
						queryClient.invalidateQueries({
							queryKey: queryOptions.modules.all({
								param: {
									id: input.param.id,
								},
							}).queryKey,
						});
						toast.success("Module deleted successfully");
					},
					onError: (error: Error) => {
						toast.error(error.message);
					},
				},
			},
		},
		user: {
			preferences: {
				mutationFn: async (
					input: InferRequestType<
						typeof client.api.user.preferences.$put
					>,
				) => {
					const res = await client.api.user.preferences.$put(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
				},
				onSuccess: (_: any, variables: any) => {
					queryClient.invalidateQueries({
						queryKey: queryOptions.user.preferences.queryKey,
					});
					if (variables.json.locale) {
						queryClient.invalidateQueries({
							queryKey: queryOptions.user.i18n.queryKey,
						});
					}
					if (variables.json.teamId) {
						queryClient.invalidateQueries();
					}
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
		},
		team: {
			create: {
				mutationFn: async (
					input: InferRequestType<typeof client.api.team.$post>,
				) => {
					const res = await client.api.team.$post(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
					return await res.json();
				},
				onSuccess: () => {
					queryClient.invalidateQueries();
					toast.success("Team created successfully");
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
			update: {
				mutationFn: async (
					input: InferRequestType<typeof client.api.team.$put>,
				) => {
					const res = await client.api.team.$put(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
				},
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: queryOptions.team.me({}).queryKey,
					});
					queryClient.invalidateQueries({
						queryKey: queryOptions.user.teams.queryKey,
					});
					toast.success("Team updated successfully");
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
			delete: {
				mutationFn: async () => {
					const res = await client.api.team.$delete();
					if (!res.ok) {
						throw new Error(await res.text());
					}
					return await res.json();
				},
				onSuccess: () => {
					toast.success("Team deleted successfully");
				},
				onError: (error: Error) => {
					toast.error(error.message);
				},
			},
		},
	};
};
