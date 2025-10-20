import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export const fetchMessages = async (
  platforms: string[],
  twitterKeyword: string = "python",
  token: string,
  limit: number = 20
) => {
  const response = await axios.get(`${API_BASE_URL}/messages`, {
    params: {
      platforms: platforms.join(","),
      twitter_keyword: twitterKeyword,
      limit,
      filter_by_preferences: true,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Return the data directly - it should have important/regular/total_count structure
  return response.data;
};

export const fetchPlatforms = async (): Promise<any> => {
  try {
    const response = await fetch("/api/platforms");

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching platforms:", error);
    throw error;
  }
};
