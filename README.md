# 🗺️ NeoQuest

> **Stop scrolling. Start exploring.**

## Current prototype

The repository now includes a small, working Next.js + React + TypeScript prototype with Tailwind CSS, Leaflet, and OpenStreetMap tiles. Open `/map` to explore 12 fictional activity ideas around Berkeley, filter by **Food, Sports, Outdoors, or Cafés**, and click markers or sidebar cards to read activity details. It works on desktop and mobile without API keys.

All activity names and descriptions are sample ideas, and coordinates are illustrative. They are **not verified businesses, available venues, or real recommendations**. The roadmap below describes the longer-term vision; authentication, Firebase, Google APIs, and recommendation ranking are not implemented in this first prototype.

See [Running and testing the prototype](docs/prototype.md) for preview commands and tile-provider guidance.

NeoQuest is a hangout discovery platform that helps friends find things to do nearby based on what they actually want to do.

Instead of recommending only major attractions or the same highly rated destinations, NeoQuest focuses on spontaneous **side quests**: grabbing boba, finding a sunset spot, exploring a new neighborhood, playing basketball, studying at a café, or discovering something completely unexpected.

Users tell NeoQuest their group's preferences and constraints, and NeoQuest turns nearby places and activities into personalized recommendations displayed through an interactive map.

---

## ✨ What is NeoQuest?

Ever had this conversation?

> "What do you want to do?"
> "I don't know. What do *you* want to do?"
> "I don't know."

NeoQuest is designed to solve that problem.

Users can create a hangout based on factors such as:

* 💰 Budget
* 👥 Group size
* 🎯 Activity preferences
* 🚗 Transportation
* ⏰ Available time
* 📍 Location

NeoQuest then searches nearby activities and locations and surfaces options that fit the group.

Rather than asking:

> **"What are the most popular things near me?"**

NeoQuest asks:

> **"What would actually be fun for this group right now?"**

---

## 🌟 Core Features

### 🧭 Side Quest Discovery

Discover nearby activities based on your group's preferences instead of endlessly searching Google Maps, Yelp, Reddit, or social media.

Possible side quests could include:

* trying a new boba shop
* finding a basketball court
* exploring a park
* visiting a café
* finding a sunset viewpoint
* taking transit somewhere unfamiliar
* finding a cheap restaurant
* discovering an activity suggested by another NeoQuest user

---

### 🔥 Activity Heatmap

Instead of displaying every nearby location equally, NeoQuest aims to visualize **where the best areas are for a particular activity**.

For example, if the group selects:

**🧋 "Get drinks"**

areas containing strong clusters of:

* boba shops
* cafés
* smoothie shops
* dessert spots

could become more prominent on the map.

If the group switches to:

**🏀 "Do something active"**

the visualization could instead emphasize:

* basketball courts
* parks
* recreation centers
* hiking areas
* sports facilities

The goal is to turn the map into a visual representation of **where the action is** for the group's current mood.

---

### 🎛️ Preference-Based Filtering

Users can narrow recommendations according to constraints such as:

| Preference     | Example                                   |
| -------------- | ----------------------------------------- |
| Budget         | Free, $, $$                               |
| Group Size     | Solo, 2–4, 5+                             |
| Transportation | Walking, biking, transit, driving         |
| Activity       | Food, outdoors, sports, drinks, exploring |
| Time           | 30 min, 1 hr, 2+ hrs                      |
| Distance       | Nearby or willing to travel               |

These preferences are used to rank or filter potential side quests.

---

### 👥 Group Preferences

Hangouts involve more than one person.

NeoQuest aims to combine preferences from multiple people to find activities that work for the entire group rather than optimizing for a single user.

Future versions may allow friends to submit their preferences independently through an invitation link.

---

### 🗺️ Interactive Map

Recommendations appear directly on an interactive map.

Users will be able to:

* explore nearby recommendations
* inspect individual locations
* view activity categories
* compare areas
* visualize activity density
* select a side quest
* bookmark places for later

---

### ➕ Community Side Quests

Not every fun activity exists in a places database.

NeoQuest users can submit their own side quest ideas for other users to discover.

Examples might include:

> "Take the 51B five random stops and explore wherever you end up."

or

> "Grab drinks here and walk to this sunset spot."

This community layer helps NeoQuest recommend experiences rather than only businesses.

---

## 🧠 How NeoQuest Works

```text
                    ┌─────────────────┐
                    │      User       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Create Hangout  │
                    │ + Preferences   │
                    └────────┬────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Recommendation Engine │
                 │                       │
                 │ Budget • Group Size   │
                 │ Distance • Activity   │
                 │ Time • Transportation │
                 └───────────┬───────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
              ┌──────────┐      ┌──────────┐
              │ Places / │      │ NeoQuest │
              │ Map APIs │      │ Database │
              └─────┬────┘      └─────┬────┘
                    │                 │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │ Ranked Results  │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │ Map + Heatmap   │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │   SIDE QUEST!   │
                    └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

* **React / Next.js** — web application and component architecture
* **JavaScript / TypeScript** — frontend logic
* **CSS** — styling and responsive design
* **Figma** — UI/UX design and prototyping

### Backend & Database

* **Firebase Authentication** — account creation and login
* **Cloud Firestore** — users, preferences, bookmarks, side quests, and other application data
* **Firebase Storage** — potential storage for user-uploaded images
* **Firebase Cloud Functions / Next.js API Routes** — server-side logic where necessary

### Maps & Location Data

Potential integrations include:

* **Google Maps Platform**
* **Google Places API**
* **Google Routes API**

These services can provide geographic search, place information, travel distance, and map visualization.

Additional APIs/data sources are still being evaluated.

### Data & Recommendation System

Potential tools include:

* Python
* pandas
* NumPy
* scikit-learn

Early versions of NeoQuest may rely primarily on rule-based filtering and ranking before introducing more sophisticated recommendation methods.

---

## 🗃️ Proposed Data Model

A simplified Firebase structure could look like:

```text
users/
  {userId}/
    displayName
    preferences
    savedPlaces
    savedFriends

sideQuests/
  {questId}/
    creatorId
    title
    description
    category
    location
    budget
    duration
    groupSize
    likes

hangouts/
  {hangoutId}/
    participants
    preferences
    selectedQuest
    createdAt

bookmarks/
  {bookmarkId}/
    userId
    placeId
    createdAt
```

The exact schema will evolve as features are implemented.

---

## 🗺️ Recommendation Pipeline

A NeoQuest search could roughly follow:

```text
User Preferences
       ↓
Retrieve Nearby Places
       ↓
Filter Invalid Options
       ↓
 ┌─────┴─────┐
 ↓           ↓
Budget     Distance
 ↓           ↓
Group      Activity
Size       Match
 └─────┬─────┘
       ↓
Score Candidates
       ↓
Rank Side Quests
       ↓
Map Visualization
       ↓
Activity Heatmap
```

For example:

```text
Activity: Drinks
Budget: $
Group Size: 4
Transportation: Walking
Distance: < 2 miles
```

NeoQuest might retrieve nearby cafés, boba shops, juice bars, and dessert shops, filter them according to the constraints, rank the remaining options, and visualize promising areas on the map.

---

## 🔌 API Strategy

We are currently evaluating the best APIs for NeoQuest.

The ideal combination should provide:

| Need                   | Potential Solution                    |
| ---------------------- | ------------------------------------- |
| Interactive map        | Google Maps JavaScript API            |
| Nearby places          | Google Places API                     |
| Place categories       | Google Places API                     |
| Ratings/reviews        | Places data / other permitted sources |
| Distance & travel time | Google Routes API                     |
| User authentication    | Firebase Authentication               |
| Application database   | Cloud Firestore                       |
| User images            | Firebase Storage                      |
| Weather-aware quests   | Weather API                           |
| Community quests       | NeoQuest / Firestore                  |

One important development goal is minimizing dependence on unnecessary APIs and keeping API usage within reasonable quotas and costs.

---

## 🎨 Design

NeoQuest's interface is designed in **Figma** before implementation.

Our design priorities are:

* map-first exploration
* minimal friction between opening NeoQuest and finding an activity
* intuitive preference selection
* visually distinct activity categories
* mobile-friendly layouts
* playful "side quest" aesthetics

Figma mockups and screenshots will be added here as designs are finalized.

<!-- Add Figma screenshots here -->

---

## 📁 Proposed Project Structure

```text
neoquest/
│
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── explore/
│   └── quest/
│
├── components/
│   ├── Map/
│   ├── Heatmap/
│   ├── Filters/
│   ├── QuestCard/
│   └── Navbar/
│
├── lib/
│   ├── firebase/
│   ├── maps/
│   └── recommendations/
│
├── public/
│
├── styles/
│
├── docs/
│   └── designs/
│
├── .env.example
├── package.json
└── README.md
```

This structure is provisional and may change as development progresses.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/bumpadumpt/neoquest.git
cd neoquest
```

### 2. Install dependencies

Use **Node.js 22 or newer** and npm. The lockfile pins dependencies.

```bash
npm ci
```

### 3. Start the development server

No environment variables or API keys are required for this prototype.

```bash
npm run dev
```

Open `http://localhost:3000/map` in your browser. Internet access to `tile.openstreetmap.org` is needed for the basemap; sample data, markers, and filters are local.

### 4. Check the production build

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

Browser test instructions are in [docs/prototype.md](docs/prototype.md).

---

## 👨‍💻 Team Structure

NeoQuest development is divided into three primary subteams:

### 🎨 Frontend

Responsible for:

* Figma designs
* page layouts
* components
* map interface
* filtering interface
* responsive design

### 🔐 Database & Authentication

Responsible for:

* Firebase setup
* authentication
* Firestore schema
* user profiles
* saved preferences
* bookmarks
* user-created side quests

### 📊 Data & APIs

Responsible for:

* places APIs
* location data
* recommendation logic
* filtering/ranking
* heatmap data
* API integration and preprocessing

All three teams collaborate on integration and testing.

---

## 🛣️ Development Roadmap

### Phase 1 — Foundation

* [ ] Finalize Figma designs
* [ ] Set up Next.js project
* [ ] Configure Firebase
* [ ] Configure Maps/Places APIs
* [ ] Establish Git/GitHub workflow

### Phase 2 — MVP

* [ ] User authentication
* [ ] Dashboard
* [ ] Interactive map
* [ ] Nearby place retrieval
* [ ] Preference filters
* [ ] Basic recommendation ranking
* [ ] Side quest cards

### Phase 3 — NeoQuest Features

* [ ] Activity heatmap
* [ ] User-created side quests
* [ ] Bookmarks
* [ ] Saved group preferences
* [ ] Improved recommendation scoring

### Phase 4 — Stretch Features

* [ ] Friend preference invitations
* [ ] Reviews / voting
* [ ] Weather-aware recommendations
* [ ] Community popularity signals
* [ ] Photos
* [ ] More sophisticated recommendation model
* [ ] Expansion beyond the initial Berkeley/Bay Area testing region

---

## 🎯 MVP Goal

Our MVP should allow a user to:

**Sign in → create a hangout → enter preferences → receive nearby recommendations → explore them on a map → choose a side quest.**

Everything else builds on this core experience.

---

## 🤝 Contributing

### Branch Workflow

Create a branch for the feature you are working on:

```bash
git checkout -b feature/your-feature-name
```

Examples:

```text
feature/firebase-auth
feature/google-maps
feature/activity-heatmap
feature/quest-filtering
feature/dashboard-ui
```

Commit your changes:

```bash
git add .
git commit -m "Add Firebase authentication"
```

Push your branch:

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request for review.

Please avoid pushing unfinished feature work directly to `main`.

---

## 📌 Project Status

🚧 **NeoQuest is currently under active development.**

The architecture, APIs, database schema, recommendation logic, and interface may change as we test different approaches.

---

## 🌎 Our Goal

NeoQuest isn't trying to tell you what the most famous thing in your city is.

It's trying to answer a much simpler question:

> **What should we do right now?**

Find your next side quest.
