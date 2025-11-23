import { Button } from "@components/ui/button";

interface DatasetCreationProps {
  newName: string;
  setNewName: React.Dispatch<React.SetStateAction<string>>;
  onCreate: () => void;
}

function DatasetCreation({
  newName,
  setNewName,
  onCreate,
}: DatasetCreationProps) {
  const isDisabled = !newName.trim();
  return (
    <div className="mb-6">
      <div className="text-sm text-[#A3A3A3] mb-2">Create a new dataset</div>

      <div className="flex gap-2 items-center">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Dataset Name"
          className="bg-transparent border border-[#1F1F1F] px-3 py-2 rounded text-white"
        />

        <Button
          className="bg-[#E82127]"
          onClick={onCreate}
          disabled={isDisabled}
        >
          Create
        </Button>
      </div>
    </div>
  );
}

export default DatasetCreation;
