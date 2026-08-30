import Image from 'next/image'

export type StrukturCardMember = {
  id: string
  name: string
  positionName: string
  unitName: string
  photoUrl?: string | null
}

export function StrukturCard({
  member,
  priority = false,
}: {
  member: StrukturCardMember
  priority?: boolean
}) {
  const memberInitials = member.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <article
      className="structure-member-card"
      aria-label={`${member.name}, ${member.positionName}, ${member.unitName}`}
    >
      <div className="structure-member-photo">
        {member.photoUrl ? (
          <Image
            src={member.photoUrl}
            alt={`${member.name}, ${member.positionName}`}
            fill
            sizes="(max-width: 639px) 80px, 80px"
            className="structure-member-image"
            priority={priority}
          />
        ) : (
          <div
            className="structure-member-initials"
            aria-hidden="true"
          >
            {memberInitials || 'IK'}
          </div>
        )}
      </div>

      <div className="structure-member-copy">
        <p>{member.positionName}</p>
        <h3>{member.name}</h3>
        <span>{member.unitName}</span>
      </div>
    </article>
  )
}
