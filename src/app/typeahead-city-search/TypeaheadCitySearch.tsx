"use client";
import TypeaheadSearch from "@/components/TypeaheadSearch";
import { useCitiesSearch } from "@/hooks/api";
import { AMADEUS_CITIES_KEYWORD_MIN_LENGTH } from "@/constants";

const TypeaheadCitySearch = () => {
  return (
    <TypeaheadSearch
      fetchItems={useCitiesSearch}
      label="cities"
      showEmptyState={true}
      keywordMinLength={AMADEUS_CITIES_KEYWORD_MIN_LENGTH}
    />
  );
};

export default TypeaheadCitySearch;
