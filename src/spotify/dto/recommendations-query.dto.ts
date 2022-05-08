export type RecommendationsQueryDto = {
  limit?: number; // 1-100

  seed_artists?: string[];
  seed_tracks?: string[];

  // -- 0-1 -- //
  min_energy?: number;
  max_energy?: number;
  // target_energy?: number;

  max_acousticness?: number;
  min_acousticness?: number;

  max_danceability?: number;
  min_danceability?: number;

  max_instrumentalness?: number;
  min_instrumentalness?: number;

  max_loudness?: number;
  min_loudness?: number;

  max_valence?: number;
  min_valence?: number;

  // -- 0-100 --//
  max_popularity?: number;
  min_popularity?: number;

  // added fields
  excludeRecent?: boolean;
  excludeLiked?: boolean;
};
