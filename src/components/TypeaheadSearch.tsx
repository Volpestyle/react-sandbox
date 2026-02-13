"use client";
import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import { UseQueryResult } from "@tanstack/react-query";
import { Suspense, use, useEffect, useState, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDebounce } from "@/hooks/util";
import { TypeaheadItem } from "@/hooks/api";

interface TypeaheadSearchProps {
  fetchItems: (keyword: string) => UseQueryResult<TypeaheadItem[], Error>;

  selectedItem: TypeaheadItem | null;
  setSelectedItem: (item: TypeaheadItem | null) => void;

  label?: string;
  keywordMinLength?: number;
  debounceTime?: number;
  showEmptyState?: boolean;
  sort?: boolean;
}

/**
 * A typeahead search component that provides search functionality with API integration
 * @param {Function} fetchItems - A function that returns a query result for fetching data based on search keyword
 * @returns A search input with typeahead suggestions
 */
const TypeaheadSearch = ({
  fetchItems,
  selectedItem,
  setSelectedItem,
  label = "suggestions",
  keywordMinLength = 1,
  debounceTime = 300,
  showEmptyState = true,
  sort = false,
}: TypeaheadSearchProps) => {
  const [inputVal, setInputVal] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [retry, setRetry] = useState<number>(0);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceTime);
  const debouncedSelectedItem = useDebounce(selectedItem, debounceTime);
  const itemsQuery = fetchItems(debouncedSearchTerm);

  const handleItemSelect = (item: TypeaheadItem) => {
    setInputVal(item.displayText);
    setSelectedItem(item);
  };

  /**
   * Manages the synchronization between input value and search/selection states
   *
   * Two main responsibilities:
   * 1. Updates search term when user is typing (no selection active)
   * 2. Clears selection when user modifies the input after selecting an item
   *
   * @dependency inputVal - Current value in the input field
   * @dependency selectedItem - Currently selected suggestion item
   */
  useEffect(() => {
    // When no item is selected, input changes should update search term
    if (!selectedItem) setSearchTerm(inputVal);

    // Clear selection if user modifies input after selecting an item
    if (selectedItem && inputVal !== selectedItem.displayText)
      setSelectedItem(null);
  }, [inputVal, selectedItem, setSelectedItem]);

  useEffect(() => {
    setRetry((prev) => prev + 1);
  }, [debouncedSearchTerm]);

  return (
    <div className="space-y-4">
      <Input
        inputVal={inputVal}
        setInputVal={setInputVal}
        placeholder={`Search for ${label}...`}
      />
      <ErrorBoundary
        key={retry}
        fallbackRender={({ error, resetErrorBoundary }) => (
          <ErrorMessage
            error={error}
            showStack={false}
            resetErrorBoundary={resetErrorBoundary}
          />
        )}
        onReset={() => {
          setRetry((prev) => prev + 1);
          itemsQuery.refetch();
        }}
      >
        <Suspense fallback={<Loading message={label} />}>
          <Suggestions
            keyword={debouncedSearchTerm}
            itemsQuery={itemsQuery}
            label={label}
            keywordMinLength={keywordMinLength}
            showEmptyState={showEmptyState}
            sort={sort}
            onItemSelect={handleItemSelect}
            itemIsSelected={!!debouncedSelectedItem}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

interface SuggestionsProps {
  keyword: string;
  itemsQuery: UseQueryResult<TypeaheadItem[], Error>;
  label: string;
  keywordMinLength: number;
  showEmptyState: boolean;
  sort: boolean;
  onItemSelect: (item: TypeaheadItem) => void;
  onChange?: () => void;
  itemIsSelected: boolean;
}

const Suggestions = ({
  keyword,
  itemsQuery,
  label,
  keywordMinLength,
  showEmptyState,
  sort,
  onItemSelect,
  onChange,
  itemIsSelected,
}: SuggestionsProps) => {
  const items = use(itemsQuery.promise);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Enhanced sorting with progressive matching priority
  const sortedItems = useMemo(() => {
    if (!items) return [];
    if (!sort) return items;
    const searchTerm = keyword.toLowerCase();

    // Generate array of progressive search terms
    // e.g., for "chic": ["chic", "chi", "ch", "c"]
    const searchTerms = Array.from({ length: searchTerm.length }, (_, i) =>
      searchTerm.slice(0, searchTerm.length - i)
    );

    return [...items].sort((a, b) => {
      const aName = a.sortBy.toLowerCase();
      const bName = b.sortBy.toLowerCase();

      // Find the longest matching prefix for each item
      const aMatchLength =
        searchTerms.find((term) => aName.startsWith(term))?.length || 0;
      const bMatchLength =
        searchTerms.find((term) => bName.startsWith(term))?.length || 0;

      if (aMatchLength !== bMatchLength) {
        // Sort by match length
        return bMatchLength - aMatchLength;
      } else if (aMatchLength === 0 && bMatchLength === 0) {
        // If no match, sort alphabetically
        return aName.localeCompare(bName);
      } else {
        // If match lengths are equal, put shorter names first
        return aName.length - bName.length;
      }
    });
  }, [items, keyword, sort]);

  useEffect(() => {
    onChange?.();
    setSelectedIndex((prev) =>
      prev < sortedItems.length - 1 ? prev : sortedItems.length - 1
    );
  }, [sortedItems, onChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < sortedItems.length - 1 ? prev + 1 : 0
          );
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : sortedItems.length - 1
          );
          break;
        }
        case "Enter": {
          if (selectedIndex >= 0 && sortedItems[selectedIndex]) {
            onItemSelect(sortedItems[selectedIndex]);
          }
          break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sortedItems, selectedIndex, onItemSelect]);

  if (itemIsSelected) return null;
  if (showEmptyState && keyword.length < keywordMinLength) {
    return <p>Start typing to search for {label}</p>;
  }
  if (!sortedItems.length) {
    return <p>No results found</p>;
  }
  return (
    <>
      <ul className="mt-2">
        {sortedItems.map((item, index) => (
          <li
            key={index}
            onClick={() => onItemSelect(item)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`p-2 ${
              selectedIndex === index ? "bg-gray-100 text-black" : ""
            } cursor-pointer`}
          >
            {item.displayText}
          </li>
        ))}
      </ul>
    </>
  );
};

interface InputProps {
  inputVal: string;
  setInputVal: (inputVal: string) => void;
  placeholder?: string;
}

const Input = ({
  inputVal,
  setInputVal,
  placeholder = "Search...",
}: InputProps) => {
  return (
    <input
      value={inputVal}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        setInputVal(e.target.value)
      }
      placeholder={placeholder}
      className="text-black px-4 py-2 border rounded-md"
    />
  );
};

export default TypeaheadSearch;
