import { useEffect, useMemo, useRef, useState } from "react";
import { Folder, ChevronDown, Check } from "lucide-react";
import "./FolderFilter.css";

const FolderFilter = ({ folders = [], value = "all", onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const options = useMemo(
    () => [
      { value: "all", label: "All Movies" },
      { value: "unassigned", label: "Unassigned" },
      ...folders.map((folder) => ({
        value: folder.id,
        label: folder.name,
        isDefault: folder.isDefault,
      })),
    ],
    [folders],
  );

  const selectedOption =
    options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div className="folder-filter" ref={containerRef}>
      <button
        type="button"
        className="folder-filter-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="folder-filter-icon">
          <Folder size={18} strokeWidth={2.4} />
        </span>
        <span className="folder-filter-label">{selectedOption?.label || "All"}</span>
        <ChevronDown size={18} strokeWidth={2.4} className="folder-filter-caret" />
      </button>

      {isOpen && (
        <div className="folder-filter-menu" role="listbox">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={String(option.value)}
                type="button"
                className={`folder-filter-option ${isSelected ? "active" : ""}`}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={isSelected}
              >
                <span className="folder-filter-option-label">
                  {option.label}
                  {option.isDefault ? <span className="folder-filter-default">Default</span> : null}
                </span>
                {isSelected ? <Check size={16} strokeWidth={3} /> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FolderFilter;