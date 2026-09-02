import { queryOptions } from "@tanstack/react-query";
import { getComments, getVideos } from "@/lib/videos.functions";

export const videosQueryOptions = () =>
  queryOptions({
    queryKey: ["videos"],
    queryFn: () => getVideos(),
  });

export const commentsQueryOptions = (videoId: string) =>
  queryOptions({
    queryKey: ["comments", videoId],
    queryFn: () => getComments({ data: { videoId } }),
  });
