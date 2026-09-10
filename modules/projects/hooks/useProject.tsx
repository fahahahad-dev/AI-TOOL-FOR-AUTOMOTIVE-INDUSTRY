import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getProjectById, SaveUpdatedCode } from '../actions';
import { UploadFolder } from '../libs/path-to-json';
import { log } from 'console';

interface ProjectData {
  id: string,
  title: string,
  description?: string | null,
  [key: string]: any;
}

interface UseProjectReturn {
  projectData: ProjectData | null;
  uploadData: UploadFolder | null;
  isLoading: boolean;
  error: string | null;
  loadProject: () => Promise<void>;
  saveUploadData: (data: UploadFolder) => Promise<void>;
}

export const useProject = (id: string): UseProjectReturn => {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [uploadData, setUploadData] = useState<UploadFolder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('ID: ', id)

      const data = await getProjectById(id);

      if (!data) throw Error ("Project Not Found")
      console.log('Use proj mei hu: ', data)
      setProjectData(data);

      const raw = data?.files?.[0]?.content;

      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        setUploadData(parsed);
        toast.success("Project loaded");
      } else {
        // No file saved yet → empty root
        setUploadData({
          folderName: "Root",
          items: [],
        });
      }

    } catch (err) {
      console.error("Error loading project:", err);
      setError("Failed to load project");
      toast.error("Failed to load project");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const saveUploadData = useCallback(async (data: UploadFolder) => {
    try {
      await SaveUpdatedCode(id, data);
      setUploadData(data);
      toast.success("Saved");
    } catch (err) {
      console.error("Error saving:", err);
      toast.error("Failed to save");
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  return {
    projectData,
    uploadData,
    isLoading,
    error,
    loadProject,
    saveUploadData,
  };
};
