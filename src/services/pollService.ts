/**
 * Poll Service - Handles poll-related operations for group meetup planning
 */

import { getSupabaseClient } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface PollOption {
  text: string;
  emoji?: string;
}

export interface Poll {
  id: string;
  conversation_id: string;
  creator_id: string;
  poll_type: 'day' | 'time' | 'activity' | 'place' | 'Poll' | 'custom';
  question: string;
  options: PollOption[];
  is_multiple_choice: boolean;
  is_closed: boolean;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_index: number;
  created_at: string;
}

export interface PollWithVotes extends Poll {
  votes: PollVote[];
  vote_counts: number[];
  user_votes: number[];
  total_votes: number;
}

export interface CreatePollInput {
  conversation_id: string;
  creator_id: string;
  poll_type: 'day' | 'time' | 'activity' | 'place' | 'Poll' | 'custom';
  question: string;
  options: PollOption[];
  is_multiple_choice?: boolean;
  closes_at?: string;
}

/**
 * Creates a new poll
 */
export const createPoll = async (input: CreatePollInput): Promise<Poll | null> => {
  try {
    if (!input.conversation_id?.trim() || !input.creator_id?.trim()) {
      console.error("Invalid input for createPoll:", input);
      return null;
    }

    if (!input.question?.trim()) {
      console.error("Poll must have a question");
      return null;
    }

    if (!input.options || input.options.length < 2) {
      console.error("Poll must have at least 2 options");
      return null;
    }

    const { data, error } = await getSupabaseClient()
      .from("polls")
      .insert({
        conversation_id: input.conversation_id,
        creator_id: input.creator_id,
        poll_type: input.poll_type,
        question: input.question,
        options: input.options as unknown as Json,
        is_multiple_choice: input.is_multiple_choice ?? false,
        closes_at: input.closes_at ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating poll:", error);
      return null;
    }

    return data as unknown as Poll;
  } catch (error) {
    console.error("Error creating poll:", error);
    return null;
  }
};

/**
 * Gets polls for a conversation with vote counts
 */
export const getPolls = async (
  conversationId: string,
  userId: string
): Promise<PollWithVotes[]> => {
  try {
    if (!conversationId?.trim()) {
      console.error("Invalid conversationId for getPolls:", conversationId);
      return [];
    }

    // Get polls
    const { data: polls, error: pollsError } = await getSupabaseClient()
      .from("polls")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false });

    if (pollsError) {
      console.error("Error fetching polls:", pollsError);
      return [];
    }

    if (!polls || polls.length === 0) {
      return [];
    }

    // Get all votes for these polls
    const pollIds = polls.map((p) => p.id);
    const { data: votes, error: votesError } = await getSupabaseClient()
      .from("poll_votes")
      .select("*")
      .in("poll_id", pollIds);

    if (votesError) {
      console.error("Error fetching poll votes:", votesError);
    }

    const votesData = votes || [];

    // Combine polls with vote data
    return polls.map((poll) => {
      const pollVotes = votesData.filter((v) => v.poll_id === poll.id);
      const options = (poll.options as unknown as PollOption[]) || [];
      const voteCounts = options.map(
        (_, idx) => pollVotes.filter((v) => v.option_index === idx).length
      );
      const userVotes = pollVotes
        .filter((v) => v.user_id === userId)
        .map((v) => v.option_index);

      return {
        ...poll,
        options,
        votes: pollVotes as PollVote[],
        vote_counts: voteCounts,
        user_votes: userVotes,
        total_votes: new Set(pollVotes.map((v) => v.user_id)).size,
      } as PollWithVotes;
    });
  } catch (error) {
    console.error("Error fetching polls:", error);
    return [];
  }
};

/**
 * Gets a single poll with vote counts
 */
export const getPoll = async (
  pollId: string,
  userId: string
): Promise<PollWithVotes | null> => {
  try {
    if (!pollId?.trim()) {
      console.error("Invalid pollId for getPoll:", pollId);
      return null;
    }

    const { data: poll, error: pollError } = await getSupabaseClient()
      .from("polls")
      .select("*")
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      console.error("Error fetching poll:", pollError);
      return null;
    }

    const { data: votes, error: votesError } = await getSupabaseClient()
      .from("poll_votes")
      .select("*")
      .eq("poll_id", pollId);

    if (votesError) {
      console.error("Error fetching poll votes:", votesError);
    }

    const pollVotes = votes || [];
    const options = (poll.options as unknown as PollOption[]) || [];
    const voteCounts = options.map(
      (_, idx) => pollVotes.filter((v) => v.option_index === idx).length
    );
    const userVotes = pollVotes
      .filter((v) => v.user_id === userId)
      .map((v) => v.option_index);

    return {
      ...poll,
      options,
      votes: pollVotes as PollVote[],
      vote_counts: voteCounts,
      user_votes: userVotes,
      total_votes: new Set(pollVotes.map((v) => v.user_id)).size,
    } as PollWithVotes;
  } catch (error) {
    console.error("Error fetching poll:", error);
    return null;
  }
};

/**
 * Votes on a poll option
 */
export const votePoll = async (
  pollId: string,
  userId: string,
  optionIndex: number
): Promise<boolean> => {
  try {
    if (!pollId?.trim() || !userId?.trim()) {
      console.error("Invalid input for votePoll");
      return false;
    }

    if (optionIndex < 0) {
      console.error("Invalid optionIndex for votePoll:", optionIndex);
      return false;
    }

    const { error } = await getSupabaseClient()
      .from("poll_votes")
      .insert({
        poll_id: pollId,
        user_id: userId,
        option_index: optionIndex,
      });

    if (error) {
      // If it's a unique constraint violation, user already voted - that's okay
      if (error.code === "23505") {
        console.log("User already voted for this option");
        return true;
      }
      console.error("Error voting on poll:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error voting on poll:", error);
    return false;
  }
};

/**
 * Removes a vote from a poll option
 */
export const unvotePoll = async (
  pollId: string,
  userId: string,
  optionIndex: number
): Promise<boolean> => {
  try {
    if (!pollId?.trim() || !userId?.trim()) {
      console.error("Invalid input for unvotePoll");
      return false;
    }

    const { error } = await getSupabaseClient()
      .from("poll_votes")
      .delete()
      .eq("poll_id", pollId)
      .eq("user_id", userId)
      .eq("option_index", optionIndex);

    if (error) {
      console.error("Error removing vote:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error removing vote:", error);
    return false;
  }
};

/**
 * Closes a poll (only creator can do this)
 */
export const closePoll = async (
  pollId: string,
  userId: string
): Promise<boolean> => {
  try {
    if (!pollId?.trim() || !userId?.trim()) {
      console.error("Invalid input for closePoll");
      return false;
    }

    const { error } = await getSupabaseClient()
      .from("polls")
      .update({ is_closed: true })
      .eq("id", pollId)
      .eq("creator_id", userId);

    if (error) {
      console.error("Error closing poll:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error closing poll:", error);
    return false;
  }
};

/**
 * Deletes a poll (only creator can do this)
 */
export const deletePoll = async (
  pollId: string,
  userId: string
): Promise<boolean> => {
  try {
    if (!pollId?.trim() || !userId?.trim()) {
      console.error("Invalid input for deletePoll");
      return false;
    }

    const { error } = await getSupabaseClient()
      .from("polls")
      .delete()
      .eq("id", pollId)
      .eq("creator_id", userId);

    if (error) {
      console.error("Error deleting poll:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting poll:", error);
    return false;
  }
};

/**
 * Get predefined poll templates
 */
export const getPollTemplates = (t: (key: string, fallback?: string) => string) => ({
  day: {
    question: t("chat.pollDay", "Let's pick a day! Vote below:"),
    options: [
      { text: t("chat.saturday", "Saturday"), emoji: "📅" },
      { text: t("chat.sunday", "Sunday"), emoji: "📅" },
      { text: t("chat.pollOther", "Other (comment below)"), emoji: "💬" },
    ],
  },
  time: {
    question: t("chat.pollTime", "What time works best?"),
    options: [
      { text: `${t("chat.morning", "Morning")} (10-12)`, emoji: "🌅" },
      { text: `${t("chat.afternoon", "Afternoon")} (14-16)`, emoji: "☀️" },
      { text: `${t("chat.evening", "Evening")} (18-20)`, emoji: "🌆" },
    ],
  },
  activity: {
    question: t("chat.pollActivity", "What should we do?"),
    options: [
      { text: t("chat.coffee", "Coffee"), emoji: "☕" },
      { text: t("chat.brunch", "Brunch"), emoji: "🥐" },
      { text: t("chat.walk", "Walk"), emoji: "🚶" },
      { text: t("chat.dinner", "Dinner"), emoji: "🍽️" },
    ],
  },
});
