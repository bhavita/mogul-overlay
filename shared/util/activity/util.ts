import { ActivityAlert, Poll, RaidAlert } from "../../../types/mod.ts";
import { getPollInfo, secondsSince } from "../mod.ts";

export const ACTIVITY_TIMEOUT_SECONDS = 100;

/**
 * Returns whether the passed in activity alert is expired. e.g for a poll/prediction we don't want to end
 * the activity until the poll/prediction has ended. For other types of activities that don't have a custom duration
 * set, we want to end the activity after a default amount of time.
 */
export function isActiveActivity<ActivityType, SourceType extends string>(
  activityAlert: ActivityAlert<ActivityType, SourceType>,
) {
  if (!activityAlert?.activity) return false;

  if (activityAlert.status === "shown") return false;

  // if it's a poll, check if the poll has ended and if so whether the poll has been closed longer than the default timeout
  if (isPollActivity(activityAlert)) {
    return isPollActivityActive(activityAlert.activity);
    // default all other activities to a default timeout
  } else if (isAlertActivity(activityAlert) && isRaid(activityAlert.activity)) {
    return activityAlert.activity.status === "ready";
  } else {
    const activityStartTime = new Date(activityAlert?.time);
    return secondsSince(activityStartTime) < ACTIVITY_TIMEOUT_SECONDS;
  }
}

export function isPollActivityActive(poll: Poll) {
  const { hasPollEnded, hasWinningOption, isRefund, pollEndTime } = getPollInfo(poll);

  return hasPollEnded && (hasWinningOption || isRefund)
    ? secondsSince(new Date(pollEndTime)) < ACTIVITY_TIMEOUT_SECONDS
    : true;
}

export function isPollActivity(
  activityAlert?: ActivityAlert<unknown, string>,
): activityAlert is ActivityAlert<Poll, "poll"> {
  return activityAlert?.sourceType === "poll";
}

export function isAlertActivity(
  activityAlert?: ActivityAlert<unknown, string>,
): activityAlert is ActivityAlert<RaidAlert, "alert"> {
  return activityAlert?.sourceType === "alert";
}

export function isRaid(
  alert: unknown & { data?: { url?: string } },
): alert is RaidAlert {
  return Boolean(alert?.data?.url);
}
