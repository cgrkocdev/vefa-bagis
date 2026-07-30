import type { PosterProject } from "./poster-types";

export function sortPosterShares<T extends { shareNumber: number }>(shares: T[]) {
  return [...shares].sort((first, second) => first.shareNumber - second.shareNumber);
}

export function visiblePosterShares<T extends { status: string; shareNumber: number }>(shares: T[], showEmpty: boolean) {
  return sortPosterShares(shares).filter((share) => showEmpty || share.status !== "EMPTY");
}

export function filterPosterProjects(projects: PosterProject[], input: { first?: number; last?: number; excluded?: number[]; includeCompleted?: boolean }) {
  const excluded = new Set(input.excluded ?? []);
  return projects.filter((project) =>
    (input.includeCompleted || project.status !== "COMPLETED") &&
    (!input.first || project.projectNumber >= input.first) &&
    (!input.last || project.projectNumber <= input.last) &&
    !excluded.has(project.projectNumber),
  );
}
