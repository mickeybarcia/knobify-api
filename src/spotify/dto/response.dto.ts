export type Artist = {
  id: string;
  name: string;
  playUri: string;
  appUrl: string;
};

export type Track = {
  artists: Artist[];
  id: string;
  name: string;
  playUri: string;
  appUrl: string;
  picUrl: string;
  isPlayable: boolean;
};

export type RecommendationsResponseDto = {
  tracks: Track[];
};

export type SearchArtistResponseDto = {
  artists: Artist[];
};

export type SearchTracksResponseDto = {
  tracks: Track[];
};
