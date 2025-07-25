\# 📦 Database Schema: Telegram WebApp for Couple Games



This database schema is designed for a Telegram-based WebApp where two users connect as a couple, play real-time games, track progress, and view history and achievements.



---



\## 🧩 Tables Overview



1\. `users` — Users  

2\. `partnerships` — Partner Connections  

3\. `games` — Available Games  

4\. `game\_sessions` — Played Game Sessions  

5\. `achievements` — Achievement Types  

6\. `user\_achievements` — User Progress on Achievements  

7\. `history` — Game History  

8\. `settings` — User Preferences  

9\. `invites` — Invitation Links  



---



\## 📋 Table Definitions



\### 1. `users`



| Column        | Type          | Description                          |

|---------------|---------------|--------------------------------------|

| `id`          | INTEGER PK    | Unique internal user ID              |

| `telegram\_id` | TEXT UNIQUE   | Telegram user ID                     |

| `display\_name`| TEXT          | User-defined display name            |

| `avatar\_id`   | INTEGER       | Selected avatar from preset list     |

| `online\_status` | BOOLEAN     | Whether user is online               |

| `created\_at`  | DATETIME      | Date of user registration            |



---



\### 2. `partnerships`



| Column         | Type           | Description                          |

|----------------|----------------|--------------------------------------|

| `id`           | INTEGER PK     | Unique ID of the connection          |

| `user1\_id`     | INTEGER FK → users(id) | First partner               |

| `user2\_id`     | INTEGER FK → users(id) | Second partner              |

| `connected\_at` | DATETIME       | Date/time the partnership was made   |

| `is\_active`    | BOOLEAN        | Whether this partnership is active   |



> 💡 A user may have only one active partner.



---



\### 3. `games`



| Column         | Type          | Description                           |

|----------------|---------------|---------------------------------------|

| `id`           | INTEGER PK    | Unique game ID                        |

| `title`        | TEXT          | Game title                            |

| `description`  | TEXT          | Short description                     |

| `category`     | TEXT          | Category (quiz, reaction, romantic…)  |

| `animation\_url`| TEXT          | Optional animation/icon               |

| `is\_active`    | BOOLEAN       | Whether the game is available         |



---



\### 4. `game\_sessions`



| Column          | Type           | Description                          |

|-----------------|----------------|--------------------------------------|

| `id`            | INTEGER PK     | Unique session ID                    |

| `game\_id`       | INTEGER FK → games(id) | Game being played          |

| `partner1\_id`   | INTEGER FK → users(id) | Player 1                   |

| `partner2\_id`   | INTEGER FK → users(id) | Player 2                   |

| `started\_at`    | DATETIME       | Start timestamp                      |

| `ended\_at`      | DATETIME       | End timestamp                        |

| `result\_json`   | TEXT (JSON)    | Custom result data (score, winner…)  |



---



\### 5. `achievements`



| Column         | Type          | Description                          |

|----------------|---------------|--------------------------------------|

| `id`           | INTEGER PK    | Unique achievement ID                |

| `emoji`        | TEXT          | Emoji icon                           |

| `title`        | TEXT          | Achievement name                     |

| `description`  | TEXT          | Description/goal summary             |

| `goal`         | INTEGER       | Target value (e.g., 10 games played) |



---



\### 6. `user\_achievements`



| Column            | Type           | Description                          |

|-------------------|----------------|--------------------------------------|

| `id`              | INTEGER PK     | Unique record ID                     |

| `user\_id`         | INTEGER FK → users(id) | User                    |

| `achievement\_id`  | INTEGER FK → achievements(id) | Achievement       |

| `progress`        | INTEGER        | Current progress                     |

| `achieved\_at`     | DATETIME NULL  | Date completed (if achieved)         |



---



\### 7. `history`



| Column           | Type           | Description                          |

|------------------|----------------|--------------------------------------|

| `id`             | INTEGER PK     | Unique history entry ID              |

| `user\_id`        | INTEGER FK → users(id) | Player involved              |

| `game\_session\_id`| INTEGER FK → game\_sessions(id) | Game session       |

| `played\_at`      | DATETIME       | When it was played                   |

| `result\_short`   | TEXT           | Summary (e.g., “Win”, “8/10”, etc.)  |



---



\### 8. `settings`



| Column           | Type        | Description                          |

|------------------|-------------|--------------------------------------|

| `user\_id`        | INTEGER PK FK → users(id) | User              |

| `theme`          | TEXT        | Theme: `light` / `dark`              |

| `language`       | TEXT        | `en` / `ru`                          |

| `sound\_enabled`  | BOOLEAN     | Toggle sound                         |

| `notifications`  | BOOLEAN     | Toggle notifications                 |



---



\### 9. `invites`



| Column         | Type           | Description                          |

|----------------|----------------|--------------------------------------|

| `id`           | INTEGER PK     | Unique invite ID                     |

| `token`        | TEXT UNIQUE    | Generated invite token               |

| `created\_by`   | INTEGER FK → users(id) | Who generated the link         |

| `created\_at`   | DATETIME       | When it was generated                |

| `used\_by`      | INTEGER FK → users(id), NULL | Who accepted the invite |

| `used\_at`      | DATETIME NULL  | When the link was used               |



---



\## 🔗 Table Relationships



```plaintext

users ─┬─────── partnerships (user1\_id, user2\_id)

&nbsp;      ├─────── game\_sessions (partner1\_id, partner2\_id)

&nbsp;      ├─────── user\_achievements (user\_id)

&nbsp;      ├─────── settings (user\_id)

&nbsp;      └─────── history (user\_id)



games ───────── game\_sessions (game\_id)



achievements ── user\_achievements (achievement\_id)



game\_sessions ─ history (game\_session\_id)



✅ Notes

Each user can be in one active partnership at a time.



Game sessions store result data in flexible JSON format.



Achievement progress is tracked and visualized.



User invites work via a secure unique token system.



This schema is designed for local usage (SQLite), but can be scaled to full DBMS.



