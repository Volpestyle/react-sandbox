"use client";
import TypeaheadSearch from "@/components/TypeaheadSearch";
import { useCitiesSearch } from "@/hooks/api";

const TypeaheadCitySearch = () => {
  return (
    <TypeaheadSearch
      fetchItems={useCitiesSearch}
      placeholder="Search cities..."
    />
  );
};

export default TypeaheadCitySearch;
