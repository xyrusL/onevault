# OneVault — Visual System & Telemetry Flows

This document contains Mermaid diagrams illustrating OneVault's core runtime data flows, user action cycles, and component interaction models.

---

## 1. Live API Health & Telemetry Filter Flow
Tracking real-time response curves across 6 core Cloudflare Worker endpoints, with monthly fresh baselines, archive auditing, incident diagnostic modals, and endpoint history logs.

```mermaid
flowchart TD
    A["Dashboard Mounts"] --> B["Default Stream: Present Month (Live Baseline)"]
    B --> C["Clean Baseline: 0 Outages, 0 Warnings, ~20ms Latency"]
    C --> D{"User Interaction"}

    %% Curve Filtering
    D -->|"Click Curve Badge"| E["Toggle Filter Active Curves (1 to 6 APIs)"]
    E --> Canvas["Update ApiHealthChartCanvas View"]

    %% Endpoint History Modal
    D -->|"Click History Icon (ClockCounterClockwise)"| Hist["Open ApiEndpointHistoryModal"]
    Hist --> HistFeatures["Search Logs, Filter by Severity (5xx/4xx/200), Cycle (24h/7d/Oct 2026), Copy JSON"]

    %% Date / Archive Filtering
    D -->|"Click Date Filter"| F["Open ApiPeriodFilterModal (Year 2026 Grid)"]
    F -->|"Select Archive Month"| G["Load Archived Telemetry (Historical Incidents Loaded)"]
    G -->|"Display Red/Orange Dots"| Dots["Outage & Warning Dots Plotted on Area Chart"]
    Dots -->|"Hover on Dot"| Isolate["Isolate Affected API Curve on Chart"]
    Dots -->|"Click Incident Dot"| IncModal["Open ApiIncidentDetailModal (Diagnostic Root-Cause & Auto-Recovery)"]

    %% Reset Action
    G -->|"Click Reset to Live / Navigate"| B

    %% Free Tier Ping
    D -->|"Click Ping Edge"| Ping["Zero-DB RTT Edge Ping (/api/health)"]
    Ping --> PingResult["Update Live Response MS (Safe on Cloudflare Free Tier)"]
```

---

## 2. Note Taking & Full-View Canvas Flow
Seamlessly switching between compact editing and high-productivity full-screen canvas with interactive Recharts graphs and playable media embeds.

```mermaid
flowchart TD
    Start["User Opens Note Editor"] --> ModeSelect{"Editor Mode"}

    %% Standard Compact Mode
    ModeSelect -->|"Default"| Compact["NoteEditorModalContent (Compact Modal Dialog)"]
    Compact --> QuickEdit["Edit Title, Formatting, Pick Folder, Color Swatches, Tags"]
    Compact -->|"Click Full View Button (CornersOut)"| TransferToFull["Package Current Draft (Title, HTML, Folder, Color, Tags)"]
    TransferToFull --> FullCanvas["NoteFullViewModal (Maximized Viewport: max-w-[97vw])"]

    %% Direct Full-View
    ModeSelect -->|"Click Full Canvas in Header / NoteCard"| FullCanvas

    %% Inside Full Canvas
    FullCanvas --> CanvasActions{"Canvas Action"}

    CanvasActions -->|"Type Note Content"| Tiptap["Tiptap Rich-Text WYSIWYG Engine"]
    
    CanvasActions -->|"Click + Insert Graph"| ChartModal["Open NoteChartInsertModal"]
    ChartModal --> ChooseChart["Choose Pie, Bar, or Line Graph + Custom Categories & Colors"]
    ChooseChart --> EmbedChart["Embed Live NoteChartWidget (Powered by Recharts)"]

    CanvasActions -->|"Click + Embed URL"| MediaModal["Open NoteMediaInsertModal"]
    MediaModal --> InputURL["Enter YouTube, MP4 Video, Audio MP3, or Web Link"]
    InputURL --> EmbedMedia["Embed NoteEmbedMediaWidget (Responsive Playable Player / Web Card)"]

    %% State Synchronization
    FullCanvas -->|"Click Compact View (CornersIn)"| TransferToCompact["Transfer Updated Content, Charts & Media back to Standard Dialog"]
    TransferToCompact --> Compact

    FullCanvas -->|"Click Save Note"| Serialize["Serialize Clean HTML + Embedded Data Blocks (data-note-chart, data-note-embed)"]
    Compact -->|"Click Save Note"| Serialize
    Serialize --> CloudflareD1["Persist Encrypted Payload to Cloudflare D1 via /api/notes"]
```

---

## 3. Email Routing & D1 Storage Flow
How OneVault routes incoming email messages through Cloudflare Email Routing and stores zero-knowledge payloads in SQLite D1.

```mermaid
sequenceDiagram
    autonumber
    actor Sender as Inbound Sender
    participant CF as Cloudflare Anycast Edge
    participant Worker as onevault-worker (email.handler.ts)
    participant D1 as Cloudflare D1 (SQLite)
    participant Dest as Destination Mailbox

    Sender->>CF: Sends Email to custom domain address
    CF->>Worker: Evaluates Email Routing Rule
    
    alt Account is Forwarded (forward_to != null)
        Worker->>Dest: Relays message via Cloudflare Email Routing
        Worker->>D1: Records metadata telemetry (Zero Plaintext Retained)
    else Direct Vault Inbox (forward_to == null / 'None')
        Worker->>Worker: Encrypts MIME body (AES-GCM-256)
        Worker->>D1: Persists encrypted email record in messages table
    end

    Worker-->>CF: Acknowledges 250 OK
```

---

## 4. Zero-DB Edge Latency Ping Flow
How OneVault tests Cloudflare Edge latency without incurring D1 write operations or exceeding free-tier resource limits.

```mermaid
sequenceDiagram
    autonumber
    actor Client as OneVault React Client
    participant Router as AdminPortalRouter
    participant Edge as Cloudflare Edge Node (Worker V8 Isolate)

    Client->>Edge: GET /api/health (Accept: application/json)
    Note over Edge: Returns edge timestamp from memory (Zero D1 Read/Write)
    Edge-->>Client: 200 OK { status: 'healthy', timestamp: 1791789400 }
    Note over Client: Calculates performance.now() round-trip latency
    Client->>Client: Updates latency telemetry & status indicator
```

---

## 5. Autonomous 5-Layer Edge Self-Defense & Zero-Hardcode API Enrollment Flow
How OneVault automatically discovers every mounted or runtime `/api/*` endpoint without hardcoding, activates its 5-Layer Self-Defense pipeline during volumetric L7 or D1 exhaustion attacks, and automatically returns to normal baseline mode when safe.

```mermaid
flowchart TD
     Boot["Worker Isolate Boots (worker/src/index.ts)"] --> AutoScan["edgeDefenseService.registerMountedRoutes(app.routes)"]
    AutoScan --> DynamicReg["Auto-Enroll All Existing & Future /api/* Routes in Dynamic Registry"]

    Req["Incoming HTTP Request to /api/*"] --> RuntimeDiscover["Auto-Discover Route Prefix (/api/<feature>)"]
    RuntimeDiscover --> AttackCheck{"Abnormal Attack Surge Detected?"}

    AttackCheck -->|"No (Site Safe)"| NormalMode["Normal Baseline Mode (~18 req/s · Standard Auth)"]
    AttackCheck -->|"Yes (Volumetric L7 / Bot Flood)"| AutoEngage["Autonomous Self-Defense Engaged + DdosEmergencyModal Pops Up"]

    AutoEngage --> L1["Defense Layer 1: Perimeter WAF & Botnet Scrubber (Drops SQLi, /.env, sqlmap/nikto -> HTTP 403)"]
    L1 --> L2["Defense Layer 2: Single-Device Session Lock (Auto-Logs Out Previous Devices · Pins Current Browser HMAC)"]
    L2 --> L3["Defense Layer 3: Sliding-Window IP Rate Limiter (Drops >90 req/10s & >6 login/10s -> HTTP 429)"]
    L3 --> L4["Defense Layer 4: Zero-D1 Pre-Auth Memory Gate (Verifies HMAC in Worker RAM <0.2ms · 0 D1 Reads)"]
    L4 --> L5["Defense Layer 5: D1 Write-Path 64KB Circuit Breaker (Blocks JSON Payload Bombs -> HTTP 413)"]

    L5 --> SafeD1["Verified Request Reaches Route Handler & Cloudflare D1 (0ms Lock Contention)"]
    AutoEngage -.->|"Traffic Returns to Safe Baseline"| NormalMode
```

---

## 6. Threat Defense Behavioral Evaluation & Isolation Pipeline
How OneVault evaluates every request signal across 6 antibody layers, maintains a 0.00% false-positive rate with exponential decay and typo forgiveness, and isolates attackers without locking down the site.

```mermaid
flowchart TD
    Req["Incoming User / Prober Signal"] --> FrontlineCheck{"Frontline Client-Side Check"}

    %% Frontline Browser Guard (0 Worker Incurred)
    FrontlineCheck -->|"Browser DevTools Console / Paste"| DevTools["Layer 6: Frontline Console Shield (client-defense-shield.service.ts)"]
    DevTools --> SelfXSS{"Console Injection / Self-XSS / Eval / Prototype Pollution?"}
    SelfXSS -->|"Yes"| ClientDrop["Immediate Client-Side Intercept (DevTools Warning Banner · 0 Worker Quota Spent)"]
    SelfXSS -->|"No"| PassToWorker["Pass to Network Transit"]

    %% Worker Edge Evaluation
    PassToWorker --> WorkerEntry["Worker Entry: threatGuardService.inspectIncomingRequest(c)"]
    WorkerEntry --> Exemption{"Monitoring / Verification Exemption?"}
    Exemption -->|"Yes: /api/dashboard/stats, /ping"| EdgeAllow["Immediate Edge Pass (Owner Always Sees Telemetry)"]
    Exemption -->|"No"| BehavioralProfile["Fetch / Create ActorBehavioralProfile (IP + ASN + User-Agent)"]

    BehavioralProfile --> Decay["1. Exponential Risk Score Decay (Half-Life Recovery)"]
    Decay --> HoneypotCheck{"2. Canary Honeypot Probe? (/.env, /.git, /wp-admin)"}
    HoneypotCheck -->|"Yes"| BlockHoneypot["PENETRATION BLOCK (HTTP 403 · Score 98 · Instant Quarantine)"]

    HoneypotCheck -->|"No"| UACheck{"3. Offensive Scanner Signature? (sqlmap, nuclei, gobuster)"}
    UACheck -->|"Yes"| BlockScanner["PENETRATION BLOCK (HTTP 403 · Score 95)"]

    UACheck -->|"No"| PayloadCheck{"4. Malicious URL Query Payload? (SQLi, XSS, Path Traversal)"}
    PayloadCheck -->|"Yes"| BlockPayload["PENETRATION BLOCK (HTTP 403 · Score 92 · D1 Database Untouched)"]

    PayloadCheck -->|"No"| RouteCheck{"5. Route Enumeration / 404 Probing?"}
    RouteCheck -->|"<= 3 typos in 60s"| AllowTypo["ALLOW (Human Typo Cushion · 0 Penalty · 0% False Positive)"]
    RouteCheck -->|"4–5 distinct unknown pages"| SoftRateLimit["RATE_LIMITED (HTTP 429 · Soft 45s Cooldown)"]
    RouteCheck -->|">= 6 distinct unknown pages"| Quarant404["TEMP_QUARANTINE (HTTP 403 · 10m Quarantine)"]

    RouteCheck -->|"Valid Registered Route"| LoginCheck{"6. Failed Login Attempt?"}
    LoginCheck -->|"1–3 typos"| AllowLoginTypo["ALLOW (Password Typo Forgiveness)"]
    LoginCheck -->|"4–6 failures"| RateLimitLogin["RATE_LIMITED (HTTP 429)"]
    LoginCheck -->|"> 6 failures"| QuarantLogin["TEMP_QUARANTINE (HTTP 403 · Credential Stuffing Block)"]

    LoginCheck -->|"Normal Browsing / Auth Verified"| FinalAllow["ALLOW (Normal Flow · Zero Delay · 0% False Positives)"]

    %% Outcomes to Telemetry
    BlockHoneypot & BlockScanner & BlockPayload & SoftRateLimit & Quarant404 & QuarantLogin --> AuditLog["Log System Audit Event + Update Threat Defense Curve Dots"]
    AuditLog --> RealCurve["ThreatVelocityChart Plots Color-Coded Node (Red: Block, Amber: Quarantine/429)"]
    RealCurve --> UserClick["Site Owner Hovers (Preview) or Clicks (Full ThreatIncidentModal Dossier)"]
```

---

## 7. Emergency DDoS Defense vs. Surgical Threat Defense Comparison

```mermaid
flowchart LR
    subgraph DDoS["Volumetric Emergency Self-Defense (edge-defense.service.ts)"]
        D1["Activated: Site-wide attack surges (>90 req/10s, volumetric L7 floods)"]
        D2["Scope: Site-wide emergency shield"]
        D3["UI: DdosEmergencyModal (Red emergency popup with real-time RPS)"]
        D4["Layers: 64KB D1 Circuit Breaker, Pre-Auth Memory Gate, Session Pinning"]
        D5["Resolution: Auto-resets to baseline mode when traffic normalizes"]
    end

    subgraph Surgical["Adaptive Threat Defense (threat-guard.service.ts)"]
        S1["Activated: 24/7 background behavioral analysis on every single actor"]
        S2["Scope: Per-Actor surgical isolation (Offending IP only)"]
        S3["UI: ThreatDefenseView (Command Center, 24h Velocity curves, Incident modal)"]
        S4["Layers: Canary honeypots, Route scanners, SQLi scrubbers, Console shield"]
        S5["Resolution: Exponential half-life decay heals minor score anomalies"]
    end
```

---

## 8. Smart Inbound Email Service Detection & Purpose Tagging Pipeline
How OneVault automatically extracts service identities and platforms from incoming email activity, generates searchable purpose tags, renders per-email activity feeds, and signals forwarded routing with distinct iconography.

```mermaid
flowchart TD
    Inbound["Inbound Email Received via Cloudflare Email Routing"] --> Log["Activity Event Logged in D1 / GraphQL Feed"]
    Log --> Detector["Smart Service Detection Engine (mail-service-detector.utils.ts)"]

    %% Multi-Signal Dynamic Analysis
    Detector --> Signal1["Signal 1: Generic Domain Extraction (Strips transactional prefixes mail.*, no-reply.*, and multi-part TLDs)"]
    Detector --> Signal2["Signal 2: Dynamic CamelCase & Word Decomposition (e.g. facebookmail -> Facebook, in.dribbble.com -> Dribbble)"]
    Detector --> Signal3["Signal 3: Sender Display Name Cleaning (Strips 'Team', 'Notifications', extracts 'on [Brand]')"]
    Detector --> Signal4["Signal 4: Subject Bracket & Welcome Patterns ('[Brand] Verify', 'Welcome to [Brand]')"]
    Detector --> Signal5["Signal 5: Account Note Heuristic (Inferred keyword fallback from user note)"]

    %% Tag Synthesis
    Signal1 & Signal2 & Signal3 & Signal4 & Signal5 --> Synthesize["Synthesize DetectedServiceTag (Name, Category, Confidence, Color)"]
    Synthesize --> SummaryMap["Build AccountServiceDetectionSummary (byAccountId & byEmail)"]

    %% UI & Search Propagation
    SummaryMap --> SearchIndex["Search Integration: accountMatchesSearch() (Typing 'github' finds alias immediately)"]
    SummaryMap --> TableRow["MailAccountRow: Displays Service Badges + Activity Pulse Action Icon"]
    SummaryMap --> ActivityModal["User Clicks Activity Icon -> Opens MailAccountActivityModalContent"]
    
    ActivityModal --> PurposeTags["Interactive Tag Filter Chips (All, GitHub, Supabase, Dribbble)"]
    ActivityModal --> FilteredFeed["Per-Email Inbound Activity Stream with FastForward Routing Badges"]
```

---

## 9. Local-First Debounced Batch Sync & Write Cycle
How OneVault guarantees zero write lag (perceived 0ms response) while batching mutations and minimizing writes to preserve Cloudflare D1 free-tier quotas.

```mermaid
flowchart TD
    UserEdit["User Performs Write Action (Notes, Mail Note, Forwarding Destination, Filter Preferences)"] --> Service["Domain Service Method (e.g. mailService.update, notesService.updateNote)"]

    %% Local-First Optimistic Stage
    Service --> Optimistic["Stage 1: Optimistic Local State (0ms Perceived Latency)"]
    Optimistic --> ReactState["Update React In-Memory State (Instant UI Re-render)"]
    Optimistic --> LocalCache["Update Domain localStorage Cache (e.g. onevault.mail.cache.v1)"]
    Optimistic --> Enqueue["Enqueue to syncQueueService (Persisted in localStorage: onevault_pending_sync_queue)"]

    %% Queue Merging & Deduplication
    Enqueue --> Dedupe{"Does mutation key already exist in queue?"}
    Dedupe -->|"Yes (e.g. rapid typing in note)"| Merge["Merge / Overwrite Payload by syncKey (Keeps Latest State)"]
    Dedupe -->|"No"| NewEntry["Add New Mutation Entry to Queue"]

    Merge & NewEntry --> ResetTimer["Reset Idle Debounce Timer (2500ms Window)"]

    %% Flush Triggers
    ResetTimer --> TriggerCheck{"Flush Trigger Occurs"}
    TriggerCheck -->|"User goes idle for 2.5s"| Flush["Execute syncQueueService.flush()"]
    TriggerCheck -->|"visibilitychange (User switches tab/minimizes)"| Flush
    TriggerCheck -->|"beforeunload (User closes browser/window)"| Flush
    TriggerCheck -->|"online (Network connection restored)"| Flush

    %% Network Execution
    Flush --> WorkerAPI["Call Cloudflare Worker API via direct fetch (apiClient / apiRequest)"]
    WorkerAPI --> Endpoints["PATCH /api/mail/:id | POST /api/mail/preferences | PATCH /api/notes/:id"]
    Endpoints --> D1["Consolidated Cloudflare D1 Database Write Transaction"]

    %% Resolution & Cleanup
    D1 --> Success{"Write Succeeded?"}
    Success -->|"Yes"| RemoveQueue["Remove Mutation from Queue & Update localStorage"]
    RemoveQueue --> SyncedState["Set Status: 'synced' -> 'idle'"]
    Success -->|"Network Error"| Retry["Increment retryCount (Retries automatically on next idle or 'online' event)"]

---

## 10. Universal Project Gateway Connection, Protection & Activity Telemetry Flow
How connected sites (e.g. GIGAMAXX 4K) pair with OneVault via Gateway Token, undergo edge scrubbing, conceal upstream APIs, and stream live audit events into Cloudflare D1.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / Site Owner
    participant ClientApp as Connected App (e.g. GIGAMAXX)
    participant Modal as OneVault ProjectIntegrationModal
    participant Edge as OneVault Worker (/api/gateway)
    participant D1 as Cloudflare D1 Database
    participant Activity as RecentActivityFeed (OneVault)

    %% Step 1: Project Provisioning
    Dev->>Modal: Creates Project or opens Connection Modal
    Modal->>Dev: Generates Gateway Token (ov_live_*) & Universal .env Snippet
    Note over Dev,ClientApp: Developer pastes ONEVAULT_GATEWAY_URL & TOKEN into .env

    %% Step 2: Boot Handshake
    ClientApp->>Edge: POST /api/gateway/:slug/handshake (X-OneVault-Token)
    Edge->>D1: Verify token & UPDATE connected_projects SET status='active', last_seen_at=NOW()
    Edge->>D1: INSERT INTO system_audit_logs ([Project] Handshake Verified)
    Edge-->>ClientApp: 200 OK (status: 'active', verified: true)
    
    %% Step 3: Live Pairing Detection
    Modal->>Edge: Polls GET /api/projects/:id/verify
    Edge-->>Modal: Status changed: 'connecting' (Amber) -> 'active' (Emerald Green)
    Modal-->>Dev: Verified badge turns Green

    %% Step 4: Concealed Streaming & API Calls
    ClientApp->>Edge: GET /api/gateway/:slug/proxy/api/* (Concealed Upstream Query)
    Edge->>Edge: Bot scrub, origin check, DevMode check
    Edge->>ClientApp: Return sanitized upstream data (Upstream host hidden from DevTools)

    %% Step 5: Unified Audit Feed
    Activity->>D1: Fetch recent system_audit_logs
    Activity-->>Dev: Displays [Project] VERIFIED, [Project] STREAM, BLOCKED 403 badges
```
```
