"use client";
import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import { UseQueryResult } from "@tanstack/react-query";
import { Suspense, use, useEffect, useState, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDebounce } from "@/hooks/util";
import { AmadeusResponse } from "@/types/amadeus";
import { KEYWORD_MIN_LENGTH } from "@/constants";

interface TypeaheadSearchProps {
  fetchItems: (keyword: string) => UseQueryResult<AmadeusResponse, Error>;
  placeholder?: string;
}

/**
 * A typeahead search component that provides search functionality with API integration
 * @param {Function} fetchItems - A function that returns a query result for fetching data based on search keyword
 * @returns A search input with typeahead suggestions
 */
const TypeaheadSearch = ({ fetchItems, placeholder }: TypeaheadSearchProps) => {
  const [inputVal, setInputVal] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [retry, setRetry] = useState<number>(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const itemsQuery = fetchItems(debouncedSearchTerm);

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
    if (!selectedItem && inputVal.length >= KEYWORD_MIN_LENGTH)
      setSearchTerm(inputVal);

    // Clear selection if user modifies input after selecting an item
    if (selectedItem && inputVal !== selectedItem) setSelectedItem("");
  }, [inputVal, selectedItem]);

  useEffect(() => {
    setRetry((prev) => prev + 1);
  }, [debouncedSearchTerm]);

  return (
    <>
      <Input
        inputVal={inputVal}
        setInputVal={setInputVal}
        placeholder={placeholder}
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
        <Suspense fallback={<Loading message="cities" />}>
          {debouncedSearchTerm.length < KEYWORD_MIN_LENGTH && (
            <p>Start typing to search for cities</p>
          )}
          {debouncedSearchTerm.length >= KEYWORD_MIN_LENGTH &&
            debouncedSearchTerm === inputVal &&
            !selectedItem && (
              <Suggestions
                keyword={debouncedSearchTerm}
                itemsQuery={itemsQuery}
                onItemSelect={(item) => {
                  setInputVal(item);
                  setSelectedItem(item);
                }}
              />
            )}
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

const Suggestions = ({
  keyword,
  itemsQuery,
  onItemSelect,
  onChange,
}: {
  keyword: string;
  itemsQuery: UseQueryResult<AmadeusResponse, Error>;
  onItemSelect: (item: string) => void;
  onChange?: () => void;
}) => {
  const items = use(itemsQuery.promise);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // This sorting prioritizes items that start with the search keyword
  // and then alphabetically sorts the rest
  const sortedItems = useMemo(
    () =>
      [...items.data].sort((a, b) => {
        // Check if each item's name starts with the search keyword
        const aStartsWithKeyword = a.name
          .toLowerCase()
          .startsWith(keyword.toLowerCase());
        const bStartsWithKeyword = b.name
          .toLowerCase()
          .startsWith(keyword.toLowerCase());

        // If item A starts with keyword but B doesn't, A comes first (-1)
        if (aStartsWithKeyword && !bStartsWithKeyword) return -1;
        // If item B starts with keyword but A doesn't, B comes first (1)
        if (!aStartsWithKeyword && bStartsWithKeyword) return 1;
        // If both/neither start with keyword, sort alphabetically
        return a.name.localeCompare(b.name);
      }),
    [items?.data, keyword]
  );

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
          if (selectedIndex >= 0) {
            onItemSelect(sortedItems[selectedIndex].name);
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

  return (
    <>
      {!sortedItems.length && <p className="p-2">No results found</p>}
      {!!sortedItems.length && (
        <ul className="mt-2">
          {sortedItems.map((item, index) => (
            <li
              key={index}
              onClick={() => onItemSelect(item.name)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`p-2 ${
                selectedIndex === index ? "bg-gray-100 text-black" : ""
              } cursor-pointer`}
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

const Input = ({
  inputVal,
  setInputVal,
  placeholder = "Search...",
}: {
  inputVal: string;
  setInputVal: (inputVal: string) => void;
  placeholder?: string;
}) => {
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
