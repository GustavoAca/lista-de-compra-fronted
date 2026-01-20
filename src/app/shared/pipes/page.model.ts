export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
}

export function emptyPage<T>(): Page<T> {
  return {
    content: [],
    number: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    empty: true,
    numberOfElements: 0,
    sort: {
      sorted: false,
      unsorted: true,
      empty: true,
    },
  };
}

