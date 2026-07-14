// Bridge for navigation requests coming from screens that render outside
// AppContent's tree (e.g. the player modal). AppContent registers handlers on
// mount; callers fire them without needing access to its state.
export type OpenFavoritesOptions = {
  /** «Назад» из Избранного вернёт плеер (только для тоста в плеере). */
  fromPlayer?: boolean;
};

type Handler = (opts: OpenFavoritesOptions) => void;

let openFavoritesHandler: Handler | null = null;

export function registerOpenFavoritesHandler(fn: Handler | null) {
  openFavoritesHandler = fn;
}

export function requestOpenFavorites(opts: OpenFavoritesOptions = {}) {
  openFavoritesHandler?.(opts);
}
