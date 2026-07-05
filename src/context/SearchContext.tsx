import {createContext, useContext} from 'react';

// Global search overlay (design 448:11117). Screens with a search button call
// useSearch().openSearch(); the provider lives in App.
export const SearchContext = createContext<{openSearch: () => void}>({
  openSearch: () => {},
});

export const useSearch = () => useContext(SearchContext);
