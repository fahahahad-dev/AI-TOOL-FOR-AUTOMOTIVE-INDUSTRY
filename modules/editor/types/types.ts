export interface UploadFile {
  filename: string;
  fileExtension: string;
  content: string;
}
export interface ProjectData {
  id: string;
  name?: string;
  [key: string]: any;
}

export interface UploadFolder {
  folderName: string;
  items: (UploadFile | UploadFolder)[];
}

export interface LoadingStepProps {
  currentStep: number;
  step: number;
  label: string;
}

export interface OpenFile extends UploadFile {
  id: string;
  hasUnsavedChanges: boolean;
  content: string;
  originalContent: string;
}

