• Here’s a more specific, copy‑pasteable diff note for Figma with file path + function names + where to insert:

  ———

  File: Uikelsey/src/app/components/ExhibitReview.tsx

  ### 1) Add helpers near other local helpers (just above drag/drop handlers)

  const indexToSuffix = (index: number) => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let n = index;
    let suffix = '';
    do {
      suffix = letters[n % 26] + suffix;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return suffix;
  };

  const renumberItems = (items: ExhibitItem[]) =>
    items.map((item, idx) => ({ ...item, item_suffix: indexToSuffix(idx) }));

  ———

  ### 2) Update delete item logic

  Replace existing handleRemoveItem with:

  const handleRemoveItem = (exhibitId: string, itemIndex: number) => {
    setExhibits(prev =>
      prev.map(ex => {
        if (ex.id !== exhibitId) return ex;
        const nextItems = ex.items.filter((_, idx) => idx !== itemIndex);
        return { ...ex, items: renumberItems(nextItems) };
      })
    );
  };

  ———

  ### 3) Update drop handling (core duplication fix)

  In handleItemDrop, replace the cross‑exhibit branch with:

  // Moving between different exhibits
  const newSourceItems = sourceExhibit.items.filter((_, idx) => idx !== sourceItemIndex);

  const newTargetItems = [...targetExhibit.items];
  const insertIndex = Math.min(Math.max(targetItemIndex, 0), newTargetItems.length);
  newTargetItems.splice(insertIndex, 0, draggedItemData);

  return newExhibits.map(ex => {
    if (ex.id === sourceExhibitId) return { ...ex, items: renumberItems(newSourceItems) };
    if (ex.id === targetExhibitId) return { ...ex, items: renumberItems(newTargetItems) };
    return ex;
  });

  Also update same‑exhibit reorder branch to re‑number:

  const newItems = [...sourceExhibit.items];
  newItems.splice(sourceItemIndex, 1);
  const insertIndex = sourceItemIndex < targetItemIndex ? targetItemIndex - 1 : targetItemIndex;
  newItems.splice(insertIndex, 0, draggedItemData);

  return newExhibits.map(ex =>
    ex.id === sourceExhibitId ? { ...ex, items: renumberItems(newItems) } : ex
  );

  ———

  ### 4) Drop on empty exhibit

  Replace handleDropOnEmpty body with:

  const draggedItemData = sourceExhibit.items[sourceItemIndex];
  const newSourceItems = sourceExhibit.items.filter((_, idx) => idx !== sourceItemIndex);
  const newTargetItems = [...targetExhibit.items, draggedItemData];

  return newExhibits.map(ex => {
    if (ex.id === sourceExhibitId) return { ...ex, items: renumberItems(newSourceItems) };
    if (ex.id === targetExhibitId) return { ...ex, items: renumberItems(newTargetItems) };
    return ex;
  });

  ———

  ### 5) Drag end cleanup (no highlight ghosting)

  Ensure handleItemDragEnd exists:

  const handleItemDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  ———

  If you want me to include the exact line anchors or paste the full corrected functions in context, tell me and I’ll
  provide a full snippet.