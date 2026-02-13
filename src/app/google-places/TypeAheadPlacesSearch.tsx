"use client";

import TypeaheadSearch from "@/components/TypeaheadSearch";
import { TypeaheadItem } from "@/hooks/api";
import { useGooglePlacesAutocompleteNew } from "@/hooks/google-places";
import { useState } from "react";

export default function TypeAheadPlacesSearch() {
  const [selectedItem, setSelectedItem] = useState<TypeaheadItem | null>(null);

  return (
    <TypeaheadSearch
      fetchItems={useGooglePlacesAutocompleteNew}
      selectedItem={selectedItem}
      setSelectedItem={setSelectedItem}
    />
  );
}
