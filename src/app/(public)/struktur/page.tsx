import type { Metadata } from "next";
import { Info } from "lucide-react";

import { siteUrl } from "@/core/seo/site";
import { getActivePublicStructure } from "@/features/public/public-structure";
import { webConfigQueries } from "@/features/web-config/queries";
import { DepartmentGrid, type DepartmentData } from "./department-grid";
import type { StrukturCardMember } from "./struktur-card";
import { GlobalPageHeader } from "../_components/global-page-header";

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

const LOGO_KABINET_URL =
  "https://res.cloudinary.com/fvggnar7/image/upload/v1787039115/logo_Kabinet.png";
const LOGO_IKMI_URL =
  "https://res.cloudinary.com/fvggnar7/image/upload/v1787039032/logo_ikmi.png";

const DEPARTMENT_LOGO_ENTRIES = [
  {
    aliases: ["bph", "badanpengurusharian"],
    url: "https://res.cloudinary.com/fvggnar7/image/upload/v1787039032/logo_bph.png",
  },
  {
    aliases: ["kaderisasi"],
    url: "https://res.cloudinary.com/fvggnar7/image/upload/v1787039034/logo_kaderisasi.png",
  },
  {
    aliases: ["kajian", "keilmuan"],
    url: "https://res.cloudinary.com/fvggnar7/image/upload/v1787039032/logo_kajian.png",
  },
  {
    aliases: ["psda", "pengembangansumberdaya"],
    url: "https://res.cloudinary.com/fvggnar7/image/upload/v1787039033/logo_psda.png",
  },
  {
    aliases: ["ekotif", "ekonomikreatif", "ekonomidankewirausahaan"],
    url: "https://res.cloudinary.com/fvggnar7/image/upload/v1787039032/logo_ekotif.png",
  },
  {
    aliases: ["komdigi", "komunikasidigital", "komunikasidanmedia"],
    url: "https://res.cloudinary.com/fvggnar7/image/upload/v1787039033/logo_komdigi.png",
  },
  {
    aliases: ["hpm"],
    url: "https://res.cloudinary.com/fvggnar7/image/upload/v1787039032/logo_hpm.png",
  },
] as const;

function normalizeUnitKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getDepartmentLogo(group: StructureGroup) {
  const values = [group.code, group.name, group.id, group.unitType].map(normalizeUnitKey);
  return DEPARTMENT_LOGO_ENTRIES.find(({ aliases }) =>
    aliases.some((alias) => values.some((value) => value === alias || value.includes(alias))),
  )?.url ?? null;
}

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
      getDepartmentLogo(group) ??
      group.photoUrl ??
      readMediaUrl(configuredDepartmentPhotos, [
        group.id,
        group.code,
        group.name,
      ]) ??
      LOGO_IKMI_URL,
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
    LOGO_KABINET_URL;

  return (
    <main className="structure-page public-page-root">
      <GlobalPageHeader
        className="structure-page-header"
        items={[{ label: "Tentang", href: "/tentang" }, { label: "Struktur Pengurus" }]}
        title="Struktur Pengurus"
        description="Kenali orang-orang di balik gerak IKMI Se-Wilayah Cirebon. Klik setiap divisi untuk melihat detail pengurus."
        image={heroImage}
        aside={
          <dl className="structure-summary" aria-label="Ringkasan kepengurusan aktif">
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
        }
      >
        <aside className="structure-hint" aria-label="Petunjuk interaksi">
          <span className="structure-hint-icon" aria-hidden="true"><Info /></span>
          <span className="structure-hint-copy">
            <strong>Lihat detail setiap divisi</strong>
            <span>Pilih foto divisi untuk membuka susunan pengurusnya.</span>
          </span>
        </aside>
      </GlobalPageHeader>

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
