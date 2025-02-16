"use client";
import TypeaheadSearch from "@/components/TypeaheadSearch";
import { TypeaheadItem, useGooglePlacesAutocomplete } from "@/hooks/api";
import { useState } from "react";

const TypeaheadPlacesSearch = () => {
  const [selectedItem, setSelectedItem] = useState<TypeaheadItem | null>(null);
  return (
    <div>
      <h4 className="text-md font-semibold mb-2">
        Selected item: {selectedItem?.displayText}
      </h4>
      <TypeaheadSearch
        fetchItems={useGooglePlacesAutocomplete}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
      />
    </div>
  );
};

export default TypeaheadPlacesSearch;
