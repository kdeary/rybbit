import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { APIResponse } from "../types";
import { getStartAndEndDate, authedFetch } from "../utils";
import { TimeBucket, useStore } from "../../lib/store";

type PeriodTime = "current" | "previous";

export type GetOverviewBucketedResponse = {
  time: string;
  pageviews: number;
  sessions: number;
  pages_per_session: number;
  bounce_rate: number;
  session_duration: number;
  users: number;
}[];

export function useGetOverviewBucketed({
  periodTime,
  site,
  bucket = "hour",
}: {
  periodTime?: PeriodTime;
  site?: number | string;
  bucket?: TimeBucket;
}): UseQueryResult<APIResponse<GetOverviewBucketedResponse>> {
  const { time, previousTime, filters } = useStore();

  const timeToUse = periodTime === "previous" ? previousTime : time;

  const { startDate, endDate } = getStartAndEndDate(timeToUse);

  return useQuery({
    queryKey: ["overview-bucketed", timeToUse, bucket, site, filters],
    queryFn: () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return authedFetch(`${BACKEND_URL}/overview-bucketed/${site}`, {
        startDate,
        endDate,
        timezone,
        bucket,
        filters,
      }).then((res) => res.json());
    },
    placeholderData: (_, query: any) => {
      if (!query?.queryKey) return undefined;
      const prevQueryKey = query.queryKey as [string, string, string];
      const [, , prevSite] = prevQueryKey;

      if (prevSite === site) {
        return query.state.data;
      }
      return undefined;
    },
    staleTime: Infinity,
  });
}

export function useGetOverviewBucketedPastMinutes({
  pastMinutes = 24 * 60,
  site,
  bucket = "hour",
  refetchInterval,
}: {
  pastMinutes: number;
  site?: number | string;
  bucket?: TimeBucket;
  refetchInterval?: number;
}): UseQueryResult<APIResponse<GetOverviewBucketedResponse>> {
  return useQuery({
    queryKey: ["overview-bucketed-past-minutes", pastMinutes, site, bucket],
    queryFn: () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return authedFetch(`${BACKEND_URL}/overview-bucketed/${site}`, {
        timezone,
        bucket,
        pastMinutes,
      }).then((res) => res.json());
    },
    refetchInterval,
    placeholderData: (_, query: any) => {
      if (!query?.queryKey) return undefined;
      const prevQueryKey = query.queryKey as [string, string, string];
      const [, , prevSite] = prevQueryKey;

      if (prevSite === site) {
        return query.state.data;
      }
      return undefined;
    },
    staleTime: Infinity,
  });
}
