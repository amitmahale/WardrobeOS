import type { Metadata } from "next";
import styles from "./style.module.css";

export const metadata: Metadata = {
  title: "WardrobeOS Architecture Magazine",
  description: "A polished architecture overview of the WardrobeOS web app, backend, AI tagging, PWA, and ChatGPT companion."
};

const stackCards = [
  ["Frontend", "Next.js App Router, TypeScript, Tailwind, PWA shell, Zustand interaction state."],
  ["Backend", "Vercel Route Handlers for auth boundaries, validation, AI calls, uploads, and GPT Actions."],
  ["Data", "Supabase Auth, Postgres, RLS, Storage, wardrobe tables, image metadata, OAuth grant tables."],
  ["AI Layer", "Gemini for reviewed item tagging. ChatGPT Custom GPT for styling conversation and visual previews."]
];

const apiRows = [
  ["/api/bootstrap", "Hydrates signed-in profile, default closet, and wardrobe items."],
  ["/api/items/*", "Create, update, archive, mark worn, upload and confirm item images."],
  ["/api/ai/*", "Single and bulk Gemini tagging behind user review."],
  ["/api/gpt/*", "OAuth and read-only GPT Actions for closet styling."]
];

const gptActions = [
  "getWardrobeProfile",
  "listClosetItems",
  "getClosetItem",
  "listSavedOutfits",
  "suggestClosetOutfits",
  "createVisualizationBrief"
];

export default function ArchitectureMagazinePage() {
  return (
    <main className={styles.magazine}>
      <section className={`${styles.page} ${styles.cover}`}>
        <div className={styles.coverGrid}>
          <div>
            <p className={styles.kicker}>WardrobeOS technical magazine</p>
            <h1>Closet Data Meets AI Styling</h1>
            <p className={styles.dek}>
              A compact architecture tour of the web app, backend, Supabase data layer, Gemini tagging, iPhone PWA, and
              ChatGPT companion that turns a real closet into a personal styling system.
            </p>
          </div>
          <div className={styles.issueCard}>
            <span>Private Beta</span>
            <strong>Architecture Edition</strong>
            <small>Web app + backend + GPT Actions</small>
          </div>
        </div>
        <div className={styles.coverMap} aria-label="WardrobeOS architecture map">
          <Node title="User" tone="gold" />
          <Connector />
          <Node title="WardrobeOS Web App" subtitle="Capture, catalog, review" tone="ink" />
          <Connector />
          <Node title="Supabase" subtitle="Auth, Postgres, Storage" tone="sage" />
          <Connector />
          <Node title="Custom GPT" subtitle="Styling + visualization" tone="blue" />
        </div>
      </section>

      <section className={styles.page}>
        <PageHeader number="01" title="The Product Boundary" />
        <div className={styles.twoColumn}>
          <article className={styles.editorial}>
            <p>
              WardrobeOS is deliberately split into two surfaces. The web app is the system of record: accounts, closet
              uploads, metadata, saved outfits, preferences, and operational workflows. The Custom GPT is the creative
              companion: conversation, outfit planning, and visual styling.
            </p>
            <p>
              This separation keeps the app practical and affordable. Durable data stays in WardrobeOS. Expensive creative
              image generation happens in ChatGPT, using the user&apos;s own ChatGPT plan.
            </p>
          </article>
          <aside className={styles.pullQuote}>
            “The system of record stays boring. The styling surface gets expressive.”
          </aside>
        </div>
        <div className={styles.splitCards}>
          <BoundaryCard title="WardrobeOS Web App" items={["Login and profile", "Single and bulk upload", "AI tag review", "Closet management", "Outfits, packing, insights"]} />
          <BoundaryCard title="Custom GPT" items={["Reads closet via OAuth", "Conversational styling", "Outfit ideation", "Visualization briefs", "ChatGPT image generation"]} />
        </div>
      </section>

      <section className={styles.page}>
        <PageHeader number="02" title="Frontend And Experience" />
        <div className={styles.heroBand}>
          <div>
            <h2>A fast wardrobe cockpit</h2>
            <p>
              The frontend uses Next.js App Router with a PWA-friendly shell. It is optimized for capture, review, and
              decision-making rather than generic inventory management.
            </p>
          </div>
          <div className={styles.phoneMock}>
            <div />
            <span>Capture</span>
            <span>Tag</span>
            <span>Review</span>
            <span>Wear</span>
          </div>
        </div>
        <div className={styles.featureGrid}>
          {[
            ["Dashboard", "Wear logging, recent activity, quick closet health signals."],
            ["Closet", "Search, filter, list/grid views, item detail and archival."],
            ["Bulk Upload", "Upload up to 50 photos, apply AI tags, review before save."],
            ["Outfit Lab", "Explainable suggestions scored by color, occasion, weather, and rotation."],
            ["Buy Next", "Simulates the next purchase that unlocks the most outfits."],
            ["PWA", "iPhone install path for quick photo capture and email-code login."]
          ].map(([title, copy]) => (
            <MiniFeature key={title} title={title} copy={copy} />
          ))}
        </div>
      </section>

      <section className={styles.page}>
        <PageHeader number="03" title="Backend, Data, And Storage" />
        <div className={styles.stackGrid}>
          {stackCards.map(([title, copy]) => (
            <div key={title} className={styles.stackCard}>
              <span>{title}</span>
              <p>{copy}</p>
            </div>
          ))}
        </div>
        <div className={styles.tableBlock}>
          <h2>Route handlers as the server boundary</h2>
          {apiRows.map(([route, copy]) => (
            <div key={route} className={styles.apiRow}>
              <code>{route}</code>
              <p>{copy}</p>
            </div>
          ))}
        </div>
        <div className={styles.schemaStrip}>
          {["profiles", "closets", "items", "item_images", "saved_outfits", "gpt_oauth_tokens"].map((table) => (
            <span key={table}>{table}</span>
          ))}
        </div>
      </section>

      <section className={styles.page}>
        <PageHeader number="04" title="Deterministic Intelligence" />
        <div className={styles.twoColumn}>
          <article className={styles.editorial}>
            <p>
              The recommendation engine is intentionally deterministic. Color, occasion, season, weather, formality, and
              rotation logic live in pure domain modules. That makes every recommendation explainable and testable.
            </p>
            <p>
              AI is invited into the workflow only where it helps: reading item photos, producing practical tags, and
              helping ChatGPT communicate styling ideas. It is not the ranking source of truth.
            </p>
          </article>
          <div className={styles.scoreWheel}>
            {["Color", "Occasion", "Weather", "Formality", "Rotation"].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
        <div className={styles.callout}>
          <strong>Design principle:</strong> AI suggestions are reviewed. Scoring rules are inspectable. User data remains
          structured.
        </div>
      </section>

      <section className={styles.page}>
        <PageHeader number="05" title="AI Tagging And Bulk Intake" />
        <div className={styles.pipeline}>
          {["Upload", "Compress", "Estimate color", "Gemini tags", "Review", "Save"].map((step, index) => (
            <div key={step} className={styles.pipelineStep}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <span>{step}</span>
            </div>
          ))}
        </div>
        <div className={styles.twoColumn}>
          <article className={styles.editorial}>
            <p>
              The model currently used for tagging is Gemini 3.1 Flash Lite Preview. It was chosen after direct comparison
              testing because bulk tagging quality held up while latency and free-tier fit improved.
            </p>
            <p>
              The bulk flow is the data-collection wedge: many item photos can be processed at once, but users keep final
              control through a review queue.
            </p>
          </article>
          <aside className={styles.metricCard}>
            <span>Bulk intake target</span>
            <strong>50 photos</strong>
            <small>Upload, tag, correct, save.</small>
          </aside>
        </div>
      </section>

      <section className={styles.page}>
        <PageHeader number="06" title="ChatGPT Companion" />
        <div className={styles.oauthDiagram}>
          <Node title="ChatGPT" subtitle="Custom GPT" tone="blue" />
          <Connector />
          <Node title="WardrobeOS OAuth" subtitle="Authorize + token" tone="gold" />
          <Connector />
          <Node title="GPT Actions" subtitle="Read closet safely" tone="ink" />
          <Connector />
          <Node title="Visualization" subtitle="User's ChatGPT plan" tone="sage" />
        </div>
        <div className={styles.actionCloud}>
          {gptActions.map((action) => (
            <code key={action}>{action}</code>
          ))}
        </div>
        <div className={styles.callout}>
          ChatGPT receives a WardrobeOS-scoped bearer token, not Supabase credentials. Refresh tokens are hashed in
          Supabase. Full-body photos are uploaded directly to ChatGPT for visualization, not stored by WardrobeOS.
        </div>
      </section>

      <section className={styles.page}>
        <PageHeader number="07" title="Deployment And Quality" />
        <div className={styles.deploymentGrid}>
          <div className={styles.deployCard}>
            <h2>Production</h2>
            <p>Vercel hosts the Next.js app, route handlers, PWA assets, and GPT OpenAPI schema.</p>
          </div>
          <div className={styles.deployCard}>
            <h2>Data Plane</h2>
            <p>Supabase owns Auth, Postgres, RLS, and item image storage.</p>
          </div>
          <div className={styles.deployCard}>
            <h2>AI Services</h2>
            <p>Gemini handles reviewed tagging. ChatGPT handles companion conversation and image visualization.</p>
          </div>
        </div>
        <div className={styles.testRibbon}>
          <span>Lint</span>
          <span>Typecheck</span>
          <span>Unit Tests</span>
          <span>Build</span>
          <span>Playwright</span>
        </div>
        <p className={styles.endNote}>
          The architecture creates room for better data capture, better wardrobe intelligence, and richer AI styling while
          keeping WardrobeOS focused on structured closet truth.
        </p>
      </section>
    </main>
  );
}

function PageHeader({ number, title }: { number: string; title: string }) {
  return (
    <header className={styles.pageHeader}>
      <span>{number}</span>
      <h2>{title}</h2>
    </header>
  );
}

function Node({ title, subtitle, tone }: { title: string; subtitle?: string; tone: "gold" | "ink" | "sage" | "blue" }) {
  return (
    <div className={`${styles.node} ${styles[tone]}`}>
      <strong>{title}</strong>
      {subtitle ? <small>{subtitle}</small> : null}
    </div>
  );
}

function Connector() {
  return <div className={styles.connector} />;
}

function BoundaryCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={styles.boundaryCard}>
      <h3>{title}</h3>
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}

function MiniFeature({ title, copy }: { title: string; copy: string }) {
  return (
    <div className={styles.miniFeature}>
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  );
}
