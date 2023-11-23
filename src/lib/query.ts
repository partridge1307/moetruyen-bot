import { generateSearchPhrase } from './utils';
import { db } from './db';

export type SearchUserAutoCompleteResult = {
  id: string;
  name: string;
};
export const SearchUserAutoComplete = ({
  searchPhrase,
}: {
  searchPhrase: string;
}): Promise<SearchUserAutoCompleteResult[]> => {
  const query = generateSearchPhrase(searchPhrase);

  return db.$queryRaw`SELECT "id", "name" FROM "User" WHERE to_tsvector('english', "name") @@ to_tsquery(${query}) LIMIT 10`;
};

export type SearchMangaAutoCompleteResult = {
  slug: string;
  name: string;
};
export const SearchMangaAutoComplete = ({
  searchPhrase,
}: {
  searchPhrase: string;
}): Promise<SearchMangaAutoCompleteResult[]> => {
  const query = generateSearchPhrase(searchPhrase);

  return db.$queryRaw`SELECT "slug", "name" FROM "Manga" WHERE to_tsvector('english', "name") @@ to_tsquery(${query}) LIMIT 10`;
};
