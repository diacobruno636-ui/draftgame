import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  if (baseUrl) {
    console.log("[tRPC] Using backend URL:", baseUrl);
    return baseUrl;
  }

  console.error("[tRPC] EXPO_PUBLIC_RORK_API_BASE_URL not found");
  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (input, init) => {
        try {
          const response = await fetch(input, init);
          const contentType = response.headers.get("content-type");
          
          if (!response.ok) {
            console.error("[tRPC Fetch] HTTP Error:", response.status, response.statusText);
            
            if (contentType?.includes("application/json")) {
              const errorData = await response.json();
              console.error("[tRPC Fetch] Error data:", errorData);
            } else {
              const errorText = await response.text();
              console.error("[tRPC Fetch] Non-JSON error response:", errorText.substring(0, 200));
            }
          }
          
          return response;
        } catch (error) {
          console.error("[tRPC Fetch] Network error:", error);
          throw error;
        }
      },
    }),
  ],
});
