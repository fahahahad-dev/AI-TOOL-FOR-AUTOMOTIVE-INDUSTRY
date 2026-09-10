"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowDown, Github } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { importGithubRepo } from "@/modules/projects/actions/importGithubRepo";

const AddRepo = () => {
  const [open, setOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!repoUrl.trim()) {
      toast.error("Please enter a GitHub repository URL");
      return;
    }

    setLoading(true);
    try {
      const res = await importGithubRepo(repoUrl);

      if (!res?.id) throw new Error("Import failed");

      toast.success("Repository imported successfully!");
      setOpen(false);
      setRepoUrl("");
      // router.push(`/editor/${res.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to import repository");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group px-6 py-6 flex flex-row justify-between items-center border rounded-lg bg-muted cursor-pointer 
        transition-all duration-300 ease-in-out
        hover:bg-background hover:border-[#2563EB] hover:scale-[1.02]"
      >
        <div className="flex gap-4">
          <Button variant="outline" size="icon">
            <ArrowDown />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#2563EB]">
              Open GitHub Repository
            </h1>
            <p className="text-sm text-muted-foreground">
              Import repo directly into editor
            </p>
          </div>
        </div>

        <Image src="/github.png" alt="github" width={150} height={150} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github /> Import GitHub Repository
            </DialogTitle>
          </DialogHeader>

          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="https://github.com/user/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />

          <DialogFooter>
            <Button
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? "Importing..." : "Import Repository"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddRepo;
