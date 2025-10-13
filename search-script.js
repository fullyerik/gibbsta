"use strict";

/**
 * Vollständige, robuste Suche für Gibbsta.
 * - Tabs: Accounts / Beiträge
 * - Accounts: username/display_name + Avatar-Fallback
 * - Beiträge: caption + image_name (OR), Join auf profiles für @username, Klick → post.html?id=...
 * - Gute Logs & Fehlermeldungen im UI
 */

let activeSearchTab = "accounts"; // default

function goBack() {
  history.back();
}

/** Markiert Tabs korrekt und triggert die Suche erneut. */
function switchSearchTab(tab) {
  activeSearchTab = tab;
  document.querySelectorAll(".search-tab").forEach((t) => {
    const isActive = t.textContent.trim().toLowerCase() === tab;
    t.classList.toggle("active", isActive);
    t.setAttribute("aria-selected", String(isActive));
  });
  handleSearch(); // neue Suche für den aktiven Tab
}

/** Hilfsfunktion: Avatar-Quelle bestimmen (URL in DB oder Storage-Pfad) */
function avatarFromProfile(u) {
  if (u?.avatar_url) return u.avatar_url;
  if (u?.avatar_path) return publicUrl(u.avatar_path);
  return "assets/img/default-avatar.png";
}

/** Hilfsfunktion: Einfache HTML-Escape für Inhalte (Caption etc.) */
function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Haupt-Suchfunktion – wird beim Tippen & Tab-Wechsel aufgerufen */
async function handleSearch() {
  const inputEl = document.getElementById("searchInput");
  const termRaw = inputEl?.value ?? "";
  const term = termRaw.toLowerCase().trim();
  const results = document.getElementById("searchResults");

  if (!results) return;
  results.innerHTML = "";

  // Leerzustand
  if (!term) {
    results.innerHTML =
      `<div class="empty">` +
      `Gib etwas ein, z.&nbsp;B. <b>@benutzername</b> oder Teile einer <b>Caption</b>.` +
      `</div>`;
    return;
  }

  try {
    if (activeSearchTab === "accounts") {
      await searchAccounts(term, results);
    } else {
      await searchPosts(term, results);
    }
  } catch (e) {
    console.error("handleSearch fatal:", e);
    results.innerHTML = `<div class="empty">Fehler bei der Suche: ${esc(e.message || e)}</div>`;
  }
}

/** Accounts-Suche */
async function searchAccounts(term, results) {
  console.debug("[Search] Accounts term=", term);

  const { data: users, error } = await sb
    .from("profiles")
    .select("id, username, display_name, is_verified, avatar_url, avatar_path")
    .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
    .limit(20);

  if (error) {
    console.error("Profiles query error:", error);
    results.innerHTML = `<div class="empty">Fehler bei der Account-Suche: ${esc(error.message || error)}</div>`;
    return;
  }

  if (!users || users.length === 0) {
    results.innerHTML = `<div class="empty">Keine Accounts gefunden.</div>`;
    return;
  }

  users.forEach((u) => {
    const uname = (u.username && u.username.trim()) ? u.username : (u.id ? u.id.slice(0, 8) : "unknown");
    const avatar = avatarFromProfile(u);
    const verified = u.is_verified ? " ✓" : "";

    results.insertAdjacentHTML(
      "beforeend",
      `
      <div class="search-result-item">
        <img src="${avatar}" class="search-result-avatar" alt="${esc(uname)}"
             onerror="this.src='assets/img/default-avatar.png'">
        <div class="search-result-info">
          <div class="search-result-username">@${esc(uname)}${verified}</div>
          <div class="search-result-name">${esc(u.display_name) || ""}</div>
        </div>
      </div>
    `
    );
  });
}

/** Beiträge-Suche inkl. Fallback & Username-Join */
async function searchPosts(term, results) {
  console.debug("[Search] Posts term=", term);

  // 1) Versuche OR-Suche (caption ODER image_name)
  let postsResp = await sb
    .from("posts")
    .select("id,user_id,caption,image_path,created_at,image_name")
    .or(`caption.ilike.%${term}%,image_name.ilike.%${term}%`)
    .order("created_at", { ascending: false })
    .limit(30);

  // 2) Fallback: falls OR-Suche zickt, probiere nur caption
  if (postsResp.error) {
    console.warn("OR-Suche Fehler, fallback caption-only:", postsResp.error.message);
    postsResp = await sb
      .from("posts")
      .select("id,user_id,caption,image_path,created_at,image_name")
      .ilike("caption", `%${term}%`)
      .order("created_at", { ascending: false })
      .limit(30);
  }

  const { data: posts, error } = postsResp;

  if (error) {
    console.error("Posts query error:", error);
    results.innerHTML = `<div class="empty">Fehler bei der Beiträge-Suche: ${esc(error.message || error)}</div>`;
    return;
  }

  if (!posts || posts.length === 0) {
    results.innerHTML = `<div class="empty">Keine Beiträge gefunden.</div>`;
    return;
  }

  // 3) Usernames für alle user_id in EINEM Rutsch holen
  const uids = [...new Set(posts.map((p) => p.user_id))];
  let nameMap = {};
  if (uids.length) {
    const { data: profs, error: perr } = await sb
      .from("profiles")
      .select("id, username")
      .in("id", uids);

    if (perr) {
      console.warn("Profile join warning:", perr.message);
    } else {
      nameMap = Object.fromEntries((profs || []).map((x) => [x.id, x.username]));
    }
  }

  // 4) Render
  posts.forEach((p) => {
    const img = publicUrl(p.image_path);
    const username = nameMap[p.user_id] ? `@${nameMap[p.user_id]}` : `@${p.user_id.slice(0, 8)}`;
    const subtitle = p.caption ? p.caption : "";

    results.insertAdjacentHTML(
      "beforeend",
      `
      <div class="search-result-item"
           style="cursor:pointer"
           onclick="location.href='post.html?id=${encodeURIComponent(p.id)}'">
        <img src="${img}" class="post-preview" alt="${esc(subtitle) || 'Post'}"
             onerror="this.src='assets/img/image-placeholder.png'">
        <div class="search-result-info">
          <div class="search-result-username">${esc(username)}</div>
          <div class="search-result-name">${esc(subtitle)}</div>
        </div>
      </div>
    `
    );
  });
}

/* Optional: direkte Initialisierung bei Seitenaufruf (z. B. wenn URL bereits einen Suchbegriff hätte) */
// document.addEventListener("DOMContentLoaded", handleSearch);
