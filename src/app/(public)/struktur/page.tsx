import type { Metadata } from "next";
import { Info } from "lucide-react";
import Image from "next/image";

import { siteUrl } from "@/core/seo/site";
import { getActivePublicStructure } from "@/features/public/public-structure";
import { webConfigQueries } from "@/features/web-config/queries";
import { DepartmentGrid, type DepartmentData } from "./department-grid";
import type { StrukturCardMember } from "./struktur-card";
import { PublicBreadcrumb } from "../_components/public-breadcrumb";

export const metadata: Metadata = {
  title: "Struktur Pengurus",
  description:
    "Struktur pengurus aktif IKMI Cirebon berdasarkan periode, jabatan, dan unit organisasi.",
  alternates: { canonical: "/struktur" },
  openGraph: {
    title: "Struktur Pengurus IKMI Cirebon",
    description:
      "Kenali pengurus aktif IKMI Cirebon beserta jabatan dan unit organisasinya.",
    url: `${siteUrl}/struktur`,
    type: "website",
  },
};

type UnknownRecord = Record<string, unknown>;

type StructureGroup = {
  id: string;
  code: string;
  name: string;
  description: string;
  unitType: string;
  photoUrl: string | null;
  members: StrukturCardMember[];
};

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as UnknownRecord;
}

function readString(
  record: UnknownRecord | null,
  keys: readonly string[],
): string | null {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

function readMediaUrl(
  record: UnknownRecord | null,
  keys: readonly string[],
): string | null {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) return value.trim();

    const nested = asRecord(value);
    const nestedUrl = readString(nested, ["url", "src", "imageUrl", "fileUrl"]);

    if (nestedUrl) return nestedUrl;
  }

  return null;
}

export default async function PengurusPage() {
  const [structure, webConfig] = await Promise.all([
    getActivePublicStructure(),
    webConfigQueries.getMergedWebConfig(),
  ]);

  const { period, assignments } = structure;
  const webConfigRecord = asRecord(webConfig);
  const structurePageConfig =
    asRecord(webConfigRecord?.structure_page_extended) ??
    asRecord(webConfigRecord?.structure_page) ??
    asRecord(webConfigRecord?.organization_structure_page);
  const configuredDepartmentPhotos =
    asRecord(structurePageConfig?.departmentPhotos) ??
    asRecord(structurePageConfig?.department_photos);

  const groups = assignments.reduce<StructureGroup[]>((result, assignment) => {
    const departmentRecord = asRecord(assignment.department);
    const personRecord = asRecord(assignment.person);

    let current = result.find((group) => group.id === assignment.department.id);

    const member: StrukturCardMember = {
      id: assignment.id,
      name: assignment.person.name,
      photoUrl:
        readMediaUrl(personRecord, [
          "photoUrl",
          "avatarUrl",
          "imageUrl",
          "photo",
        ]) ?? assignment.person.photoUrl,
      positionName: assignment.position.name,
      unitName: assignment.department.name,
    };

    if (!current) {
      current = {
        id: assignment.department.id,
        code:
          readString(departmentRecord, ["code", "slug", "shortName"]) ??
          assignment.department.unitType,
        name: assignment.department.name,
        description:
          assignment.department.description?.trim() ??
          "Unit organisasi yang menjalankan bidang kerja dan program IKMI Cirebon.",
        unitType: assignment.department.unitType,
        photoUrl: readMediaUrl(departmentRecord, [
          "groupPhotoUrl",
          "photoUrl",
          "imageUrl",
          "coverUrl",
          "featuredImageUrl",
          "photo",
          "image",
        ]),
        members: [],
      };

      result.push(current);
    }

    current.members.push(member);

    return result;
  }, []);

  // getActivePublicStructure already applies the database-backed unit,
  // position, and assignment ordering. Keep that order instead of deriving a
  // second hierarchy from labels in the public page.
  const sortedGroups = groups.map((group) => ({
    ...group,
    photoUrl:
      group.photoUrl ??
      readMediaUrl(configuredDepartmentPhotos, [
        group.id,
        group.code,
        group.name,
      ]) ??
      null,
  }));

  const bph =
    sortedGroups.find((group) => group.unitType === "BPH") ?? null;

  const departments = sortedGroups.filter((group) => group.id !== bph?.id);

  const toDepartmentData = (group: StructureGroup): DepartmentData => ({
    id: group.id,
    code: group.code,
    name: group.name,
    description: group.description,
    memberCount: group.members.length,
    photoUrl: group.photoUrl,
    users: group.members,
  });

  const leadDepartment = bph ? toDepartmentData(bph) : null;
  const departmentData = departments.map(toDepartmentData);
  const totalOfficerCount = sortedGroups.reduce(
    (total, group) => total + group.members.length,
    0,
  );

  const heroImage =
    readMediaUrl(structurePageConfig, [
      "heroImageUrl",
      "heroImage",
      "coverImageUrl",
      "coverImage",
      "bannerImageUrl",
      "bannerImage",
    ]) ??
    bph?.photoUrl ??
    "https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210005/BPHU_rkqdtg.png";

  return (
    <main className="structure-page public-page-root">
      <header className="structure-hero">
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="structure-hero-image"
            aria-hidden="true"
          />
        ) : null}

        <div className="structure-hero-overlay" aria-hidden="true" />

        <div className="public-container structure-hero-inner">
          <PublicBreadcrumb
            tone="inverse"
            className="structure-breadcrumb"
            items={[
              { label: "Tentang", href: "/tentang" },
              { label: "Struktur Pengurus" },
            ]}
          />

          <div className="structure-hero-layout">
            <div className="structure-hero-copy">
              <h1>Struktur Pengurus</h1>
              <p>
                Kenali orang-orang di balik gerak IKMI Se-Wilayah Cirebon. Klik
                setiap divisi untuk melihat detail pengurus.
              </p>

              <aside className="structure-hint" aria-label="Petunjuk interaksi">
                <span className="structure-hint-icon" aria-hidden="true">
                  <Info />
                </span>
                <span className="structure-hint-copy">
                  <strong>Lihat detail setiap divisi</strong>
                  <span>
                    Pilih foto divisi untuk membuka susunan pengurusnya.
                  </span>
                </span>
              </aside>
            </div>

            <dl
              className="structure-summary"
              aria-label="Ringkasan kepengurusan aktif"
            >
              <div className="structure-summary-item structure-summary-item--period">
                <dt>Periode</dt>
                <dd>{period?.name ?? "Belum ditetapkan"}</dd>
              </div>
              <div className="structure-summary-item">
                <dt>Jumlah Unit</dt>
                <dd>{sortedGroups.length}</dd>
              </div>
              <div className="structure-summary-item">
                <dt>Jumlah Pengurus</dt>
                <dd>{totalOfficerCount}</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      <section
        className="structure-content"
        aria-label="Bagan struktur pengurus IKMI Cirebon"
      >
        <div className="public-container structure-stage">
          {sortedGroups.length > 0 ? (
            <DepartmentGrid
              leadDepartment={leadDepartment}
              departments={departmentData}
            />
          ) : (
            <div className="structure-empty" role="status">
              <h2>Struktur belum dipublikasikan</h2>
              <p>Data pengurus untuk periode aktif belum tersedia.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
