"use client";
import TypeaheadSearch from "@/components/TypeaheadSearch";
import { TypeaheadItem, useAmadeusCitiesSearch } from "@/hooks/api";
import { AMADEUS_CITIES_KEYWORD_MIN_LENGTH } from "@/constants";
import { useState } from "react";

const TypeaheadCitySearch = () => {
  const [selectedItem, setSelectedItem] = useState<TypeaheadItem | null>(null);
  return (
    <div>
      <h4 className="text-md font-semibold mb-2">
        Selected item: {selectedItem?.displayText}
      </h4>
      <TypeaheadSearch
        fetchItems={useAmadeusCitiesSearch}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        label="cities"
        showEmptyState={true}
        keywordMinLength={AMADEUS_CITIES_KEYWORD_MIN_LENGTH}
      />
    </div>
  );
};

export default TypeaheadCitySearch;
