"use server";

import fs from "fs/promises";
import path from "path";
import os from "os";
import AdmZip from "adm-zip";

import { createProject, SaveUpdatedCode } from "./index";
import { UploadFolder } from "../libs/path-to-json";

export const importGithubRepo = async (repoUrl: string) => {
  // extract owner & repo
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");

  const [, owner, repo] = match;
  const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;

  // temp directory
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "github-"));
  const zipPath = path.join(tmpDir, "repo.zip");

  // download zip
  const res = await fetch(zipUrl);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(zipPath, buffer);

  // extract
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(tmpDir, true);

  const extractedFolder = (await fs.readdir(tmpDir)).find((f) =>
    f.includes(repo)
  );

  if (!extractedFolder) {
    throw new Error("Repo extraction failed");
  }

  const rootPath = path.join(tmpDir, extractedFolder);

  // build UploadFolder JSON
  const uploadJson: UploadFolder = {
    folderName: repo,
    items: [],
  };

  async function walk(dir: string, container: any[]) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const folder = {
          folderName: entry.name,
          items: [],
        };
        container.push(folder);
        await walk(fullPath, folder.items);
      } else {
        const content = await fs.readFile(fullPath, "utf-8");
        const extIndex = entry.name.lastIndexOf(".");

        container.push({
          filename:
            extIndex === -1
              ? entry.name
              : entry.name.slice(0, extIndex),
          fileExtension:
            extIndex === -1 ? "" : entry.name.slice(extIndex + 1),
          content,
        });
      }
    }
  }

  await walk(rootPath, uploadJson.items);

  // create project + save files
  const project = await createProject({ title: repo });
  if (!project?.id) throw new Error("Project creation failed");

  await SaveUpdatedCode(project.id, uploadJson);

  return project;
};