"use client";
import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import { QueryErrorResetBoundary, UseQueryResult } from "@tanstack/react-query";
import { Suspense, use, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDebounce } from "@/hooks/util";
import { AmadeusResponse } from "@/types/amadeus";

interface TypeaheadSearchProps {
  fetchItems: (keyword: string) => UseQueryResult<AmadeusResponse, Error>;
}

/**
 * A typeahead search component that provides search functionality with API integration
 * @param {Function} fetchItems - A function that returns a query result for fetching data based on search keyword
 * @returns A search input with typeahead suggestions
 */
const TypeaheadSearch = ({ fetchItems }: TypeaheadSearchProps) => {
  const [keyword, setKeyword] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  const debouncedKeyword = useDebounce(keyword, 300);

  const items = fetchItems(debouncedKeyword);

  useEffect(() => {
    if (keyword !== selectedCity) setSelectedCity("");
  }, [keyword, selectedCity]);

  return (
    <>
      <Input keyword={keyword} setKeyword={setKeyword} />
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={({ error, resetErrorBoundary }) => (
              <ErrorMessage
                error={error}
                showStack={false}
                resetErrorBoundary={() => {
                  items.refetch();
                  resetErrorBoundary();
                }}
              />
            )}
          >
            <Suspense fallback={<Loading message="cities" />}>
              {debouncedKeyword.length < 2 && (
                <p>Start typing to search for cities</p>
              )}
              {debouncedKeyword.length > 2 && !selectedCity && (
                <Suggestions
                  fetchItems={items}
                  onItemSelect={(item) => {
                    setKeyword(item);
                    setSelectedCity(item);
                  }}
                />
              )}
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </>
  );
};

const Suggestions = ({
  fetchItems,
  onItemSelect,
  onChange,
}: {
  fetchItems: UseQueryResult<AmadeusResponse, Error>;
  onItemSelect: (item: string) => void;
  onChange?: () => void;
}) => {
  const items = use(fetchItems.promise);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    onChange?.();
    setSelectedIndex((prev) =>
      prev < items?.data?.length - 1 ? prev : items?.data?.length - 1
    );
  }, [items]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < items?.data?.length - 1 ? prev + 1 : 0
          );
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : items?.data?.length - 1
          );
          break;
        }
        case "Enter": {
          if (selectedIndex >= 0) {
            onItemSelect(items?.data?.[selectedIndex].name);
          }
          break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [items, selectedIndex, onItemSelect]);

  return (
    <div>
      <ul className="mt-2">
        {items?.data?.map((item, index) => (
          <li
            key={index}
            className={`p-2 ${
              selectedIndex === index ? "bg-gray-100 text-black" : ""
            } hover:bg-gray-100 hover:text-black`}
          >
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Input = ({
  keyword,
  setKeyword,
}: {
  keyword: string;
  setKeyword: (keyword: string) => void;
}) => {
  return (
    <input
      value={keyword}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        setKeyword(e.target.value)
      }
      placeholder="Search cities..."
      className="text-black px-4 py-2 border rounded-md"
    />
  );
};

export default TypeaheadSearch;
