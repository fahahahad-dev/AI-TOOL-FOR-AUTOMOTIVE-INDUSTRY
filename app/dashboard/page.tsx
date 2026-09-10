import AddNewButton from "@/modules/dashboard/components/add-new-button";
import AddRepo from "@/modules/dashboard/components/add-repo";
import { deleteProjectById, duplicateProjectById, editProjectById, getAllProjectsForUser } from "@/modules/projects/actions";

import ProjectTable from "@/modules/dashboard/components/project-table";

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16">
    {/* <img src="/empty-state.svg" alt="No projects" className="w-48 h-48 mb-4" /> */}
    <h2 className="text-xl font-semibold text-gray-500">No projects found</h2>
    <p className="text-gray-400">Create a new project to get started!</p>
  </div>
);

const DashboardMainPage = async () => {
  const projects = await getAllProjectsForUser();
  console.log(projects);
  return (
    <div className="flex flex-col justify-start items-center min-h-screen mx-auto max-w-7xl px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <AddNewButton />
        <AddRepo />
      </div>
      <div className="mt-10 flex flex-col justify-center items-center w-full">
        {projects && projects.length === 0 ? (
          <EmptyState />
        ) : (
          // @ts-ignore
          <ProjectTable
            projects={projects || []}
            onDeleteProject={deleteProjectById}
            onUpdateProject={editProjectById}
            onDuplicateProject={duplicateProjectById}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardMainPage;
