import { queryOptions } from "@tanstack/react-query";
import { getVideos } from "@/lib/videos.functions";

export const videosQueryOptions = () =>
  queryOptions({
    queryKey: ["videos"],
    queryFn: () => getVideos(),
  });
