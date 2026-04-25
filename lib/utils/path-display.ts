// Some seed paths were stored with target-language titles (e.g. the Indonesian
// survival path is named "Belajar Bahasa Indonesia" in the DB). The app chrome
// is English, so translate those known titles for display.
const PATH_TITLE_OVERRIDES: Record<string, string> = {
  'Belajar Bahasa Indonesia': 'Survival Indonesian',
};

export function displayPathTitle(title: string): string {
  return PATH_TITLE_OVERRIDES[title] ?? title;
}
