#!/usr/bin/env python3
"""Клинок Сакуры: статика + API чата, рейтинга и арены.

Только стандартная библиотека. Данные — один JSON-файл рядом (data/state.json),
запись атомарная. Порт задаётся переменной PORT (по умолчанию 8080).
Запускается от отдельного пользователя, соседние сервисы (VPN, wg-register) не трогает.
"""
import gzip
import json
import os
import re
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

BASE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(BASE, "public")
DATA_DIR = os.path.join(BASE, "data")
STATE_FILE = os.path.join(DATA_DIR, "state.json")
PORT = int(os.environ.get("PORT", "8080"))
HOST = os.environ.get("HOST", "0.0.0.0")

MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".md": "text/markdown; charset=utf-8",
}
TEXTY = {".html", ".js", ".css", ".json", ".svg", ".md"}
CTRL = re.compile(r"[\x00-\x1f\x7f]")
BAD = re.compile(r"(?i)(бля\w*|хуй\w*|ху[йяе]\w*|пизд\w*|еб[аеёиоу]\w*|сук[аи]\w*|мраз\w*|нахуй\w*)")

state_lock = threading.Lock()
state = {"players": {}, "chat": [], "seq": 1}
last = {}

WORLD = {"base_hp": 1.6e9, "per_player": .5, "hit_gap": 45, "respawn": 600, "max_hit": .15,
         "names": ["Древень Тысячи Лепестков", "Страж Алого Сада", "Корень Забвения", "Хранитель Ханами"]}


def utc_day():
    return time.strftime("%Y-%m-%d", time.gmtime())


def world_players():
    t = now()
    return sum(1 for p in state["players"].values() if t - int(p.get("ts", 0)) < 7 * 86400)


def world_reset(serial=1, hp_mul=1.0, power=0, base=None):
    n = max(1, world_players())
    base_hp = base if base else max(20e6, (power * 180 * 30) if power else 0)
    max_hp = int(base_hp * (1 + WORLD["per_player"] * (n - 1)) * hp_mul)
    state["world"] = {
        "day": utc_day(), "serial": serial, "name": WORLD["names"][(serial - 1) % len(WORLD["names"])],
        "hp": max_hp, "maxHp": max_hp, "startedAt": now(), "killedAt": 0,
        "dmg": {}, "names": {}, "claimed": {},
    }
    return state["world"]


def world_ensure():
    w = state.get("world") or {}
    if not w or w.get("day") != utc_day():
        return world_reset(1)
    if w.get("killedAt") and now() - int(w["killedAt"]) > WORLD["respawn"]:
        return world_reset(int(w.get("serial", 1)) + 1, 1.1, base=int(w.get("maxHp", 20e6)))
    return w


def world_public(pid):
    w = world_ensure()
    rows = sorted(w["dmg"].items(), key=lambda kv: -kv[1])
    top = [{"name": w["names"].get(k, "Игрок"), "damage": int(v)} for k, v in rows[:10]]
    rank = next((i + 1 for i, (k, _) in enumerate(rows) if k == pid), 0)
    killed = bool(w.get("killedAt"))
    rew = w["claimed"].get(pid) if killed else None
    return {
        "ok": True, "id": f"{w['day']}-{w['serial']}", "name": w["name"], "hp": int(w["hp"]), "maxHp": int(w["maxHp"]),
        "killed": killed, "respawnIn": max(0, WORLD["respawn"] - (now() - int(w["killedAt"]))) if killed else 0,
        "players": len(w["dmg"]), "top": top, "myDamage": int(w["dmg"].get(pid, 0)), "rank": rank,
        "claimable": bool(killed and pid in w["dmg"] and pid not in w["claimed"]),
        "rewards": rew,
        "wait": max(0, WORLD["hit_gap"] - int(now() - last.get("world:" + pid, 0))),
    }


def world_reward(pid):
    w = world_ensure()
    total = sum(w["dmg"].values()) or 1
    share = w["dmg"].get(pid, 0) / total
    return {"gems": int(60 + 300 * share), "crystals": int(300 + 1500 * share),
            "petals": int(1 + (share >= .25) + (share >= .5))}


def now():
    return int(time.time())


def load():
    global state
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            state = json.load(f)
    except Exception:
        state = {"players": {}, "chat": [], "seq": 1}
    state.setdefault("players", {})
    state.setdefault("chat", [])
    state.setdefault("seq", 1)
    state.setdefault("world", {})


def save():
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, STATE_FILE)


def clean(text, limit, name=False):
    text = CTRL.sub(" ", str(text or "")).strip()
    if name:
        text = re.sub(r"\s+", " ", text)[:limit]
    else:
        text = re.sub(r"\s+", " ", text)[:limit]
        text = BAD.sub("***", text)
    return text


def num(v, lo, hi, default=0):
    try:
        v = float(v)
    except Exception:
        return default
    if v != v:
        return default
    return max(lo, min(hi, v))


def rate(key, gap):
    t = time.time()
    if t - last.get(key, 0) < gap:
        return False
    last[key] = t
    return True


def player_row(p):
    return {
        "pid": p.get("pid"),
        "name": p.get("name", "Игрок"),
        "stage": int(p.get("stage", 0)),
        "best": int(p.get("best", 0)),
        "level": int(p.get("level", 1)),
        "power": round(num(p.get("power"), 0, 1e30)),
        "rating": int(num(p.get("rating"), 0, 9999, 1000)),
        "ts": int(p.get("ts", 0)),
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "KlinokSakury/3.1"
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.address_string(), fmt % args), flush=True)

    # ---------- helpers ----------
    def send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self, limit=8192):
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except Exception:
            n = 0
        if n <= 0 or n > limit:
            return None
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception:
            return None

    def serve_file(self, path):
        if not os.path.isfile(path):
            self.send_error(404)
            return
        ext = os.path.splitext(path)[1].lower()
        try:
            with open(path, "rb") as f:
                body = f.read()
        except Exception:
            self.send_error(404)
            return
        if ext in TEXTY and len(body) > 1024 and "gzip" in (self.headers.get("Accept-Encoding") or ""):
            body = gzip.compress(body, 6)
            encoding = "gzip"
        else:
            encoding = None
        self.send_response(200)
        self.send_header("Content-Type", MIME.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        if encoding:
            self.send_header("Content-Encoding", encoding)
        if ext in (".woff2", ".woff", ".ttf", ".png", ".jpg"):
            self.send_header("Cache-Control", "public, max-age=604800")
        else:
            self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    # ---------- GET ----------
    def do_GET(self):
        u = urlparse(self.path)
        path = unquote(u.path)
        q = parse_qs(u.query)
        if path == "/api/health":
            with state_lock:
                return self.send_json({"ok": True, "players": len(state["players"]), "ts": now()})
        if path == "/api/chat":
            try:
                since = int((q.get("since") or ["0"])[0])
            except Exception:
                since = 0
            with state_lock:
                msgs = [m for m in state["chat"] if int(m.get("id", 0)) > since][-80:]
            return self.send_json({"ok": True, "messages": msgs, "ts": now()})
        if path == "/api/board":
            with state_lock:
                rows = [player_row(p) for p in state["players"].values()]
            rows.sort(key=lambda r: (-r["best"], -r["power"]))
            return self.send_json({"ok": True, "top": rows[:50], "ts": now()})
        if path == "/api/arena":
            pid = (q.get("pid") or [""])[0]
            rating = int(num((q.get("rating") or ["1000"])[0], 0, 9999, 1000))
            with state_lock:
                cand = []
                for p in state["players"].values():
                    if p.get("pid") == pid or "st" not in p:
                        continue
                    cand.append(p)
            cand.sort(key=lambda p: abs(int(p.get("rating", 1000)) - rating))
            near = [p for p in cand if abs(int(p.get("rating", 1000)) - rating) <= 350][:12]
            if not near:
                near = cand[:12]
            out = []
            for p in near:
                out.append({
                    "pid": p.get("pid"), "name": p.get("name", "Игрок"),
                    "rating": int(p.get("rating", 1000)), "power": round(num(p.get("power"), 0, 1e30)),
                    "level": int(p.get("level", 1)), "body": p.get("body"), "hair": p.get("hair"),
                    "st": p.get("st"), "look": p.get("look"),
                })
            return self.send_json({"ok": True, "players": out})
        if path == "/api/world":
            pid = (q.get("pid") or [""])[0]
            with state_lock:
                return self.send_json(world_public(pid))
        # static
        if path == "/":
            path = "/index.html"
        full = os.path.abspath(os.path.join(PUBLIC, path.lstrip("/\\")))
        if not full.startswith(PUBLIC + os.sep) and full != PUBLIC:
            self.send_error(403)
            return
        return self.serve_file(full)

    # ---------- POST ----------
    def do_POST(self):
        u = urlparse(self.path)
        path = u.path
        data = self.read_json()
        if data is None:
            return self.send_json({"ok": False, "error": "bad_json"}, 400)
        if path == "/api/chat":
            pid = clean(data.get("pid"), 40)
            name = clean(data.get("name"), 14, name=True) or "Игрок"
            text = clean(data.get("text"), 200)
            if not pid or len(pid) < 6:
                return self.send_json({"ok": False, "error": "bad_pid"}, 400)
            if not text:
                return self.send_json({"ok": False, "error": "empty"}, 400)
            if not rate("chat:" + pid, 3.0):
                return self.send_json({"ok": False, "error": "slow"}, 429)
            with state_lock:
                mid = int(state["seq"]) + 1
                state["seq"] = mid
                msg = {"id": mid, "pid": pid, "name": name, "text": text, "ts": now()}
                state["chat"].append(msg)
                state["chat"] = state["chat"][-200:]
                save()
            return self.send_json({"ok": True, "message": msg})
        if path == "/api/board":
            pid = clean(data.get("pid"), 40)
            if not pid or len(pid) < 6:
                return self.send_json({"ok": False, "error": "bad_pid"}, 400)
            if not rate("board:" + pid, 5.0):
                return self.send_json({"ok": True, "throttled": True})
            with state_lock:
                p = state["players"].get(pid, {"pid": pid})
                p.update({
                    "pid": pid, "name": clean(data.get("name"), 14, name=True) or p.get("name", "Игрок"),
                    "stage": int(num(data.get("stage"), 0, 100000)),
                    "best": int(num(data.get("best", data.get("stage")), 0, 100000)),
                    "level": int(num(data.get("level"), 1, 100000)),
                    "power": num(data.get("power"), 0, 1e30),
                    "rating": int(num(data.get("rating"), 0, 9999, 1000)),
                    "ts": now(),
                })
                state["players"][pid] = p
                save()
            return self.send_json({"ok": True})
        if path == "/api/arena":
            pid = clean(data.get("pid"), 40)
            if not pid or len(pid) < 6:
                return self.send_json({"ok": False, "error": "bad_pid"}, 400)
            if not rate("arena:" + pid, 8.0):
                return self.send_json({"ok": True, "throttled": True})
            st = data.get("st") or {}
            look = data.get("look") or {}
            st = {
                "atk": num(st.get("atk"), 1, 1e30, 1), "hp": num(st.get("hp"), 1, 1e30, 1),
                "def": num(st.get("def"), 0, 1e30), "crit": num(st.get("crit"), 0, 0.9),
                "critDmg": num(st.get("critDmg"), 1, 50, 1.5), "aspd": num(st.get("aspd"), 0.5, 12, 1),
            }
            lk = {}
            for k in ("helmet", "upper", "lower", "gloves", "boots", "neck", "ear", "aura"):
                lk[k] = int(num(look.get(k, -1), -1, 6, -1))
            w = look.get("weapon")
            lk["weapon"] = {"g": int(num((w or {}).get("g", -1), -1, 6, -1)), "e": int(num((w or {}).get("e", 0), 0, 20))} if w else None
            with state_lock:
                p = state["players"].get(pid, {"pid": pid})
                p.update({
                    "pid": pid, "name": clean(data.get("name"), 14, name=True) or p.get("name", "Игрок"),
                    "rating": int(num(data.get("rating"), 0, 9999, 1000)),
                    "power": num(data.get("power"), 0, 1e30),
                    "level": int(num(data.get("level"), 1, 100000)),
                    "body": "boy" if data.get("body") == "boy" else "girl",
                    "hair": int(num(data.get("hair"), 0, 3)),
                    "st": st, "look": lk, "ts": now(),
                })
                state["players"][pid] = p
                save()
            return self.send_json({"ok": True})
        if path == "/api/world":
            pid = clean(data.get("pid"), 40)
            name = clean(data.get("name"), 14, name=True) or "Игрок"
            if not pid or len(pid) < 6:
                return self.send_json({"ok": False, "error": "bad_pid"}, 400)
            dmg = num(data.get("damage"), 0, 1e30, 0)
            with state_lock:
                w = world_ensure()
                if w.get("killedAt"):
                    pub = world_public(pid)
                    pub.update({"ok": False, "error": "killed"})
                    return self.send_json(pub, 409)
                wait = int(WORLD["hit_gap"] - (now() - last.get("world:" + pid, 0)))
                if wait > 0:
                    pub = world_public(pid)
                    pub.update({"ok": False, "error": "slow", "wait": wait})
                    return self.send_json(pub, 429)
                last["world:" + pid] = now()
                power = num(data.get("power"), 0, 1e30)
                if not w["dmg"]:
                    # первый удар задаёт масштаб босса под силу игрока
                    w["maxHp"] = int(max(20e6, power * 180 * 30))
                    w["hp"] = w["maxHp"]
                cap = w["maxHp"] * WORLD["max_hit"]
                hit = int(min(max(dmg, 1), cap, w["hp"]))
                w["dmg"][pid] = int(w["dmg"].get(pid, 0)) + hit
                w["names"][pid] = name
                w["hp"] = max(0, w["hp"] - hit)
                if w["hp"] <= 0:
                    w["killedAt"] = now()
                p = state["players"].setdefault(pid, {"pid": pid})
                p.update({"pid": pid, "name": name, "level": int(num(data.get("level"), 1, 100000)),
                          "power": num(data.get("power"), 0, 1e30), "ts": now()})
                save()
                pub = world_public(pid)
                pub["hit"] = hit
                return self.send_json(pub)
        if path == "/api/world/claim":
            pid = clean(data.get("pid"), 40)
            if not pid or len(pid) < 6:
                return self.send_json({"ok": False, "error": "bad_pid"}, 400)
            with state_lock:
                w = world_ensure()
                if not w.get("killedAt"):
                    return self.send_json({"ok": False, "error": "alive"}, 409)
                if pid not in w["dmg"]:
                    return self.send_json({"ok": False, "error": "no_damage"}, 403)
                if pid in w["claimed"]:
                    return self.send_json({"ok": True, "rewards": w["claimed"][pid], "already": True})
                rw = world_reward(pid)
                w["claimed"][pid] = rw
                save()
                return self.send_json({"ok": True, "rewards": rw})
        return self.send_json({"ok": False, "error": "not_found"}, 404)


def main():
    load()
    os.makedirs(DATA_DIR, exist_ok=True)
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    srv.daemon_threads = True
    print(f"Клинок Сакуры: http://{HOST}:{PORT}/ · data={STATE_FILE}", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()


if __name__ == "__main__":
    main()
