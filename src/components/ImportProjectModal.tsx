import {
  FormEvent,
  useState
} from "react";

import Input from "./Input";
import Modal from "@/components/Modal";

import stores from "../stores";
import { useProjectsStore } from "@/pages/projects";
 
type ImportProjectModalProps = {
  open: boolean;
  closeModal: () => void;
};

export default function ImportProjectModal ({
  open, closeModal
}: ImportProjectModalProps) {
  const [slug, setSlug] = useState("");

  const {
    projectToImport,
    allLocalProjects,
    setAllLocalProjects,
    setProjectToImport
  } = useProjectsStore();

  const handleCreation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Verify slug state.
    if (!slug || !projectToImport || !allLocalProjects) return;
    
    // Save the project in localForage.
    const [success, message, project] = await stores.projects.updateProject(
      slug, projectToImport
    );

    // If succeed, we update the all local projects.
    if (success && project) {
      setAllLocalProjects([
        ...allLocalProjects,
        {
          slug,
          data: project
        }
      ]);

      resetAndClose();
    }
    else {
      console.error(`[ImportProjectModal] ${message}`);
    }
  };
  
  /** We reset the values and close modal. */
  const resetAndClose = () => {
    setSlug("");
    setProjectToImport(null);
    closeModal();
  };

  return (
    <Modal open={open} onClose={resetAndClose}>
      <h2 className="mt-6 text-3xl font-medium text-center text-gray-200">
        Import a cover
      </h2>
      <p className="px-4 py-2 text-opacity-40 bg-blue-800 bg-opacity-20 rounded-lg">
        You are currently importing <span className="font-medium text-blue-400">
          {projectToImport ? projectToImport.name : ""}
        </span> project.
      </p>

      <form className="mt-8 space-y-6" onSubmit={handleCreation}>
        <Input
          className="border border-blue-400"
          labelName="Personal slug"
          placeholder="some-amazing-cover"
          smallTipText="Slug used to identify the cover more easily from URL."
          onChange={(e) => {
            const cleanedValue = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
            return setSlug(cleanedValue);
          }}
          value={slug}
        />

        <div className="flex gap-2 justify-between">
          <button
            type="button"
            className="px-4 py-2 w-full text-sm font-medium text-gray-400 text-opacity-60 transition-colors hover:text-opacity-80"
            onClick={resetAndClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 w-full text-sm font-medium text-blue-400 bg-blue-800 bg-opacity-40 rounded-md transition-colors hover:bg-opacity-60 focus:bg-opacity-70"
          >
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}