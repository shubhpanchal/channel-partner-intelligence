"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchProjectById,
  fetchProjects,
  ProjectDetailResponse,
  ProjectFilters,
  ProjectListResponse,
} from "@/lib/api/projects";

export const PROJECTS_DIRECTORY_QUERY_KEY = "projects-directory";
export const PROJECT_DETAIL_QUERY_KEY = "project-detail";

/**
 * Custom hook to fetch paginated Projects Portfolio data with filters using TanStack Query
 */
export function useProjects(filters?: ProjectFilters) {
  return useQuery<ProjectListResponse, Error>({
    queryKey: [PROJECTS_DIRECTORY_QUERY_KEY, filters],
    queryFn: () => fetchProjects(filters),
    staleTime: 60 * 1000,
  });
}

/**
 * Custom hook to fetch detailed individual project information using TanStack Query
 */
export function useProjectDetail(projectId: string | null) {
  return useQuery<ProjectDetailResponse, Error>({
    queryKey: [PROJECT_DETAIL_QUERY_KEY, projectId],
    queryFn: () => {
      if (!projectId) {
        throw new Error("Project ID is required.");
      }
      return fetchProjectById(projectId);
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}
