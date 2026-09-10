"use server"
import { currentUser } from "@/modules/auth/actions";
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache";
import { UploadFolder } from "../libs/path-to-json";


// Toggle marked status for a problem
// export const toggleStarMarked = async (playgroundId: string, isChecked: boolean) => {
//     const user = await currentUser();
//     const userId = user?.id;
//   if (!userId) {
//     throw new Error("User ID is required");
//   }

//   try {
//     if (isChecked) {
//       await db.starMark.create({
//         data: {
//           userId: userId!,
//           playgroundId,
//           isMarked: isChecked,
//         },
//       });
//     } else {
//       await db.starMark.delete({
//         where: {
//           userId_playgroundId: {
//             userId,
//             playgroundId: playgroundId,

//           },
//         },
//       });
//     }

//     revalidatePath("/dashboard");
//     return { success: true, isMarked: isChecked };
//   } catch (error) {
//     console.error("Error updating problem:", error);
//     return { success: false, error: "Failed to update problem" };
//   }
// };

export const createProject = async (data:{
    title: string;
    description?: string;
  })=>{
    const {title , description} = data;

    const user = await currentUser();
    try {
        const project = await db.project.create({
            data:{
                title:title,
                description:description,
                userId:user?.id!
            }
        })

        return project;
    } catch (error) {
        console.log(error)
    }
}

export const createProjectFile = async (projectId: string, data: UploadFolder)=>{

  const user = await currentUser();
  if (!user) return null;

  try {
    const updatedPlayground = await db.projectFile.create({
        data: {
            id: projectId,
            content: JSON.stringify(data),
        }
    });

    return updatedPlayground;
  } catch (error) {
    console.log("SaveUpdatedCode error:", error);
    return null;
  }
};

export const getAllProjectsForUser = async ()=>{
    try {
        const user  = await currentUser();
        const project = await db.project.findMany({
            where:{
                userId:user?.id!
            },
            include:{
                user:true,
                // stars:{
                //     where:{
                //         userId:user?.id!
                //     },
                //     select:{
                //         isMarked:true
                //     }
                // }
            }
        })
      
        return project;
    } catch (error) {
        console.log(error)
    }
}

export const getProjectById = async (id:string)=>{
    try {
        const project = await db.project.findUnique({
            where:{id},
            select:{
                id: true,
              title: true,
              description: true,
              files:{
                select:{
                  content:true
                }
              }
            }
        })
        return project;
    } catch (error) {
        console.log(error)
    }
}

export const SaveUpdatedCode = async (projectId: string, data: UploadFolder) => {
  const user = await currentUser();
  if (!user) return null;

  try {
    const updatedPlayground = await db.projectFile.upsert({
      where: {
        id: projectId, // now allowed since projectid is unique
      },
      update: {
        content: JSON.stringify(data),
      },
      create: {
        id: projectId,
        content: JSON.stringify(data),
      },
    });

    return updatedPlayground;
  } catch (error) {
    console.log("SaveUpdatedCode error:", error);
    return null;
  }
};

export const deleteProjectById = async (id:string)=>{
    try {
        await db.project.delete({
            where:{id}
        })
        revalidatePath("/dashboard")
    } catch (error) {
        console.log(error)
    }
}


export const editProjectById = async (id:string,data:{title:string , description?:string})=>{
    try {
        await db.project.update({
            where:{id},
            data:data
        })
        revalidatePath("/dashboard")
    } catch (error) {
        console.log(error)
    }
}

export const duplicateProjectById = async (id: string) => {
    try {
        // Fetch the original playground data
        const originalProject = await db.project.findUnique({
            where: { id },
        });

        if (!originalProject) {
            throw new Error("Original Project not found");
        }

        // Create a new playground with the same data but a new ID
        const duplicatedProject = await db.project.create({
            data: {
                title: `${originalProject.title} (Copy)`,
                description: originalProject.description,
                userId: originalProject.userId,
                // project: {
                //   // @ts-ignore
                //     create: originalPlayground.templateFiles.map((file) => ({
                //         content: file.content,
                //     })),
                // },
            },
        });

        // Revalidate the dashboard path to reflect the changes
        revalidatePath("/dashboard");

        // return duplicatedProject;
    } catch (error) {
        console.error("Error duplicating project:", error);
    }
};