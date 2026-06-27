"use client"

type LinkifyTextProps = {
  text: string | null | undefined
}

const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi

export default function LinkifyText({ text }: LinkifyTextProps) {
  if (!text) return <span>-</span>

  const parts = text.split(urlRegex)

  return (
    <>
      {parts.map((part, index) => {
        const isUrl = part.match(urlRegex)

        if (!isUrl) {
          return <span key={index}>{part}</span>
        }

        const href = part.startsWith("http") ? part : `https://${part}`

        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 underline underline-offset-2 dark:text-blue-400"
          >
            {part}
          </a>
        )
      })}
    </>
  )
}