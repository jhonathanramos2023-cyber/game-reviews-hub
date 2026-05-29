import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, usuariosTable } from "@workspace/db";
import {
  facebookOAuthConfigured,
  getFrontendOrigin,
  getOAuthPublicBase,
  googleOAuthConfigured,
  oauthStateToken,
  type OAuthProfile,
} from "../lib/oauth";
import { setAuthCookie, signToken } from "../lib/auth";

const router: IRouter = Router();
const BCRYPT_ROUNDS = 12;
const AVATAR_COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

const oauthStates = new Map<string, { provider: "google" | "facebook"; created: number }>();

function pruneStates() {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [key, val] of oauthStates) {
    if (val.created < cutoff) oauthStates.delete(key);
  }
}

function redirectWithError(res: Response, code: string) {
  const url = `${getFrontendOrigin()}/login?oauth_error=${encodeURIComponent(code)}`;
  res.redirect(url);
}

async function upsertOAuthUser(profile: OAuthProfile, rememberMe: boolean, res: Response) {
  const email = profile.email.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(usuariosTable)
    .where(eq(usuariosTable.email, email))
    .limit(1);

  let user = existing;

  if (!user) {
    const id = randomBytes(12).toString("hex");
    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), BCRYPT_ROUNDS);
    const avatarUrl =
      profile.avatarUrl ??
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] ??
      AVATAR_COLORS[0];

    const [created] = await db
      .insert(usuariosTable)
      .values({
        id,
        nombre: profile.nombre.slice(0, 80),
        email,
        passwordHash,
        avatarUrl,
        rol: "user",
      })
      .returning();
    user = created;
  }

  const token = signToken(
    { sub: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    rememberMe,
  );
  setAuthCookie(res, token, rememberMe);
  res.redirect(`${getFrontendOrigin()}/`);
}

router.get("/auth/google", (req, res) => {
  if (!googleOAuthConfigured()) {
    res.status(503).json({ error: "Google OAuth no configurado" });
    return;
  }
  pruneStates();
  const state = oauthStateToken();
  oauthStates.set(state, { provider: "google", created: Date.now() });

  const redirectUri = `${getOAuthPublicBase(req)}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/auth/google/callback", async (req, res) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    if (!code || !state || !oauthStates.has(state)) {
      redirectWithError(res, "invalid_state");
      return;
    }
    oauthStates.delete(state);

    const redirectUri = `${getOAuthPublicBase(req)}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      redirectWithError(res, "token_failed");
      return;
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      redirectWithError(res, "token_failed");
      return;
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileRes.ok) {
      redirectWithError(res, "profile_failed");
      return;
    }

    const profile = (await profileRes.json()) as {
      id?: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!profile.id || !profile.email) {
      redirectWithError(res, "email_required");
      return;
    }

    await upsertOAuthUser(
      {
        provider: "google",
        providerId: profile.id,
        email: profile.email,
        nombre: profile.name ?? profile.email.split("@")[0] ?? "Gamer",
        avatarUrl: profile.picture ?? null,
      },
      true,
      res,
    );
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback error");
    redirectWithError(res, "server_error");
  }
});

router.get("/auth/facebook", (req, res) => {
  if (!facebookOAuthConfigured()) {
    res.status(503).json({ error: "Facebook OAuth no configurado" });
    return;
  }
  pruneStates();
  const state = oauthStateToken();
  oauthStates.set(state, { provider: "facebook", created: Date.now() });

  const redirectUri = `${getOAuthPublicBase(req)}/api/auth/facebook/callback`;
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: redirectUri,
    state,
    scope: "email,public_profile",
    response_type: "code",
  });
  res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`);
});

router.get("/auth/facebook/callback", async (req, res) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    if (!code || !state || !oauthStates.has(state)) {
      redirectWithError(res, "invalid_state");
      return;
    }
    oauthStates.delete(state);

    const redirectUri = `${getOAuthPublicBase(req)}/api/auth/facebook/callback`;
    const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", process.env.FACEBOOK_APP_ID!);
    tokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET!);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl);
    if (!tokenRes.ok) {
      redirectWithError(res, "token_failed");
      return;
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      redirectWithError(res, "token_failed");
      return;
    }

    const profileUrl = new URL("https://graph.facebook.com/me");
    profileUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
    profileUrl.searchParams.set("access_token", tokenData.access_token);

    const profileRes = await fetch(profileUrl);
    if (!profileRes.ok) {
      redirectWithError(res, "profile_failed");
      return;
    }

    const profile = (await profileRes.json()) as {
      id?: string;
      email?: string;
      name?: string;
      picture?: { data?: { url?: string } };
    };

    if (!profile.id) {
      redirectWithError(res, "profile_failed");
      return;
    }

    const email = profile.email ?? `${profile.id}@facebook.oauth.local`;

    await upsertOAuthUser(
      {
        provider: "facebook",
        providerId: profile.id,
        email,
        nombre: profile.name ?? "Gamer",
        avatarUrl: profile.picture?.data?.url ?? null,
      },
      true,
      res,
    );
  } catch (err) {
    req.log.error({ err }, "Facebook OAuth callback error");
    redirectWithError(res, "server_error");
  }
});

export default router;
