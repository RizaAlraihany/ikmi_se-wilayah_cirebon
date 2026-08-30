"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ImageIcon, X } from "lucide-react";
import Image from "next/image";

import { StrukturCard, type StrukturCardMember } from "./struktur-card";

export type DepartmentData = {
  id: string;
  code: string;
  name: string;
  description: string;
  memberCount: number;
  photoUrl?: string | null;
  users: StrukturCardMember[];
};

type DepartmentGridProps = {
  leadDepartment: DepartmentData | null;
  departments: DepartmentData[];
};

function DepartmentImage({
  department,
  priority = false,
}: {
  department: DepartmentData;
  priority?: boolean;
}) {
  if (!department.photoUrl) {
    return (
      <div
        className="structure-unit-placeholder"
        aria-label={`Dokumentasi ${department.name} belum tersedia`}
      >
        <ImageIcon aria-hidden="true" />
        <span>{department.code || "IKMI"}</span>
      </div>
    );
  }

  return (
    <Image
      src={department.photoUrl}
      alt={`Dokumentasi ${department.name}`}
      fill
      priority={priority}
      sizes="(max-width: 767px) 90vw, (max-width: 1199px) 42vw, 340px"
      className="structure-unit-image"
    />
  );
}

function UnitButton({
  department,
  lead = false,
  onOpen,
}: {
  department: DepartmentData;
  lead?: boolean;
  onOpen: (button: HTMLButtonElement) => void;
}) {
  return (
    <button
      type="button"
      className={`structure-unit-card${lead ? " structure-unit-card--lead" : ""}`}
      onClick={(event) => onOpen(event.currentTarget)}
      aria-label={`Lihat pengurus ${department.name}`}
    >
      <div className="structure-unit-photo">
        <DepartmentImage department={department} priority={lead} />
      </div>

      <div className="structure-unit-caption">
        <div className="min-w-0 flex-1 text-left">
          {lead ? (
            <span className="structure-unit-meta">
              {department.memberCount} Pengurus
            </span>
          ) : null}
          <h2 title={department.name}>{department.name}</h2>
        </div>

        <span className="structure-unit-arrow" aria-hidden="true">
          <ArrowRight />
        </span>
      </div>
    </button>
  );
}

export function DepartmentGrid({
  leadDepartment,
  departments,
}: DepartmentGridProps) {
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const allDepartments = leadDepartment
    ? [leadDepartment, ...departments]
    : departments;

  const selectedDept = allDepartments.find(
    (department) => department.id === selectedDeptId,
  );

  useEffect(() => {
    if (!selectedDeptId) return;

    const previousOverflow = document.body.style.overflow;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedDeptId(null);
        window.requestAnimationFrame(() => activeTriggerRef.current?.focus());
      }
    };

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedDeptId]);

  const openDepartment =
    (departmentId: string) => (button: HTMLButtonElement) => {
      activeTriggerRef.current = button;
      setSelectedDeptId(departmentId);
    };

  const closeDepartment = () => {
    setSelectedDeptId(null);
    window.requestAnimationFrame(() => activeTriggerRef.current?.focus());
  };

  return (
    <>
      <div className="structure-chart">
        {leadDepartment ? (
          <div className="structure-chart-lead">
            <UnitButton
              department={leadDepartment}
              lead
              onOpen={openDepartment(leadDepartment.id)}
            />
          </div>
        ) : null}

        <div
          className={`structure-chart-departments${
            leadDepartment ? " structure-chart-departments--connected" : ""
          }`}
        >
          {departments.map((department) => (
            <div className="structure-chart-node" key={department.id}>
              <UnitButton
                department={department}
                onOpen={openDepartment(department.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {selectedDept ? (
        <div
          className="structure-modal-backdrop"
          role="presentation"
          onMouseDown={closeDepartment}
        >
          <section
            className="structure-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="structure-modal-title"
            aria-describedby="structure-modal-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="structure-modal-handle" aria-hidden="true" />

            <header className="structure-modal-header">
              <div className="structure-modal-heading">
                <p>Struktur Anggota</p>
                <h2 id="structure-modal-title">{selectedDept.name}</h2>
                <span id="structure-modal-description">
                  {selectedDept.memberCount} pengurus ·{" "}
                  {selectedDept.description}
                </span>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                className="structure-modal-close"
                onClick={closeDepartment}
                aria-label="Tutup detail departemen"
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className="structure-modal-members">
              {selectedDept.users.map((user, index) => (
                <StrukturCard
                  key={user.id}
                  member={{
                    ...user,
                    unitName: selectedDept.name,
                  }}
                  priority={index < 2}
                />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
