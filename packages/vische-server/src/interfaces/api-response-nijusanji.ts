export interface ApiResponseNijusanji {
  status: string | 'ok';
  data: DataNijusanji;
}

export interface DataNijusanji {
  events: EventNijusanji[];
}

export interface EventNijusanji {
  id: number;
  name: string;
  description: string;
  public: number;
  url: string;
  thumbnail: string;
  start_date: Date;
  end_date: Date;
  recommend: boolean;
  genre: Genre | null;
  livers: Liver[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface Liver {
  id: number;
  name: string;
  avatar: string;
  color: string;
}
