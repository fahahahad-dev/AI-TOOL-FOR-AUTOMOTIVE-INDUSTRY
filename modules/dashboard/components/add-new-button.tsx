"use client";

import { Button } from "@/components/ui/button";
import { createProject, SaveUpdatedCode } from "@/modules/projects/actions"; // your function
import { readUploadStructureFromJson, saveUploadStructureToJson } from "@/modules/projects/libs/path-to-json";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import fs from "fs/promises";
import path from "path";


const AddNewButton = () => {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  function isFile(entry: any): entry is File {
  return entry instanceof File;
}

  function parseNameExt(full: string) {
  const lastDot = full.lastIndexOf(".");
  if (lastDot === -1) return { name: full, ext: "" };

  return {
    name: full.slice(0, lastDot),
    ext: full.slice(lastDot + 1),
  };
}


  async function buildTemplateJson(files: { file: File; path: string }[]) {
  const root: any = {};

  for (const { file, path } of files) {
    const parts = path.split("/");
    const fileNameWithExt = parts.pop()!;
    let current = root;

    // create folders
    for (const part of parts) {
      if (!current[part]) current[part] = {};
      current = current[part];
    }

    // add file
    current[fileNameWithExt] = file;
  }

  // convert internal object into TemplateFolder format
  async function convertToTemplateFormat(obj: any, folderName: string): Promise<any> {
    const items: any[] = [];

    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (isFile(value)) {
        const content = await value.text();
        const { name, ext } = parseNameExt(key);

        items.push({
          filename: name,
          fileExtension: ext,
          content,
        });
      } else {
        items.push(await convertToTemplateFormat(value, key));
      }
    }

    return {
      folderName,
      items,
    };
  }

  return convertToTemplateFormat(root, Object.keys(root)[0]); // top-level
}


  function validateJsonStructure(data: unknown): boolean {
  try {
    JSON.parse(JSON.stringify(data)); // Ensures it's serializable
    return true;
  } catch (error) {
    console.error("Invalid JSON structure:", error);
    return false;
  }
}

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  setUploading(true);

  try {
    const fileArray = Array.from(files).map((file) => ({
      file,
      path: (file as any).webkitRelativePath || file.name,
    }));

    const projectTitle = fileArray[0].path.split("/")[0];
    
    const res = await createProject({
      title: projectTitle,
    });

    if (!res?.id) throw new Error("Project not created");

    const json = await buildTemplateJson(fileArray);
    console.log('json', json)

    if (!validateJsonStructure(json.items)) {
      throw new Error("Invalid JSON Structure");
    }

    const rep = await SaveUpdatedCode(res.id, json);
    console.log(rep)

    if(!rep) {
      throw new Error("Folder/File Uploaded Failed");
    }

    if (res?.id) {
      toast.success("Project created successfully!");
      // router.push(`/editor/${res.id}`);
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to create project.");
  } finally {
    setUploading(false);
  }
};



  return (
    <div
      className="group px-6 py-6 flex flex-row justify-between items-center border rounded-lg bg-muted cursor-pointer 
        transition-all duration-300 ease-in-out
        hover:bg-background hover:border-[#2563EB] hover:scale-[1.02]
        shadow-[0_2px_10px_rgba(0,0,0,0.08)]
        hover:shadow-[0_10px_30px_rgba(233,63,63,0.15)]"
    >
      <div className="flex flex-row justify-center items-start gap-4">
        <Button
          variant={"outline"}
          className="flex justify-center items-center bg-white group-hover:bg-[#fff8f8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] transition-colors duration-300"
          size={"icon"}
        >
          <Plus size={30} className="transition-transform duration-300 group-hover:rotate-90" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-[#2563EB]">Upload Folder</h1>
          <p className="text-sm text-muted-foreground max-w-[220px]">Upload files/folder to add project</p>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <Image
          src={"/upload-folder.png"}
          alt="Create new project"
          width={150}
          height={150}
          className="transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        {...({ webkitdirectory: "true" } as any)} // allows folder selection
        multiple
        onChange={handleFileSelection}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </div>
  );
};

export default AddNewButton;
