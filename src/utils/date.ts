/* eslint-disable @typescript-eslint/no-unused-vars */
import { formatDistanceToNow } from "date-fns";

export const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} (${formatDistanceToNow(date, {
        addSuffix: true,
      })})`;
    } catch (e) {
      return dateString;
    }
  };