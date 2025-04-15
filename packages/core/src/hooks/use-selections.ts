import { useMemoizedFn } from '@workspace/core/hooks/use-memoized-fn';
import { useMemo, useState } from 'react';

/**
 * This hook is used for Checkbox group, supports multiple selection, single selection, select-all, select-none and semi-selected etc.
 *
 * @example
 *
 * ```tsx
 * const list = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9], []);
 *
 * const { selected, allSelected, isSelected, toggle, toggleAll, partiallySelected } = useSelections(
 *   list,
 *   [1],
 * );
 *
 * return (
 *   <Container>
 *     <h3>Selected : {selected.join(', ')}</h3>
 *     <Checkbox checked={allSelected} onClick={toggleAll} indeterminate={partiallySelected}>
 *       {allSelected ? 'Uncheck All' : 'Check all'}
 *     </Checkbox>
 *     <Row>
 *       {list.map((val) => (
 *         <Col span={12} key={val}>
 *           <Checkbox checked={isSelected(val)} onClick={() => toggle(val)}>
 *             {val}
 *           </Checkbox>
 *         </Col>
 *       ))}
 *     </Row>
 *   </Container>
 * );
 * ```
 */
export function useSelections<T>(items: T[], defaultSelected: T[] = []) {
  // Selected Items, Set selected items
  const [selected, setSelected] = useState<T[]>(defaultSelected);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  /**
   * Check if an item is selected
   * @param item The item to check
   * @returns True if the item is selected, false otherwise
   */
  const isSelected = (item: T) => selectedSet.has(item);

  /**
   * Select an item
   * @param item The item to select
   * @returns The updated selected items
   */
  const select = (item: T) => {
    selectedSet.add(item);
    return setSelected(Array.from(selectedSet));
  };

  /**
   * UnSelect an item
   * @param item The item to unselect
   * @returns The updated selected items
   */
  const unSelect = (item: T) => {
    selectedSet.delete(item);
    return setSelected(Array.from(selectedSet));
  };

  /**
   * Toggle the select status of an item
   * @param item The item to toggle
   */
  const toggle = (item: T) => {
    if (isSelected(item)) {
      unSelect(item);
    } else {
      select(item);
    }
  };

  /**
   * Select all items in the list
   */
  const selectAll = () => {
    for (const o of items) {
      selectedSet.add(o);
    }
    setSelected(Array.from(selectedSet));
  };

  /**
   * UnSelect all items in the list
   */
  const unSelectAll = () => {
    for (const o of items) {
      selectedSet.delete(o);
    }
    setSelected(Array.from(selectedSet));
  };

  /**
   * Check if no item is selected
   */
  const noneSelected = useMemo(
    () => items.every((o) => !selectedSet.has(o)),
    [items, selectedSet]
  );

  /**
   * Check if all items are selected
   */
  const allSelected = useMemo(
    () => items.every((o) => selectedSet.has(o)) && !noneSelected,
    [items, selectedSet, noneSelected]
  );

  /**
   * Check if partially items are selected
   */
  const partiallySelected = useMemo(
    () => !noneSelected && !allSelected,
    [noneSelected, allSelected]
  );

  /**
   * Toggle select all items
   */
  const toggleAll = () => (allSelected ? unSelectAll() : selectAll());

  return {
    selected,
    noneSelected,
    allSelected,
    partiallySelected,
    setSelected,
    isSelected,
    select: useMemoizedFn(select),
    unSelect: useMemoizedFn(unSelect),
    toggle: useMemoizedFn(toggle),
    selectAll: useMemoizedFn(selectAll),
    unSelectAll: useMemoizedFn(unSelectAll),
    toggleAll: useMemoizedFn(toggleAll),
  } as const;
}
