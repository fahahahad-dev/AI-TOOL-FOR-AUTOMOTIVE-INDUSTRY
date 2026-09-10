"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/modules/auth/actions";

export const getProjectById = async (id: string) => {
  try {
    const user = await currentUser();
    if (!user) return null;

    const project = await db.project.findUnique({
      where: { id },
      include: {
        files: true  // includes: id, name, type, content, parentId, etc.
      },
    });

    return project;
  } catch (error) {
    console.log("getProjectById error:", error);
    return null;
  }
};

export const saveProjectFiles = async (projectId: string, json: any) => {
  try {
    // find root file first
    const root = await db.projectFile.findFirst({
      where: { 
        project: { id: projectId }, 
        // name: "project.json" 
    },
    });

    if (root) {
      return await db.projectFile.update({
        where: { id: root.id },
        data: { content: JSON.stringify(json) },
      });
    }

    // if file does not exist → create it
    return await db.projectFile.create({
      data: {
        project: { connect: { id: projectId } },
        // name: "project.json",
        // type: "file",
        content: JSON.stringify(json),
      },
    });
  } catch (error) {
    console.log("saveProjectFiles error:", error);
    return null;
  }
};