import type {
  ProjectStructure
} from "@/types/Project";

import { useLocalProjectStore } from "@/pages/projects/slug";

import { ChangeEvent, Fragment, useEffect, useState } from "react";

type ProjectEditorProps = {
  saveProjectLocally: (data: ProjectStructure) => void;
};

export default function ProjectEditor ({
  saveProjectLocally
}: ProjectEditorProps) {
  const data = useLocalProjectStore(
    state => state.projectLocalData
  );

  useEffect(() => {
    console.info("[ProjectEditor] Loading project editor...");

    // TODO: Load modules and components...

    console.info("[ProjectEditor] Done !");
  }, []);

  if (!data) return <p>Loading...</p>;

  /** Index of the current used launchpad. */
  const [currentLaunchpadSelected, setCurrentLaunchpadSelected] = useState<number | null>(null);
  const handleLaunchpadSelection = (evt: ChangeEvent<HTMLSelectElement>) => {
    // Reset the page selector.
    setCurrentLaunchpadPageSelected(null);

    const index = evt.target.value;
    if (index === "none") {
      setCurrentLaunchpadSelected(null);
      return;
    }
    
    setCurrentLaunchpadSelected(parseInt(index));
  };
  
  /** Index of the current page used in current launchpad. */
  const [currentLaunchpadPageSelected, setCurrentLaunchpadPageSelected] = useState<number | null>(null);
  const handleLaunchpadPageSelection = (evt: ChangeEvent<HTMLSelectElement>) => {
    const index = evt.target.value;
    if (index === "none") {
      setCurrentLaunchpadPageSelected(null);
      return;
    }

    setCurrentLaunchpadPageSelected(parseInt(index));
  };

  /** Add a new launchpad in the project. */
  const addLaunchpad = () => {
    const data_copy = { ...data };

    const index = data_copy.launchpads.length + 1;
    const name = `Launchpad ${index}`;
    data_copy.launchpads.push({ name, pages: [] });
    
    saveProjectLocally(data_copy);
  };

  /** Remove the current selected launchpad with all of its page. */
  const removeLaunchpad = () => {
    const data_copy = { ...data };

    // Remove launchpad using current index.
    data_copy.launchpads = data_copy.launchpads.filter(
      (_, index) => index !== currentLaunchpadSelected
    );

    console.log(data_copy);
    saveProjectLocally(data_copy);
  };

  /** Add a new page to the current selected launchpad. */
  const addLaunchpadPage = () => {
    if (currentLaunchpadSelected === null) return;
    const data_copy = { ...data };

    // Add a new page to the current launchpad.
    const index = data_copy.launchpads[currentLaunchpadSelected].pages.length + 1;
    const name = `Page ${index}`;
    data_copy.launchpads[currentLaunchpadSelected].pages.push({ name, samples: [] });

    saveProjectLocally(data_copy);
  };

  // Short-hands for the current launchpad and page.
  // We append the current index in the objects to avoid
  // having to always re-use `(currentLaunchpadSelected !== null)`, etc...
  const launchpad = (currentLaunchpadSelected !== null) ? {
    ...data.launchpads[currentLaunchpadSelected],
    id: currentLaunchpadSelected
  } : null;
  const page = (launchpad && currentLaunchpadPageSelected !== null) ? {
    ...launchpad.pages[currentLaunchpadPageSelected],
    id: currentLaunchpadPageSelected
  } : null;

  return (
    <div>
      <div>
        <h3>Launchpads</h3>

        <select
          onChange={handleLaunchpadSelection}
          placeholder="Select a launchpad"
        >
          <option value="none">None</option>
          {data.launchpads.map((launchpad, launchpadKey) =>
            <option value={launchpadKey} key={launchpadKey}>
              {launchpad.name}
            </option>
          )}
        </select>

        <button onClick={addLaunchpad}>
          Add a launchpad
        </button>

        {launchpad &&
          <Fragment>
            <input
              type="text"
              value={launchpad.name}
              onChange={evt => {
                const data_copy = { ...data };
                data_copy.launchpads[launchpad.id].name = evt.target.value;
                saveProjectLocally(data_copy);
              }}
            />
            <button onClick={removeLaunchpad}>
              Remove this launchpad
            </button>

            <select
              placeholder="Select a page"
              onChange={handleLaunchpadPageSelection}
            >
              <option value="none">None</option>
              {data.launchpads[launchpad.id].pages.map((page, pageKey) =>
                <option value={pageKey} key={pageKey}>
                  {page.name}
                </option>
              )}
            </select>

            <button onClick={addLaunchpadPage}>
              Add a page to this launchpad
            </button>
          </Fragment>
        }

        {launchpad && page && (
          <div>
            <h3>Page {page.name} from {launchpad.name}</h3>
          </div>
        )}
        
        {/*
          Idea: 
Launchpad: [input:number=1]
Page:      [input:number=4] 

(launchpad-(id) from page (page))
=> when clicking on buttons it shows the details about it

(if(button_clicked)
  (button (id) detail)
  triggers: nothing
  | triggers: { sample: wave_id }

  if (triggers.sample)
    (waveform with highlighted part)
)
        */}
      </div>
    </div>
  );
}