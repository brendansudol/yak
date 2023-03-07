import Head from "next/head"
import React, { FormEvent, useCallback, useRef, useState } from "react"
import { Transcript } from "@/components/Transcript"
import { IResults, ISegment } from "@/types"

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [results, setResults] = useState<IResults>()
  const [currentSegment, setCurrentSegment] = useState<ISegment>()

  const handleTimeUpdate = useCallback(
    (e: FormEvent<HTMLAudioElement>) => {
      const { currentTime: time } = e.currentTarget
      const curr = currentSegment
      if (results == null || (curr != null && curr.start <= time && time < curr.end)) return
      const idx = findSegmentIdx(results.segments, time)
      setCurrentSegment(results.segments[idx])
    },
    [currentSegment, results]
  )

  const handleTextClick = useCallback((segment: ISegment) => {
    const audio = audioRef.current
    if (audio == null) return
    setCurrentSegment(segment)
    audio.currentTime = segment.start + 0.01
    if (audio.paused) audio.play()
  }, [])

  const handleUpload = useCallback(async (e: FormEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file == null) return

    const formData = new FormData()
    formData.append("file", file)

    // TODO: error handling
    const response = await fetch("/api/transcribe", { method: "POST", body: formData })
    const { results } = await response.json()
    console.log(results)
    setResults(results)

    if (audioRef.current == null) return
    const url = URL.createObjectURL(file)
    audioRef.current.src = url
    audioRef.current.play()
  }, [])

  return (
    <>
      <Head>
        <title>yak</title>
        <meta name="description" content="TODO" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="mx-auto p-6 sm:px-10 max-w-screen-sm min-h-screen">
        <input type="file" onChange={handleUpload} accept=".mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm" />
        <audio className="my-6" ref={audioRef} onTimeUpdate={handleTimeUpdate} controls />
        {results && (
          <Transcript
            segments={results.segments}
            currentId={currentSegment?.id}
            onSelect={handleTextClick}
          />
        )}
      </main>
    </>
  )
}

function findSegmentIdx(segments: ISegment[], target: number) {
  let [lo, hi] = [0, segments.length]
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2)
    if (target >= segments[mid].end) lo = mid + 1
    else hi = mid
  }
  return lo
}
