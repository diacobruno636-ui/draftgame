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
  console.error("[tRPC] Available env vars:", Object.keys(process.env).filter(k => k.includes('RORK')));
  throw new Error(
    "No base url found. Backend might not be deployed. Please check your project settings."
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (input, init) => {
        try {
          console.log("[tRPC Fetch] Requesting:", input);
          const response = await fetch(input, init);
          const contentType = response.headers.get("content-type");
          
          if (!response.ok) {
            console.error("[tRPC Fetch] HTTP Error:", response.status, response.statusText);
            console.error("[tRPC Fetch] Request URL:", input);
            
            if (response.status === 404) {
              console.error("[tRPC Fetch] 404 Error - Backend endpoint not found.");
              console.error("[tRPC Fetch] This usually means:");
              console.error("  1. Backend is not deployed");
              console.error("  2. API URL is incorrect");
              console.error("  3. Backend route is not configured");
            }
            
            if (contentType?.includes("application/json")) {
              const errorData = await response.clone().json();
              console.error("[tRPC Fetch] Error data:", errorData);
            } else {
              const errorText = await response.clone().text();
              console.error("[tRPC Fetch] Non-JSON error response:", errorText.substring(0, 500));
            }
          }
          
          if (contentType && !contentType.includes("application/json")) {
            console.error("[tRPC Fetch] Expected JSON but got:", contentType);
            const responseText = await response.clone().text();
            console.error("[tRPC Fetch] Response text:", responseText.substring(0, 500));
            throw new Error(`Server returned non-JSON response: ${contentType}. This usually means the backend is not properly configured or there's a server error.`);
          }
          
          return response;
        } catch (error) {
          console.error("[tRPC Fetch] Network error:", error);
          console.error("[tRPC Fetch] Request URL:", input);
          throw error;
        }
      },
    }),
  ],
});
