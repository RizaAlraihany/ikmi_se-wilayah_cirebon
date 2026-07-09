import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  Eye,
  HandHeart,
  Heart,
  Lightbulb,
  MapPin,
  Sparkles,
  Target,
  Zap,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/core/database/prisma";
import { KabinetSlider } from "./_components/kabinet-slider";
import { HeroSlideshow } from "./_components/hero-slideshow";
import { ScrollReveal } from "./_components/scroll-reveal";
import { defaultWebConfig } from "@/features/web-config/default-config";
import { postQueries } from "@/features/blog/queries";

export const dynamic = "force-dynamic";

const pillarIcons = [Brain, Users, Lightbulb, HandHeart];

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, "").trim();
}

const publicPositionDepartmentNames: Record<string, string> = {
  HPM: "HPM",
  KAJ: "Kajian & Advokasi",
  KOMDIGI: "Komdigi",
  PSDA: "PSDA",
  EKRAF: "Ekotif",
};

const structureDepartmentOrder = [
  "KAD",
  "KAJ",
  "PSDA",
  "EKRAF",
  "KOMDIGI",
  "HPM",
];

const structurePositionOrder = new Map([
  ["ketum", 0],
  ["waketum", 1],
  ["sekum_1", 2],
  ["sekum_2", 3],
  ["bendum_1", 4],
  ["bendum_2", 5],
]);

function publicPositionName(user: {
  position?: {
    id: string;
    name: string;
    department?: { code: string; name: string } | null;
  } | null;
}) {
  const departmentCode = user.position?.department?.code;
  const departmentName = departmentCode
    ? publicPositionDepartmentNames[departmentCode]
    : undefined;

  if (!departmentName || !user.position)
    return user.position?.name || "Pengurus";

  if (user.position.id.startsWith("kadep_"))
    return `Ketua Departemen ${departmentName}`;
  if (user.position.id.startsWith("sekdep_"))
    return `Sekretaris Departemen ${departmentName}`;
  if (user.position.id.startsWith("anggota_"))
    return `Anggota Departemen ${departmentName}`;

  return user.position.name || "Pengurus";
}

function publicStructureSortValue(user: {
  position?: {
    id: string;
    department?: { code: string; name: string } | null;
  } | null;
}) {
  const bphOrder = user.position?.id
    ? structurePositionOrder.get(user.position.id)
    : undefined;
  if (bphOrder !== undefined) return bphOrder;

  const departmentCode = user.position?.department?.code ?? "";
  const departmentIndex = structureDepartmentOrder.indexOf(departmentCode);
  const normalizedDepartmentIndex =
    departmentIndex === -1 ? structureDepartmentOrder.length : departmentIndex;
  let roleIndex = 2;
  if (user.position?.id?.startsWith("kadep_")) roleIndex = 0;
  else if (user.position?.id?.startsWith("sekdep_")) roleIndex = 1;

  return 10 + normalizedDepartmentIndex * 10 + roleIndex;
}

export default async function Home() {
  const usersWithPositions = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      positionId: { not: null },
    },
    include: { position: { include: { department: true } } },
    orderBy: { createdAt: "asc" },
  });

  const sortedUsersWithPositions = usersWithPositions.sort((a, b) => {
    const orderA = publicStructureSortValue(a);
    const orderB = publicStructureSortValue(b);
    if (orderA !== orderB) return orderA - orderB;
    return (a.position?.name || "").localeCompare(
      b.position?.name || "",
      "id-ID",
    );
  });

  const kabinet = sortedUsersWithPositions.map((user) => {
    const names = user.name.split(" ");
    const initials =
      names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0].slice(0, 2).toUpperCase();

    return {
      id: user.id,
      nama: user.name,
      jabatan: publicPositionName(user),
      kampus: "IKMI Cirebon",
      initials,
      photoUrl: user.photoUrl,
    };
  });

  const events = await prisma.event.findMany({
    where: { status: "UPCOMING", deletedAt: null },
    orderBy: { startDate: "asc" },
    take: 4,
  });

  const programs = await prisma.program.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const posts = await postQueries.getPublishedPosts(3);

  const configKeys = [
    "landing_hero",
    "landing_about",
    "landing_sections",
    "landing_cta",
  ] as const;
  type HomeConfigKey = (typeof configKeys)[number];
  const webConfigs = await prisma.webConfig.findMany({
    where: { key: { in: [...configKeys] }, deletedAt: null },
  });

  const getConfig = <K extends HomeConfigKey>(
    key: K,
  ): (typeof defaultWebConfig)[K] => {
    const config = webConfigs.find((item) => item.key === key);
    if (!config) return defaultWebConfig[key];
    try {
      return { ...defaultWebConfig[key], ...JSON.parse(config.valueJson) };
    } catch {
      return defaultWebConfig[key];
    }
  };

  const heroConfig = getConfig("landing_hero");
  const aboutConfig = getConfig("landing_about");
  const sectionsConfig = getConfig("landing_sections");
  const ctaConfig = getConfig("landing_cta");
  const [heroLead, heroRest] = heroConfig.title.split(",");

  return (
    <main className="text-primary" id="beranda">
      {/* Scroll reveal aktivator */}
      <ScrollReveal />

      {/* ==========================================
          HERO — Slideshow background + overlay
          ========================================== */}
      <HeroSlideshow
        slides={heroConfig.slides}
        departmentLogos={heroConfig.departmentLogos}
      >
        <div className="grid grid-cols-1 items-center gap-7 md:gap-12 lg:grid-cols-2">
          {/* Kiri: Teks & CTA */}
          <div className="space-y-4 md:space-y-6">
            {/* Eyebrow */}
            <span className="hero-eyebrow-animate inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white ring-1 ring-white/18 md:min-h-9 md:gap-2 md:px-4 md:py-1.5 md:text-xs">
              <Sparkles
                className="h-3 w-3 md:h-3.5 md:w-3.5"
                aria-hidden="true"
              />
              {heroConfig.eyebrow}
            </span>

            {/* Title */}
            <h1
              id="hero-heading"
              className="hero-title-animate font-heading max-w-3xl text-[1.75rem] font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              {heroRest ? (
                <>
                  {heroLead},{" "}
                  <span style={{ color: "rgba(255,255,255,0.72)" }}>
                    {heroRest.trim()}
                  </span>
                </>
              ) : (
                heroConfig.title
              )}
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle-animate max-w-2xl text-sm font-medium leading-6 text-white/80 md:text-lg md:leading-8">
              {heroConfig.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="hero-cta-animate flex flex-col gap-2.5 sm:flex-row md:gap-3">
              <ButtonLink
                href={heroConfig.primaryCtaHref}
                className="btn-micro min-h-10 bg-white px-4 text-sm font-bold text-primary shadow-lg hover:bg-white/95 md:min-h-11 md:px-5"
              >
                {heroConfig.primaryCtaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink
                href={heroConfig.secondaryCtaHref}
                variant="outline"
                className="btn-micro min-h-10 border border-white/28 bg-white/10 px-4 text-sm font-semibold text-white ring-0 hover:bg-white/18 md:min-h-11 md:px-5"
              >
                {heroConfig.secondaryCtaLabel}
              </ButtonLink>
            </div>
          </div>

          {/* Kanan: GBH — Garis Besar Haluan (glass card) */}
          <div className="hero-cta-animate w-full rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/16 backdrop-blur-sm md:p-6 lg:justify-self-end lg:max-w-md">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-white/60 md:mb-4 md:text-[11px]">
              {heroConfig.pillarsLabel}
            </p>
            <div
              className="grid grid-cols-2 gap-2.5 md:gap-4"
              id="pilar-heading"
              aria-label="4 Pilar IKMI"
            >
              {heroConfig.pillars.map((pillar, index) => {
                const Icon = pillarIcons[index % pillarIcons.length];
                return (
                  <div
                    key={pillar.title}
                    className="group flex flex-col gap-2 rounded-xl bg-white/10 p-3 ring-1 ring-white/12 transition-all duration-200 hover:bg-white/18 hover:ring-white/24 md:gap-3 md:rounded-[14px] md:p-4"
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-[10px] text-white/90 md:h-10 md:w-10"
                      style={{ background: "rgba(255,255,255,0.12)" }}
                    >
                      <Icon
                        className="h-4 w-4 md:h-5 md:w-5"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="font-heading text-xs font-bold text-white md:text-sm">
                        {pillar.title}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-[1.35] text-white/60 md:mt-1 md:text-xs md:leading-[1.4]">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </HeroSlideshow>

      {/* ==========================================
          TENTANG KAMI
          ========================================== */}
      <section
        id="tentang"
        className="bg-background px-4 py-8 sm:px-6 md:py-16 lg:px-8"
        aria-labelledby="tentang-heading"
      >
        <div className="mx-auto grid max-w-[1200px] items-center gap-6 md:gap-12 lg:grid-cols-2">
          {/* Logo dengan float animation */}
          <div
            className="relative flex aspect-[5/3] items-center justify-center overflow-hidden rounded-2xl bg-surface-alt ring-1 ring-border md:aspect-[4/3]"
            data-reveal="left"
            aria-hidden="true"
          >
            <Image
              src={sectionsConfig.aboutImageUrl}
              alt={sectionsConfig.aboutImageAlt}
              width={150}
              height={150}
              className="logo-float w-[130px] opacity-90 md:w-[180px]"
            />
            <span className="absolute bottom-3 right-3 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-white shadow-md md:bottom-5 md:right-5 md:px-4 md:py-2 md:text-xs">
              {sectionsConfig.aboutBadgeLabel}
            </span>
          </div>

          {/* Teks */}
          <div className="space-y-4 md:space-y-6" data-reveal="right">
            <div className="space-y-1.5 md:space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent md:text-xs">
                {sectionsConfig.aboutEyebrow}
              </p>
              <h2
                id="tentang-heading"
                className="font-heading text-xl font-extrabold leading-tight tracking-tight text-primary sm:text-3xl md:text-4xl lg:text-5xl"
                style={{ letterSpacing: "-0.01em" }}
              >
                {aboutConfig.title}
              </h2>
            </div>

            <p className="text-sm leading-6 text-text-secondary md:text-base md:leading-8">
              {aboutConfig.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {aboutConfig.badges.map((badge: string, index: number) => {
                const Icon =
                  index === 0 ? Heart : index === 1 ? BookOpen : Sparkles;
                return (
                  <span
                    key={badge}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-border md:min-h-10 md:gap-2 md:px-4 md:py-2 md:text-sm"
                  >
                    <Icon
                      className="h-3.5 w-3.5 text-accent md:h-4 md:w-4"
                      aria-hidden="true"
                    />
                    {badge}
                  </span>
                );
              })}
            </div>

            {/* CTA dengan underline animasi */}
            <Link
              href="/tentang-kami"
              className="link-underline group inline-flex items-center gap-1 text-xs font-bold text-accent transition-colors hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:text-sm"
            >
              <span>{sectionsConfig.aboutLinkLabel}</span>
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ==========================================
          PENGURUS — 5-layer center-focus slider
          ========================================== */}
      <section
        id="struktur"
        className="public-section-alt px-4 py-8 sm:px-6 md:py-14 lg:px-8"
        aria-labelledby="kabinet-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          <div
            className="mb-5 flex flex-col gap-3 md:mb-7 md:flex-row md:items-end md:justify-between md:gap-4"
            data-reveal
          >
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent md:text-xs">
                {sectionsConfig.structureEyebrow}
              </p>
              <h2
                id="kabinet-heading"
                className="font-heading text-lg font-extrabold tracking-tight text-primary sm:text-2xl md:text-3xl"
              >
                {sectionsConfig.structureTitle}{" "}
                <span className="text-accent">
                  {sectionsConfig.structureAccent}
                </span>
              </h2>
            </div>
            <ButtonLink
              href="/struktur"
              variant="secondary"
              className="btn-micro min-h-10 px-4 text-xs md:min-h-11 md:text-sm"
            >
              {sectionsConfig.structureButtonLabel}
            </ButtonLink>
          </div>

          <KabinetSlider kabinet={kabinet} />
        </div>
      </section>

      {/* ==========================================
          AGENDA / EVENT
          ========================================== */}
      <section
        id="agenda"
        className="public-section-from-alt px-4 py-8 sm:px-6 md:py-14 lg:px-8"
        aria-labelledby="agenda-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          <div
            className="mb-6 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-4"
            data-reveal
          >
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent md:text-xs">
                {sectionsConfig.agendaEyebrow}
              </p>
              <h2
                id="agenda-heading"
                className="font-heading text-xl font-extrabold tracking-tight text-primary sm:text-3xl md:text-4xl"
              >
                {sectionsConfig.agendaTitle}
              </h2>
              <p className="max-w-xl text-sm leading-6 text-text-secondary md:text-base md:leading-7">
                {sectionsConfig.agendaDescription}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-2" data-stagger>
            <article className="flex flex-col rounded-2xl bg-surface p-4 ring-1 ring-border transition-colors hover:ring-accent/30 md:rounded-3xl md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4 md:mb-6 md:pb-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="font-heading text-base font-extrabold text-primary md:text-lg">
                    Agenda Terdekat IKMI
                  </h3>
                </div>
                <Badge
                  tone="surface"
                  className="bg-surface-alt text-accent ring-0"
                >
                  {sectionsConfig.agendaStatusLabel}
                </Badge>
              </div>

              <div className="space-y-4">
                {events.length > 0 ? (
                  events.slice(0, 2).map((agenda) => {
                    const date = new Date(agenda.startDate);
                    const day = date.getDate();
                    const month = date.toLocaleDateString("id-ID", {
                      month: "short",
                    });

                    return (
                      <Link
                        key={agenda.id}
                        href={`/event/${agenda.id}`}
                        className="group grid grid-cols-[70px_minmax(0,1fr)] gap-4 rounded-2xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:grid-cols-[74px_minmax(0,1fr)]"
                      >
                        <time
                          dateTime={agenda.startDate.toISOString()}
                          className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-surface-alt text-center ring-1 ring-border md:h-[70px] md:w-[70px]"
                        >
                          <span className="font-heading text-lg font-extrabold text-accent md:text-xl">
                            {day}
                          </span>
                          <span className="text-[10px] font-semibold uppercase text-text-muted">
                            {month}
                          </span>
                        </time>
                        <div className="min-w-0 py-1">
                          <h3 className="line-clamp-1 font-heading text-sm font-extrabold leading-snug text-primary transition-colors group-hover:text-accent md:text-base">
                            {agenda.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary md:text-sm md:leading-6">
                            {stripHtml(agenda.description)}
                          </p>
                          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-text-muted md:text-xs">
                            <MapPin
                              className="h-3.5 w-3.5 flex-shrink-0 text-accent"
                              aria-hidden="true"
                            />
                            <span className="truncate">{agenda.location}</span>
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="rounded-2xl bg-surface-alt p-4 text-sm italic text-text-secondary">
                    {sectionsConfig.agendaEmptyText}
                  </p>
                )}
              </div>
              <div className="mt-auto border-t border-border pt-5">
                <Link
                  href="/event"
                  className="group inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-[0.08em] text-accent transition-colors hover:text-secondary"
                >
                  <span>Lihat Detail Agenda</span>
                  <span
                    className="transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1"
                    aria-hidden="true"
                  >
                    -&gt;
                  </span>
                </Link>
              </div>
            </article>

            <article className="flex flex-col rounded-2xl bg-surface p-4 ring-1 ring-border transition-colors hover:ring-accent/30 md:rounded-3xl md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4 md:mb-6 md:pb-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Zap className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h2 className="font-heading text-base font-extrabold text-primary md:text-lg">
                    Program Kerja Unggulan
                  </h2>
                </div>
                <Badge tone="success">Aktif</Badge>
              </div>

              <div className="space-y-4">
                {programs.length > 0 ? (
                  programs.slice(0, 2).map((program) => (
                    <div
                      key={program.id}
                      className="border-l-2 border-accent py-1 pl-4"
                    >
                      <h3 className="line-clamp-1 font-heading text-sm font-extrabold leading-snug text-primary md:text-base">
                        {program.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary md:text-sm md:leading-6">
                        {program.description ||
                          "Deskripsi program kerja belum tersedia."}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-surface-alt p-4 text-sm italic text-text-secondary">
                    Belum ada program kerja terdaftar.
                  </p>
                )}
              </div>
              <div className="mt-auto border-t border-border pt-5">
                <Link
                  href="/event"
                  className="group inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-[0.08em] text-accent transition-colors hover:text-secondary"
                >
                  <span>Lihat Detail Program Kerja</span>
                  <span
                    className="transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1"
                    aria-hidden="true"
                  >
                    -&gt;
                  </span>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ==========================================
          BLOG / ARTIKEL
          ========================================== */}
      <section
        id="blog"
        className="public-section-alt px-4 py-8 sm:px-6 md:py-14 lg:px-8"
        aria-labelledby="blog-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          <div
            className="mb-6 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-4"
            data-reveal
          >
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent md:text-xs">
                {sectionsConfig.blogEyebrow}
              </p>
              <h2
                id="blog-heading"
                className="font-heading text-xl font-extrabold tracking-tight text-primary sm:text-3xl md:text-4xl"
              >
                {sectionsConfig.blogTitle}
              </h2>
            </div>
            <ButtonLink
              href="/blog"
              variant="secondary"
              className="btn-micro min-h-10 px-4 text-xs md:min-h-11 md:text-sm"
            >
              {sectionsConfig.blogButtonLabel}
            </ButtonLink>
          </div>

          <div className="grid gap-4 md:grid-cols-3 md:gap-6" data-stagger>
            {posts.length > 0 ? (
              posts.map((post) => {
                const dateStr = post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Belum dipublikasi";
                const excerpt =
                  post.excerpt || post.content.replace(/<[^>]+>/g, "");
                const authorName = post.author?.name ?? "IKMI Cirebon";

                return (
                  <article
                    key={post.id}
                    className="group overflow-hidden rounded-2xl bg-surface ring-1 ring-border transition-colors hover:ring-accent/30"
                  >
                    <div className="relative overflow-hidden">
                      {post.thumbnailUrl ? (
                        <div className="relative aspect-[16/9] w-full bg-surface-alt">
                          <Image
                            src={post.thumbnailUrl}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[16/9] items-center justify-center bg-surface-alt transition-transform duration-500 group-hover:scale-[1.02]">
                          <BookOpen
                            className="h-10 w-10 text-accent"
                            aria-hidden="true"
                          />
                        </div>
                      )}
                      <span className="absolute left-4 top-4 rounded-md bg-primary px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-surface">
                        {post.category.name}
                      </span>
                    </div>

                    <div className="flex min-h-[238px] flex-col p-4 md:p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-text-muted">
                        <span>{dateStr}</span>
                        <span className="text-border">&bull;</span>
                        <span>Oleh: {authorName}</span>
                      </div>

                      <Link href={`/blog/${post.slug}`}>
                        <h3 className="font-heading line-clamp-2 text-base font-extrabold leading-snug text-primary transition-colors hover:text-accent">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-secondary">
                        {excerpt}
                      </p>

                      <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs font-semibold">
                        <span className="inline-flex items-center gap-1.5 text-accent">
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />0
                          Views
                        </span>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="group inline-flex items-center gap-1 text-accent transition-colors hover:text-secondary"
                        >
                          <span>Selengkapnya</span>
                          <span
                            className="transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1"
                            aria-hidden="true"
                          >
                            -&gt;
                          </span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="col-span-3 rounded-2xl bg-surface p-5 text-sm italic text-text-secondary ring-1 ring-border">
                {sectionsConfig.blogEmptyText}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ==========================================
          CTA — mesh gradient background
          ========================================== */}
      <section
        className="public-cta public-cta-from-alt px-4 pb-12 pt-16 sm:px-6 md:pb-16 md:pt-[4.5rem] lg:px-8"
        aria-labelledby="cta-heading"
      >
        <div
          className="relative mx-auto max-w-[1200px] text-center"
          data-reveal="scale"
        >
          <div className="mb-3 flex justify-center md:mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/80 ring-1 ring-white/20 md:gap-2 md:px-4 md:text-xs">
              <Target
                className="h-3 w-3 md:h-3.5 md:w-3.5"
                aria-hidden="true"
              />
              {sectionsConfig.ctaEyebrow}
            </span>
          </div>
          <h2
            id="cta-heading"
            className="font-heading text-xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl"
            style={{ letterSpacing: "-0.02em" }}
          >
            {ctaConfig.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/72 md:mt-4 md:text-lg md:leading-7">
            {ctaConfig.description}
          </p>
          <ButtonLink
            href={sectionsConfig.ctaButtonHref}
            className="btn-micro mt-6 min-h-10 bg-white px-6 text-sm font-bold text-primary shadow-[var(--shadow-float)] hover:bg-white/95 md:mt-8 md:min-h-11 md:px-8"
          >
            {sectionsConfig.ctaButtonLabel}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
