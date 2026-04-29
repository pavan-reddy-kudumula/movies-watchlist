import { useEffect, useMemo, useState } from "react";

const useMovieSelection = (allMovies = []) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const movieKeySignature = useMemo(
    () =>
      allMovies
        .map((movie) => movie._id || movie.localId)
        .filter(Boolean)
        .join("|"),
    [allMovies],
  );

  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  }, [movieKeySignature]);

  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    setSelectedIds([]); // Reset selection when toggling mode
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === allMovies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allMovies.map((movie) => movie._id || movie.localId));
    }
  };

  const isSelected = (id) => selectedIds.includes(id);

  return {
    isSelectionMode,
    selectedIds,
    toggleSelectionMode,
    toggleSelect,
    handleSelectAll,
    isSelected,
  };
};

export default useMovieSelection;