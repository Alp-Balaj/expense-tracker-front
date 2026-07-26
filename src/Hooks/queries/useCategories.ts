import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import type { Category, AddCategory } from "@/Models/Category";

const ENDPOINT = "api/Category";
const FIVE_MINUTES = 5 * 60_000;

export const useCategoriesQuery = () => useResourceQuery<Category>(queryKeys.categories, ENDPOINT, FIVE_MINUTES);
export const useCreateCategory = () => useCreateResource<AddCategory>(queryKeys.categories, ENDPOINT);
export const useUpdateCategory = () => useUpdateResource<AddCategory>(queryKeys.categories, ENDPOINT);
export const useDeleteCategory = () => useDeleteResource<Category>(queryKeys.categories, ENDPOINT);
