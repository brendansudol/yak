import { ISegment } from "@/types"
import { useMemo } from "react"

interface IProps {
  segments: ISegment[]
  currentId?: number
  onSelect?: (segment: ISegment) => void
}

export function Transcript({ segments, currentId, onSelect }: IProps) {
  const parsed = useMemo(() => parse(segments), [segments])

  return (
    <div>
      {parsed.map((bin, idx) => (
        <div key={idx} className="mb-6 relative">
          <div className="sm:absolute sm:top-0 sm:right-full sm:mr-2 sm:mt-1 mono text-xs leading-normal text-slate-400">
            {formatTime(bin.start)}
          </div>
          {bin.segments.map((segment) => (
            <span
              key={segment.id}
              className={
                segment.id === currentId ? "bg-teal-100 hover:bg-teal-200" : "hover:bg-slate-100"
              }
              onDoubleClick={() => onSelect?.(segment)}
            >
              {segment.text.trim()}{" "}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

function parse(segments: ISegment[]) {
  const total = segments[segments.length - 1].end
  const window = total >= 60 * 15 ? 60 : total > 60 * 2 ? 30 : 15

  const bins: { segments: ISegment[]; start: number }[] = []
  for (const segment of segments) {
    const idx = Math.floor(segment.start / window)
    if (bins[idx] == null) bins[idx] = { start: idx * window, segments: [] }
    bins[idx].segments.push(segment)
  }

  return bins
}

function formatTime(time: number) {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
