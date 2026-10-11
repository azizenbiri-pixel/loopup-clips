import { queryOptions } from "@tanstack/react-query";
import { getComments, getCreator, getCreators, getVideos } from "@/lib/videos.functions";

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

export const creatorQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ["creator", username],
    queryFn: () => getCreator({ data: { username } }),
  });

export const creatorsQueryOptions = () =>
  queryOptions({
    queryKey: ["creators"],
    queryFn: () => getCreators(),
  });
