export interface Response<X> {
  status: 'success' | 'error';
  message?: string;
  data?: X;
}

/* https://www.youtube.com/feedsからのレスポンス定義 */
export interface ResEntry {
  videoId: string;
  channelId: string;
  title: string;
  published: string;
  updated: string;
  content: {
    url: string;
    type: string;
    width: string;
    height: string;
  };
  thumbnail: {
    url: string;
    width: string;
    height: string;
  };
  description: string;
}

/* https://www.googleapis.com/youtube/v3/~ からのレスポンス定義 */
export interface ResYoutubeApi {
  kind: string;
  etag: string;
  items: {
    kind: string;
    etag: string;
    id: string;
    liveStreamingDetails?: {
      actualStartTime?: string;
      actualEndTime?: string;
      scheduledStartTime: string;
    };
    snippet?: {
      title: string;
      description: string;
      channelId?: string;
      publishedAt: Date;
      thumbnails: {
        default: ThumbnailsDetail;
        medium: ThumbnailsDetail;
        high: ThumbnailsDetail;
      };
      localized: {
        title: string;
        description: string;
      };
      country: string;
    };
  }[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface ThumbnailsDetail {
  url: string;
  width: number;
  height: number;
}

export interface YoutubeChannelRwsponse {
  items: {
    country: string;
    snippet: {
      title: string;
      publishedAt: string;
      thumbnails: {
        medium: {
          url: string;
        };
      };
    };
  }[];
}

export interface YoutubeVideoRwsponse {
  items: {
    snippet: {
      title: string;
      description: string;
      tags: string[];
      thumbnails: {
        standard: {
          url: string;
        };
      };
    };
    liveStreamingDetails: {
      actualStartTime?: string;
      actualEndTime?: string;
      scheduledStartTime: string;
      concurrentViewers: string;
    };
  }[];
}
