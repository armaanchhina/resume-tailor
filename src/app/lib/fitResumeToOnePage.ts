// Removes the least valuable content from a tailored resume, one step at a
// time, so a caller can re-render and recheck page count in a loop. Assumes
// projects and work-experience bullets are already ordered most-relevant-first
// (see tailorResumePrompt) so trimming from the end drops the weakest content.
// Returns false once there's nothing left worth cutting.
export function trimOneStep(tailored: any): boolean {
  const projects = tailored.projects ?? [];
  const work = tailored.workExperience ?? [];

  const biggestProject = [...projects]
    .filter((p: any) => (p.bullets?.length ?? 0) > 2)
    .sort((a: any, b: any) => b.bullets.length - a.bullets.length)[0];
  if (biggestProject) {
    biggestProject.bullets.pop();
    return true;
  }

  if (projects.length > 0) {
    projects.pop();
    return true;
  }

  const biggestRole = [...work]
    .filter((w: any) => (w.responsibilities?.length ?? 0) > 2)
    .sort((a: any, b: any) => b.responsibilities.length - a.responsibilities.length)[0];
  if (biggestRole) {
    biggestRole.responsibilities.pop();
    return true;
  }

  if (work.length > 1) {
    work.pop();
    return true;
  }

  return false;
}
