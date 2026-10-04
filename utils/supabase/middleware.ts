import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zjadkrmaksbbjcxvikqk.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_4MPA3lZQJt_Umh5LfIlrdw_9flfROw6";

export const updateSession = async (request: NextRequest) => {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.next({
        request: {
          headers: request.headers,
        },
      });
    }

    let supabaseResponse = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    await supabase.auth.getUser();

    return supabaseResponse;
  } catch (err) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
